import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from './db';

const router = Router();

function getUser(req: Request): { userId: string; role: string } | null {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return null;
  try { return jwt.verify(auth, process.env['JWT_SECRET']!) as { userId: string; role: string }; } catch { return null; }
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AP-${ts}-${rand}`;
}

// Create order from cart
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const { shippingAddressId, couponCode, notes } = req.body;

    // Get cart items
    const cartResult = await pool.query(
      `SELECT ci.*, p.price, p.sale_price FROM cart_items ci JOIN perfumes p ON p.id = ci.perfume_id WHERE ci.user_id = $1`, [user.userId]
    );
    if (cartResult.rows.length === 0) { res.status(400).json({ success: false, message: 'Cart is empty' }); return; }

    const items = cartResult.rows;
    const subtotal = items.reduce((sum: number, item: { sale_price: number; price: number; quantity: number }) => sum + (item.sale_price || item.price) * item.quantity, 0);
    let discount = 0;
    let couponId: string | null = null;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await pool.query(
        `SELECT * FROM coupons WHERE code = $1 AND is_active = true AND expires_at > NOW() AND current_usages < max_usages`, [couponCode.toUpperCase()]
      );
      if (coupon.rows.length > 0) {
        const c = coupon.rows[0];
        if (subtotal >= c.min_order_amount) {
          if (c.type === 'percentage') { discount = (subtotal * c.value) / 100; }
          else { discount = c.value; }
          if (c.max_discount && discount > c.max_discount) discount = c.max_discount;
          couponId = c.id;
        }
      }
    }

    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const shippingCost = subtotal >= 2000 ? 0 : 99;
    const total = Math.round((subtotal - discount + tax + shippingCost) * 100) / 100;
    const orderNumber = generateOrderNumber();

    // Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, order_number, subtotal, discount, tax, shipping_cost, total, shipping_address_id, coupon_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [user.userId, orderNumber, subtotal, discount, tax, shippingCost, total, shippingAddressId, couponId, notes || null]
    );

    // Insert order items
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, perfume_id, quantity, price) VALUES ($1,$2,$3,$4)',
        [orderResult.rows[0].id, item.perfume_id, item.quantity, item.sale_price || item.price]
      );
      // Decrease inventory
      await pool.query('UPDATE inventory SET quantity = quantity - $1 WHERE perfume_id = $2', [item.quantity, item.perfume_id]);
    }

    // Update coupon usage
    if (couponId) {
      await pool.query('UPDATE coupons SET current_usages = current_usages + 1 WHERE id = $1', [couponId]);
      await pool.query('INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount) VALUES ($1,$2,$3,$4)', [couponId, user.userId, orderResult.rows[0].id, discount]);
    }

    // Clear cart
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [user.userId]);

    res.status(201).json({ success: true, message: 'Order created', data: orderResult.rows[0] });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Get user orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [user.userId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const result = await pool.query('SELECT * FROM orders WHERE id = $1 AND (user_id = $2 OR $3 = \'admin\')', [req.params.id, user.userId, user.role]);
    if (result.rows.length === 0) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    const items = await pool.query(
      'SELECT oi.*, p.name, p.thumbnail, p.brand FROM order_items oi JOIN perfumes p ON p.id = oi.perfume_id WHERE oi.order_id = $1', [req.params.id]
    );
    const address = await pool.query('SELECT * FROM addresses WHERE id = $1', [result.rows[0].shipping_address_id]);
    res.json({ success: true, data: { ...result.rows[0], items: items.rows, shippingAddress: address.rows[0] || null } });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// Update order status (admin)
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
    const { status } = req.body;
    const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (result.rows.length === 0) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    res.json({ success: true, message: 'Order status updated', data: result.rows[0] });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

// Address CRUD
router.get('/addresses/list', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const result = await pool.query('SELECT * FROM addresses WHERE user_id = $1', [user.userId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
});

router.post('/addresses', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const { label, street, city, state, zipCode, country, isDefault } = req.body;
    if (isDefault) { await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [user.userId]); }
    const result = await pool.query(
      'INSERT INTO addresses (user_id, label, street, city, state, zip_code, country, is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [user.userId, label, street, city, state, zipCode, country || 'India', isDefault || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add address' });
  }
});

export default router;
