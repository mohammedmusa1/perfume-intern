import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from './db';

const router = Router();

function requireAdmin(req: Request, res: Response): string | null {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) { res.status(401).json({ success: false, message: 'Unauthorized' }); return null; }
  try {
    const decoded = jwt.verify(auth, process.env['JWT_SECRET']!) as { userId: string; role: string };
    if (decoded.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return null; }
    return decoded.userId;
  } catch { res.status(401).json({ success: false, message: 'Invalid token' }); return null; }
}

// Dashboard stats
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const [users, orders, revenue, products] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['customer']),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status NOT IN ($1, $2)', ['cancelled', 'refunded']),
      pool.query('SELECT COUNT(*) FROM perfumes'),
    ]);

    const recentOrders = await pool.query(
      `SELECT o.*, u.email, u.first_name, u.last_name FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 10`
    );

    const ordersByStatus = await pool.query('SELECT status, COUNT(*)::int as count FROM orders GROUP BY status');

    const revenueByMonth = await pool.query(
      `SELECT TO_CHAR(created_at, 'YYYY-MM') as month, SUM(total)::numeric as revenue FROM orders WHERE status NOT IN ('cancelled','refunded') GROUP BY month ORDER BY month DESC LIMIT 12`
    );

    const topProducts = await pool.query(
      `SELECT p.id, p.name, p.thumbnail, p.price, SUM(oi.quantity)::int as sold_count FROM order_items oi JOIN perfumes p ON p.id = oi.perfume_id GROUP BY p.id, p.name, p.thumbnail, p.price ORDER BY sold_count DESC LIMIT 10`
    );

    const lowStock = await pool.query(
      `SELECT p.id, p.name, p.thumbnail, i.quantity, i.low_stock_threshold FROM inventory i JOIN perfumes p ON p.id = i.perfume_id WHERE i.quantity <= i.low_stock_threshold ORDER BY i.quantity ASC`
    );

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(users.rows[0].count),
        totalOrders: parseInt(orders.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].total),
        totalProducts: parseInt(products.rows[0].count),
        recentOrders: recentOrders.rows,
        ordersByStatus: ordersByStatus.rows,
        revenueByMonth: revenueByMonth.rows,
        topProducts: topProducts.rows,
        lowStockProducts: lowStock.rows,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
});

// List users
router.get('/users', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { page = '1', limit = '20', search } = req.query;
    const pg = Math.max(1, Number(page));
    const lim = Math.min(100, Number(limit));
    const offset = (pg - 1) * lim;
    let query = 'SELECT id, email, first_name, last_name, phone, role, is_verified, created_at FROM users';
    const params: string[] = [];
    if (search) { query += ' WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1'; params.push(`%${search}%`); }
    query += ` ORDER BY created_at DESC LIMIT ${lim} OFFSET ${offset}`;
    const result = await pool.query(query, params);
    const count = await pool.query('SELECT COUNT(*) FROM users');
    res.json({ success: true, data: result.rows, pagination: { page: pg, limit: lim, total: parseInt(count.rows[0].count) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// List all orders (admin)
router.get('/orders', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { status, page = '1', limit = '20' } = req.query;
    const pg = Math.max(1, Number(page));
    const lim = Math.min(100, Number(limit));
    const offset = (pg - 1) * lim;
    let query = `SELECT o.*, u.email, u.first_name, u.last_name FROM orders o JOIN users u ON u.id = o.user_id`;
    const params: string[] = [];
    if (status) { query += ' WHERE o.status = $1'; params.push(String(status)); }
    query += ` ORDER BY o.created_at DESC LIMIT ${lim} OFFSET ${offset}`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// Stock management
router.get('/stock', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const result = await pool.query(
      `SELECT p.id, p.name, p.brand, p.thumbnail, p.price, i.quantity, i.low_stock_threshold FROM perfumes p JOIN inventory i ON i.perfume_id = p.id ORDER BY i.quantity ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stock' });
  }
});

// Payment reports
router.get('/payments', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const result = await pool.query(
      `SELECT p.*, o.order_number, u.email FROM payments p JOIN orders o ON o.id = p.order_id JOIN users u ON u.id = o.user_id ORDER BY p.created_at DESC LIMIT 50`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// Audit logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    if (!requireAdmin(req, res)) return;
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

export default router;
