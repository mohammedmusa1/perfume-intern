import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// We need to share the OTP store with the request route.
// Since Next.js API routes run in the same Node.js process on Vercel (same function bundle
// if they share a common path prefix), we use a module-level global store.
// This is a simple approach that works for demo/development purposes.
// For production, use Redis, KV, or a database.

// Use globalThis to share the OTP store across route modules
const globalStore = globalThis as unknown as { __otpStore?: Map<string, { code: string; expiresAt: Date }> };
if (!globalStore.__otpStore) {
  globalStore.__otpStore = new Map();
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} environment variable is required`);
  return value;
}

const JWT_SECRET = requireEnv('JWT_SECRET', process.env.JWT_SECRET);
const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);
export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    const store = globalStore.__otpStore!;
    const storedOtp = store.get(email);

    if (!storedOtp || storedOtp.code !== otp || storedOtp.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'Invalid or expired verification code' }, { status: 401 });
    }

    // OTP valid — delete it
    store.delete(email);

    // Derive user info from email
    const nameParts = email.split('@')[0].split('.');
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'User';
    const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Member';
    const userId = crypto.randomUUID();

    // Generate JWT tokens
    const payload = { userId, email, role: 'customer' };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully. Login authorized.',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          email,
          firstName,
          lastName,
          role: 'customer',
          isVerified: true,
          avatarUrl: null,
        },
      },
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    return NextResponse.json({ success: false, message: 'Verification process failed' }, { status: 500 });
  }
}
