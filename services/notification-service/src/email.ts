import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const resend = new Resend(process.env['RESEND_API_KEY'] || 'dummy');
const FROM = process.env['EMAIL_FROM'] || 'AuraPerfume <noreply@auraperfume.com>';
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] || 'admin@auraperfume.com';

// Gmail SMTP Transport
const gmailUser = process.env['GMAIL_USER'];
const gmailAppPassword = process.env['GMAIL_APP_PASSWORD'];

let transporter: nodemailer.Transporter | null = null;

if (gmailUser && gmailAppPassword) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
  console.log(`[Notification Service] Gmail SMTP configured successfully for user: ${gmailUser}`);
} else {
  console.log(`[Notification Service] Resend/Log configured. (No Gmail SMTP environment variables detected)`);
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    if (transporter && gmailUser) {
      // Send email via Gmail SMTP
      await transporter.sendMail({
        from: `"AuraPerfume" <${gmailUser}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      console.log(`[SMTP] Email successfully sent to ${payload.to} via Gmail SMTP.`);
      return { success: true };
    } else {
      // Fallback to Resend API
      const resendApiKey = process.env['RESEND_API_KEY'];
      if (resendApiKey && resendApiKey !== 're_your_resend_api_key' && !resendApiKey.startsWith('dummy')) {
        await resend.emails.send({ from: FROM, to: payload.to, subject: payload.subject, html: payload.html });
        console.log(`[Resend] Email successfully sent to ${payload.to} via Resend.`);
        return { success: true };
      } else {
        console.log(`[Email Mock Log]\nTo: ${payload.to}\nSubject: ${payload.subject}\nContent: ${payload.html.replace(/<[^>]*>/g, '')}`);
        return { success: true };
      }
    }
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: String(err) };
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

const baseTemplate = (content: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:#f8f6f3}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
.header{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px;text-align:center}
.header h1{color:#d4af37;margin:0;font-size:28px;letter-spacing:2px}
.header p{color:#ccc;margin:5px 0 0;font-size:12px;letter-spacing:4px}
.body{padding:30px}
.btn{display:inline-block;background:linear-gradient(135deg,#d4af37,#b8860b);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:15px 0}
.footer{background:#f0ece4;padding:20px;text-align:center;font-size:12px;color:#888}
</style></head><body>
<div class="container">
  <div class="header"><h1>AuraPerfume</h1><p>LUXURY FRAGRANCES</p></div>
  <div class="body">${content}</div>
  <div class="footer">© 2024 AuraPerfume. All rights reserved.</div>
</div></body></html>`;

export const emailTemplates = {
  otpLogin: (name: string, code: string) => ({
    subject: '🔑 AuraPerfume Security Verification Code',
    html: baseTemplate(`
      <h2>Security Verification Code</h2>
      <p>Hello ${name},</p>
      <p>You requested a secure verification code to sign into your AuraPerfume account.</p>
      <div style="background:#f8f6f3;padding:25px;border-radius:8px;text-align:center;margin:20px 0;border:1px solid #e0ece4">
        <span style="font-size:32px;font-weight:700;color:#d4af37;letter-spacing:6px;font-family:monospace">${code}</span>
        <p style="margin:10px 0 0 0;font-size:12px;color:#888">This code is active for 5 minutes.</p>
      </div>
      <p>If you did not request this login attempt, please ignore this email.</p>
    `)
  }),
  welcome: (name: string) => ({
    subject: 'Welcome to AuraPerfume ✨',
    html: baseTemplate(`<h2>Welcome, ${name}!</h2><p>Thank you for joining AuraPerfume. Discover our exquisite collection of luxury fragrances crafted for the discerning connoisseur.</p><a href="${process.env['NEXT_PUBLIC_APP_URL']}/products" class="btn">Explore Collection</a>`)
  }),
  verifyAccount: (name: string, token: string) => ({
    subject: 'Verify Your AuraPerfume Account',
    html: baseTemplate(`<h2>Hello ${name},</h2><p>Please verify your email to activate your account.</p><a href="${process.env['NEXT_PUBLIC_APP_URL']}/auth/verify/${token}" class="btn">Verify Email</a><p style="color:#888;font-size:13px">This link expires in 24 hours.</p>`)
  }),
  forgotPassword: (name: string, token: string) => ({
    subject: 'Reset Your Password — AuraPerfume',
    html: baseTemplate(`<h2>Hi ${name},</h2><p>We received a request to reset your password.</p><a href="${process.env['NEXT_PUBLIC_APP_URL']}/auth/reset-password?token=${token}" class="btn">Reset Password</a><p style="color:#888;font-size:13px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>`)
  }),
  passwordChanged: (name: string) => ({
    subject: 'Password Changed — AuraPerfume',
    html: baseTemplate(`<h2>Hi ${name},</h2><p>Your password has been successfully changed. If you didn't make this change, please contact support immediately.</p>`)
  }),
  couponReceived: (name: string, code: string, desc: string) => ({
    subject: `🎁 You received a coupon: ${code}`,
    html: baseTemplate(`<h2>Hi ${name},</h2><p>You've received a special coupon!</p><div style="background:#f8f6f3;padding:20px;border-radius:8px;text-align:center;margin:15px 0"><h3 style="color:#d4af37;font-size:24px;margin:0">${code}</h3><p>${desc}</p></div><a href="${process.env['NEXT_PUBLIC_APP_URL']}/products" class="btn">Shop Now</a>`)
  }),
  paymentSuccess: (name: string, orderNumber: string, total: string) => ({
    subject: `Payment Confirmed — Order ${orderNumber}`,
    html: baseTemplate(`<h2>Thank you, ${name}!</h2><p>Your payment of <strong>${total}</strong> for order <strong>${orderNumber}</strong> has been confirmed.</p><a href="${process.env['NEXT_PUBLIC_APP_URL']}/orders" class="btn">View Order</a>`)
  }),
  invoice: (name: string, orderNumber: string, items: string, total: string) => ({
    subject: `Invoice — Order ${orderNumber}`,
    html: baseTemplate(`<h2>Invoice for ${name}</h2><p>Order: <strong>${orderNumber}</strong></p>${items}<hr style="border:1px solid #eee"><p style="font-size:18px;text-align:right"><strong>Total: ${total}</strong></p>`)
  }),
  orderShipped: (name: string, orderNumber: string) => ({
    subject: `🚚 Order ${orderNumber} Shipped!`,
    html: baseTemplate(`<h2>Great news, ${name}!</h2><p>Your order <strong>${orderNumber}</strong> has been shipped and is on its way to you.</p><a href="${process.env['NEXT_PUBLIC_APP_URL']}/orders" class="btn">Track Order</a>`)
  }),
  orderDelivered: (name: string, orderNumber: string) => ({
    subject: `📦 Order ${orderNumber} Delivered!`,
    html: baseTemplate(`<h2>Hello ${name},</h2><p>Your order <strong>${orderNumber}</strong> has been delivered. We hope you love your new fragrance!</p><a href="${process.env['NEXT_PUBLIC_APP_URL']}/orders" class="btn">Leave a Review</a>`)
  }),
  // Admin emails
  newOrderAdmin: (orderNumber: string, total: string, customer: string) => ({
    subject: `🛒 New Order: ${orderNumber}`,
    html: baseTemplate(`<h2>New Order Received</h2><p><strong>Order:</strong> ${orderNumber}</p><p><strong>Customer:</strong> ${customer}</p><p><strong>Total:</strong> ${total}</p>`)
  }),
  failedPaymentAdmin: (orderNumber: string, customer: string) => ({
    subject: `⚠️ Payment Failed: ${orderNumber}`,
    html: baseTemplate(`<h2>Payment Failed</h2><p><strong>Order:</strong> ${orderNumber}</p><p><strong>Customer:</strong> ${customer}</p><p>Please review and take action.</p>`)
  }),
  stockAlertAdmin: (productName: string, quantity: number) => ({
    subject: `📉 Low Stock Alert: ${productName}`,
    html: baseTemplate(`<h2>Low Stock Alert</h2><p><strong>${productName}</strong> has only <strong>${quantity}</strong> units remaining.</p><p>Please restock soon.</p>`)
  }),
};

export { ADMIN_EMAIL };
