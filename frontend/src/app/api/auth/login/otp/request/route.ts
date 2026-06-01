import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Use globalThis to share the OTP store across route modules
const globalStore = globalThis as unknown as { __otpStore?: Map<string, { code: string; expiresAt: Date }> };
if (!globalStore.__otpStore) {
  globalStore.__otpStore = new Map();
}
const otpStore = globalStore.__otpStore;

// Email template for OTP
function otpEmailHtml(name: string, code: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:#f8f6f3}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
.header{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px;text-align:center}
.header h1{color:#d4af37;margin:0;font-size:28px;letter-spacing:2px}
.header p{color:#ccc;margin:5px 0 0;font-size:12px;letter-spacing:4px}
.body{padding:30px}
.footer{background:#f0ece4;padding:20px;text-align:center;font-size:12px;color:#888}
</style></head><body>
<div class="container">
  <div class="header"><h1>AuraPerfume</h1><p>LUXURY FRAGRANCES</p></div>
  <div class="body">
    <h2>Security Verification Code</h2>
    <p>Hello ${name},</p>
    <p>You requested a secure verification code to sign into your AuraPerfume account.</p>
    <div style="background:#f8f6f3;padding:25px;border-radius:8px;text-align:center;margin:20px 0;border:1px solid #e0ece4">
      <span style="font-size:32px;font-weight:700;color:#d4af37;letter-spacing:6px;font-family:monospace">${code}</span>
      <p style="margin:10px 0 0 0;font-size:12px;color:#888">This code is active for 5 minutes.</p>
    </div>
    <p>If you did not request this login attempt, please ignore this email.</p>
  </div>
  <div class="footer">© 2024 AuraPerfume. All rights reserved.</div>
</div></body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    otpStore.set(email, { code: otp, expiresAt });

    // Derive name from email
    const nameParts = email.split('@')[0].split('.');
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Connoisseur';

    console.log(`[OTP] Generated for ${email}: ${otp} (expires in 5 mins)`);

    // Send email via Gmail SMTP
    let emailSent = false;
    let emailErrorMsg = '';

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailAppPassword) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailAppPassword,
          },
        });

        await transporter.sendMail({
          from: `"AuraPerfume" <${gmailUser}>`,
          to: email,
          subject: '🔑 AuraPerfume Security Verification Code',
          html: otpEmailHtml(firstName, otp),
        });

        emailSent = true;
        console.log(`[SMTP] OTP email sent to ${email} via Gmail SMTP`);
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        emailErrorMsg = errMsg;
        console.error('[SMTP ERROR]', errMsg);
      }
    } else {
      emailErrorMsg = 'Gmail SMTP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.';
      console.warn('[OTP] No Gmail SMTP configured. OTP:', otp);
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'OTP verification code sent successfully to your Gmail'
        : 'OTP generated (Email service offline — check server logs for OTP)',
      data: {
        // In production, NEVER return the OTP in the response.
        // This is included for development/testing convenience.
        ...(process.env.NODE_ENV !== 'production' ? { otp } : {}),
        emailSent,
        error: emailErrorMsg || undefined,
      },
    });
  } catch (err) {
    console.error('OTP request error:', err);
    return NextResponse.json({ success: false, message: 'Failed to request OTP' }, { status: 500 });
  }
}

// Export the OTP store so verify route can access it
export { otpStore };
