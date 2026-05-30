import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from './db';

const router = Router();

function getUserId(req: Request): string | null {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return null;
  try {
    const decoded = jwt.verify(auth, process.env['JWT_SECRET']!) as { userId: string };
    return decoded.userId;
  } catch { return null; }
}

// Get cart
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const result = await pool.query(
      `SELECT ci.*, p.name, p.slug, p.price, p.sale_price, p.thumbnail, p.brand, p.size_ml
       FROM cart_items ci JOIN perfumes p ON p.id = ci.perfume_id WHERE ci.user_id = $1 ORDER BY ci.created_at`, [userId]
    );
    const items = result.rows;
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.sale_price || item.price) * item.quantity, 0);
    res.json({ success: true, data: { items, totalItems: items.length, subtotal, discount: 0, total: subtotal } });
  } catch (err) {
    console.error('Cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
});

// Add to cart
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const { perfumeId, quantity } = req.body;
    // Check stock
    const stock = await pool.query('SELECT quantity FROM inventory WHERE perfume_id = $1', [perfumeId]);
    if (stock.rows.length === 0 || stock.rows[0].quantity < quantity) {
      res.status(400).json({ success: false, message: 'Insufficient stock' }); return;
    }
    await pool.query(
      `INSERT INTO cart_items (user_id, perfume_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, perfume_id) DO UPDATE SET quantity = cart_items.quantity + $3`, [userId, perfumeId, quantity]
    );
    res.json({ success: true, message: 'Added to cart' });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

// Update quantity
router.put('/:itemId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const { quantity } = req.body;
    await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3', [quantity, req.params.itemId, userId]);
    res.json({ success: true, message: 'Cart updated' });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
});

// Remove item
router.delete('/:itemId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [req.params.itemId, userId]);
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    console.error('Remove cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

// Clear cart
router.delete('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

export default router;
