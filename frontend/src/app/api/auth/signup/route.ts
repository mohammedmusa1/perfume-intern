import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// In-memory user store for Vercel serverless (stateless between cold starts)
// For production, replace with a database like Supabase, PlanetScale, Neon, etc.
const JWT_SECRET = process.env.JWT_SECRET || 'aura-perfume-jwt-secret-change-in-production-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'aura-perfume-refresh-secret-change-in-production-2024';

// Simple bcrypt-like hash using crypto (avoids native dependency issues on Vercel)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);

    // Generate JWT tokens
    const payload = { userId, email, role: 'customer' };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // In a production app, you'd save to a database here
    console.log(`[Signup] New user registered: ${email} (${firstName} ${lastName}) phone: ${phone || 'N/A'}`);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      data: {
        accessToken,
        refreshToken,
        user: { id: userId, email, firstName, lastName, role: 'customer' },
      },
    }, { status: 201 });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 });
  }
}
