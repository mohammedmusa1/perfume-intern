import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from './db';
import { sendEmail, emailTemplates, ADMIN_EMAIL } from './email';

const router = Router();

function getUser(req: Request): { userId: string; role: string } | null {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return null;
  try { return jwt.verify(auth, process.env['JWT_SECRET']!) as { userId: string; role: string }; } catch { return null; }
}

// Send notification email
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { type, to, data } = req.body;
    let emailContent: { subject: string; html: string } | null = null;

    switch (type) {
      case 'welcome': emailContent = emailTemplates.welcome(data.name); break;
      case 'otp_login': emailContent = emailTemplates.otpLogin(data.name, data.code); break;
      case 'verify_account': emailContent = emailTemplates.verifyAccount(data.name, data.token); break;
      case 'forgot_password': emailContent = emailTemplates.forgotPassword(data.name, data.token); break;
      case 'password_changed': emailContent = emailTemplates.passwordChanged(data.name); break;
      case 'coupon_received': emailContent = emailTemplates.couponReceived(data.name, data.code, data.description); break;
      case 'payment_success': emailContent = emailTemplates.paymentSuccess(data.name, data.orderNumber, data.total); break;
      case 'invoice': emailContent = emailTemplates.invoice(data.name, data.orderNumber, data.items, data.total); break;
      case 'order_shipped': emailContent = emailTemplates.orderShipped(data.name, data.orderNumber); break;
      case 'order_delivered': emailContent = emailTemplates.orderDelivered(data.name, data.orderNumber); break;
      case 'new_order_admin': emailContent = emailTemplates.newOrderAdmin(data.orderNumber, data.total, data.customer); break;
      case 'failed_payment_admin': emailContent = emailTemplates.failedPaymentAdmin(data.orderNumber, data.customer); break;
      case 'stock_alert_admin': emailContent = emailTemplates.stockAlertAdmin(data.productName, data.quantity); break;
      default: res.status(400).json({ success: false, message: 'Unknown notification type' }); return;
    }

    const recipient = type.endsWith('_admin') ? ADMIN_EMAIL : to;
    const result = await sendEmail({ to: recipient, ...emailContent });

    // Log email (wrapped in try-catch so it won't crash when DB is offline)
    try {
      await pool.query(
        'INSERT INTO email_logs (recipient, subject, type, status, error) VALUES ($1,$2,$3,$4,$5)',
        [recipient, emailContent.subject, type, result.success ? 'sent' : 'failed', result.error || null]
      );
    } catch (err: any) {
      console.warn('[Notification DB Warning] Could not save email log to DB:', err.message);
    }

    // Create notification record if userId provided (wrapped in try-catch)
    if (data.userId) {
      try {
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, metadata) VALUES ($1,$2,$3,$4,$5)',
          [data.userId, type, emailContent.subject, emailContent.subject, JSON.stringify(data)]
        );
      } catch (err: any) {
        console.warn('[Notification DB Warning] Could not save user notification to DB:', err.message);
      }
    }

    if (!result.success) {
      res.status(500).json({ success: false, message: 'Email dispatch failed', error: result.error });
      return;
    }

    res.json({ success: true, message: 'Notification sent successfully' });
  } catch (err: any) {
    console.error('Notification error:', err);
    res.status(500).json({ success: false, message: 'Notification failed', error: err.message });
  }
});

// Get user notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    try {
      const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [user.userId]);
      res.json({ success: true, data: result.rows });
    } catch {
      // Offline fallback
      res.json({ success: true, data: [] });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Mark as read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    try {
      await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, user.userId]);
    } catch {}
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

// Mark all as read
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    try {
      await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [user.userId]);
    } catch {}
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// Admin: email logs
router.get('/email-logs', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user || user.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
    try {
      const result = await pool.query('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100');
      res.json({ success: true, data: result.rows });
    } catch {
      res.json({ success: true, data: [] });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

export default router;
