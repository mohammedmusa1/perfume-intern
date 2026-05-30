import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from './db';

const router = Router();

function getUser(req: Request): { userId: string; role: string } | null {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return null;
  try { return jwt.verify(auth, process.env['JWT_SECRET']!) as { userId: string; role: string }; } catch { return null; }
}

// Apply coupon (customer)
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const { code, orderTotal } = req.body;
    const result = await pool.query(
      `SELECT * FROM coupons WHERE code = $1 AND is_active = true AND expires_at > NOW() AND current_usages < max_usages`, [code.toUpperCase()]
    );
    if (result.rows.length === 0) { res.status(400).json({ success: false, message: 'Invalid or expired coupon' }); return; }
    const coupon = result.rows[0];
    if (orderTotal < coupon.min_order_amount) {
      res.status(400).json({ success: false, message: `Minimum order amount is ₹${coupon.min_order_amount}` }); return;
    }
    if (coupon.is_one_time) {
      const used = await pool.query('SELECT id FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2', [coupon.id, user.userId]);
      if (used.rows.length > 0) { res.status(400).json({ success: false, message: 'Coupon already used' }); return; }
    }
    let discount = coupon.type === 'percentage' ? (orderTotal * coupon.value) / 100 : coupon.value;
    if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) discount = parseFloat(coupon.max_discount);
    if (discount > orderTotal) discount = orderTotal;
    res.json({ success: true, message: 'Coupon applied', data: { couponId: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value, discount: Math.round(discount * 100) / 100 } });
  } catch (err) {
    console.error('Apply coupon error:', err);
    res.status(500).json({ success: false, message: 'Failed to apply coupon' });
  }
});

// Validate coupon
router.get('/validate/:code', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, code, type, value, min_order_amount, max_discount, is_one_time, expires_at FROM coupons WHERE code = $1 AND is_active = true AND expires_at > NOW()`, [req.params.code.toUpperCase()]
    );
    if (result.rows.length === 0) { res.status(404).json({ success: false, message: 'Coupon not found or expired' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Validation failed' });
  }
});

// ADMIN: Create coupon
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
    const { code, type, value, minOrderAmount, maxDiscount, isOneTime, maxUsages, expiresAt } = req.body;
    const result = await pool.query(
      `INSERT INTO coupons (code, type, value, min_order_amount, max_discount, is_one_time, max_usages, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [code.toUpperCase(), type, value, minOrderAmount || 0, maxDiscount || null, isOneTime || false, maxUsages || 100, expiresAt]
    );
    res.status(201).json({ success: true, message: 'Coupon created', data: result.rows[0] });
  } catch (err) {
    console.error('Create coupon error:', err);
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
});

// ADMIN: List all coupons
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
    const result = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

// ADMIN: Update coupon
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
    const { code, type, value, minOrderAmount, maxDiscount, isOneTime, maxUsages, expiresAt, isActive } = req.body;
    const result = await pool.query(
      `UPDATE coupons SET code = COALESCE($1, code), type = COALESCE($2, type), value = COALESCE($3, value), min_order_amount = COALESCE($4, min_order_amount), max_discount = COALESCE($5, max_discount), is_one_time = COALESCE($6, is_one_time), max_usages = COALESCE($7, max_usages), expires_at = COALESCE($8, expires_at), is_active = COALESCE($9, is_active) WHERE id = $10 RETURNING *`,
      [code?.toUpperCase(), type, value, minOrderAmount, maxDiscount, isOneTime, maxUsages, expiresAt, isActive, req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ success: false, message: 'Coupon not found' }); return; }
    res.json({ success: true, message: 'Coupon updated', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
});

// ADMIN: Deactivate coupon
router.put('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
    await pool.query('UPDATE coupons SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Coupon deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to deactivate coupon' });
  }
});

// ADMIN: Delete coupon
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
    await pool.query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
});

// ADMIN: Send coupon to users
router.post('/send', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
    const { couponId, userIds } = req.body;
    const coupon = await pool.query('SELECT * FROM coupons WHERE id = $1', [couponId]);
    if (coupon.rows.length === 0) { res.status(404).json({ success: false, message: 'Coupon not found' }); return; }
    // Create notifications for each user
    for (const uid of userIds) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, metadata) VALUES ($1, 'coupon_received', $2, $3, $4)`,
        [uid, `You received coupon: ${coupon.rows[0].code}`, `Use code ${coupon.rows[0].code} to get ${coupon.rows[0].type === 'percentage' ? coupon.rows[0].value + '%' : '₹' + coupon.rows[0].value} off!`, JSON.stringify({ couponId, code: coupon.rows[0].code })]
      );
    }
    res.json({ success: true, message: `Coupon sent to ${userIds.length} user(s)` });
  } catch (err) {
    console.error('Send coupon error:', err);
    res.status(500).json({ success: false, message: 'Failed to send coupon' });
  }
});

// ADMIN: Usage tracking
router.get('/:id/usage', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
    const result = await pool.query(
      `SELECT cu.*, u.email, u.first_name, u.last_name FROM coupon_usage cu JOIN users u ON u.id = cu.user_id WHERE cu.coupon_id = $1 ORDER BY cu.used_at DESC`, [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch usage' });
  }
});

export default router;
