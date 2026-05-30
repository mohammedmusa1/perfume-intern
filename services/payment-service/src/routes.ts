import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from './db';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env['RAZORPAY_KEY_ID'] || '',
  key_secret: process.env['RAZORPAY_KEY_SECRET'] || '',
});

function getUser(req: Request): { userId: string } | null {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return null;
  try { return jwt.verify(auth, process.env['JWT_SECRET']!) as { userId: string }; } catch { return null; }
}

// Create payment (initiate Razorpay order)
router.post('/create', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const { orderId } = req.body;

    const order = await pool.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, user.userId]);
    if (order.rows.length === 0) { res.status(404).json({ success: false, message: 'Order not found' }); return; }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.rows[0].total * 100), // paise
      currency: 'INR',
      receipt: order.rows[0].order_number,
      notes: { orderId, userId: user.userId },
    });

    await pool.query(
      'INSERT INTO payments (order_id, razorpay_order_id, amount, currency) VALUES ($1,$2,$3,$4)',
      [orderId, razorpayOrder.id, order.rows[0].total, 'INR']
    );

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env['RAZORPAY_KEY_ID'],
      },
    });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
});

// Verify payment
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env['RAZORPAY_KEY_SECRET']!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
      return;
    }

    // Update payment
    await pool.query(
      `UPDATE payments SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'completed' WHERE razorpay_order_id = $3`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // Update order status
    const payment = await pool.query('SELECT order_id FROM payments WHERE razorpay_order_id = $1', [razorpay_order_id]);
    if (payment.rows.length > 0) {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['confirmed', payment.rows[0].order_id]);
    }

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Webhook
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env['RAZORPAY_WEBHOOK_SECRET'];
    const signature = req.headers['x-razorpay-signature'] as string;

    if (webhookSecret && signature) {
      const expectedSig = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(req.body)).digest('hex');
      if (expectedSig !== signature) { res.status(400).json({ success: false }); return; }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const paymentId = payload.payment.entity.id;
      const orderId = payload.payment.entity.notes?.orderId;
      if (orderId) {
        await pool.query(`UPDATE payments SET status = 'completed', method = $1 WHERE razorpay_payment_id = $2`, [payload.payment.entity.method, paymentId]);
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['confirmed', orderId]);
      }
    } else if (event === 'payment.failed') {
      const paymentId = payload.payment.entity.id;
      await pool.query(`UPDATE payments SET status = 'failed' WHERE razorpay_payment_id = $1`, [paymentId]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false });
  }
});

// Refund
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) { res.status(401).json({ success: false, message: 'Login required' }); return; }
    const { paymentId, amount } = req.body;

    const payment = await pool.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
    if (payment.rows.length === 0 || !payment.rows[0].razorpay_payment_id) {
      res.status(404).json({ success: false, message: 'Payment not found' }); return;
    }

    const refund = await razorpay.payments.refund(payment.rows[0].razorpay_payment_id, {
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    await pool.query(
      `UPDATE payments SET status = 'refunded', refund_id = $1, refund_amount = $2 WHERE id = $3`,
      [refund.id, (refund.amount as number) / 100, paymentId]
    );
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['refunded', payment.rows[0].order_id]);

    res.json({ success: true, message: 'Refund initiated', data: { refundId: refund.id } });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ success: false, message: 'Refund failed' });
  }
});

export default router;
