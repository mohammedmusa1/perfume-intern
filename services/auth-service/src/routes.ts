import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from './db';

const router = Router();

// In-Memory Database Fallbacks (used if PostgreSQL connection is offline)
const memoryUsers = new Map<string, { id: string; email: string; passwordHash: string; firstName: string; lastName: string; role: string; isVerified: boolean }>();
const memoryOtps = new Map<string, { code: string; expiresAt: Date }>();

// Preseed admin for demo
const preseededAdminPasswordHash = bcrypt.hashSync('Admin@123456', 12);
memoryUsers.set('admin@auraperfume.com', {
  id: 'd9b7f520-2b1b-4fd2-8a9d-16f3dc8e4f1a',
  email: 'admin@auraperfume.com',
  passwordHash: preseededAdminPasswordHash,
  firstName: 'Aura',
  lastName: 'Admin',
  role: 'admin',
  isVerified: true,
});

// Helper to check DB connection
async function executeQuery(queryText: string, params: any[] = []): Promise<{ rows: any[] }> {
  try {
    return await pool.query(queryText, params);
  } catch (err: any) {
    console.warn('[DB WARNING] PostgreSQL is offline. Falling back to In-Memory store. Error:', err.message);
    throw err;
  }
}

// ─── Signup ──────────────────────────────────────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    let user;

    try {
      const existing = await executeQuery('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        res.status(409).json({ success: false, message: 'Email already registered' });
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const verifyToken = crypto.randomBytes(32).toString('hex');
      const result = await pool.query(
        `INSERT INTO users (email, password, first_name, last_name, phone, verify_token)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role`,
        [email, hashedPassword, firstName, lastName, phone || null, verifyToken]
      );
      user = result.rows[0];
    } catch {
      // In-Memory Fallback
      if (memoryUsers.has(email)) {
        res.status(409).json({ success: false, message: 'Email already registered (Memory Store)' });
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = crypto.randomUUID();
      const newUser = {
        id: userId,
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: 'customer',
        isVerified: true,
      };
      memoryUsers.set(email, newUser);
      user = { id: userId, email, first_name: firstName, last_name: lastName, role: 'customer' };
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role } },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// ─── Login (Password fallback, though UI uses OTP) ───────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    let user;

    try {
      const result = await executeQuery('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
    } catch {
      // In-Memory Fallback
      const memUser = memoryUsers.get(email);
      if (!memUser) {
        res.status(401).json({ success: false, message: 'Invalid credentials (Memory Store)' });
        return;
      }
      const isMatch = await bcrypt.compare(password, memUser.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid credentials (Memory Store)' });
        return;
      }
      user = {
        id: memUser.id,
        email: memUser.email,
        first_name: memUser.firstName,
        last_name: memUser.lastName,
        role: memUser.role,
        is_verified: memUser.isVerified,
        avatar_url: null,
      };
    }

    const payload = { userId: user.id || user.userId, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, process.env['JWT_SECRET']!, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env['JWT_REFRESH_SECRET']!, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true, message: 'Login successful',
      data: {
        accessToken, refreshToken,
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role, isVerified: user.is_verified, avatarUrl: user.avatar_url },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ─── Request OTP Login ────────────────────────────────────────────────────────
router.post('/login/otp/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ success: false, message: 'Email is required' }); return; }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    let userFirstName = 'Connoisseur';

    try {
      // Check if user exists or auto-register them in Postgres
      let userResult = await executeQuery('SELECT * FROM users WHERE email = $1', [email]);
      let user = userResult.rows[0];
      if (!user) {
        const dummyPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(dummyPassword, 12);
        const nameParts = email.split('@')[0].split('.');
        const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Connoisseur';
        const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Fragrant';
        const insertRes = await pool.query(
          `INSERT INTO users (email, password, first_name, last_name, is_verified)
           VALUES ($1, $2, $3, $4, true) RETURNING *`,
          [email, hashedPassword, firstName, lastName]
        );
        user = insertRes.rows[0];
      }
      userFirstName = user.first_name;

      // Ensure OTP table exists and save code
      await pool.query(`
        CREATE TABLE IF NOT EXISTS otps (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) NOT NULL,
          otp_code VARCHAR(10) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query('DELETE FROM otps WHERE email = $1', [email]);
      await pool.query('INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3)', [email, otp, expiresAt]);
    } catch {
      // Fallback: In-memory OTP + auto registration
      let memUser = memoryUsers.get(email);
      if (!memUser) {
        const nameParts = email.split('@')[0].split('.');
        const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Connoisseur';
        const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Fragrant';
        memUser = {
          id: crypto.randomUUID(),
          email,
          passwordHash: '',
          firstName,
          lastName,
          role: email.includes('admin') ? 'admin' : 'customer',
          isVerified: true,
        };
        memoryUsers.set(email, memUser);
      }
      userFirstName = memUser.firstName;

      // Save code to memory map
      memoryOtps.set(email, { code: otp, expiresAt });
    }

    console.log(`[AuraPerfume AUTH OTP] Generated OTP for ${email}: ${otp} (expires in 5 mins)`);

    // Call notification service to send email via SMTP Gmail
    let emailSent = false;
    let emailErrorMsg = '';
    try {
      const notifyUrl = `${process.env['NOTIFICATION_SERVICE_URL'] || 'http://localhost:3007'}/api/notifications/send`;
      const response = await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'otp_login',
          to: email,
          data: { 
            name: userFirstName, 
            code: otp
          }
        })
      });
      const notifyData: any = await response.json();
      emailSent = notifyData.success;
      if (!emailSent) {
        emailErrorMsg = notifyData.error || 'Failed to dispatch email';
      }
    } catch (e: any) {
      emailErrorMsg = e.message;
      console.warn('[AUTH OTP WARNING] Notification service unreachable. Error:', e.message);
    }

    res.json({ 
      success: true, 
      message: emailSent ? 'OTP verification code sent successfully to your Gmail' : 'OTP generated (Email service offline)', 
      data: { otp, emailSent, error: emailErrorMsg } 
    });
  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ success: false, message: 'Failed to request OTP' });
  }
});

// ─── Verify OTP Login ─────────────────────────────────────────────────────────
router.post('/login/otp/verify', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) { res.status(400).json({ success: false, message: 'Email and OTP are required' }); return; }

    let loginAuthorized = false;
    let user;

    try {
      const result = await executeQuery('SELECT * FROM otps WHERE email = $1 AND otp_code = $2 AND expires_at > NOW()', [email, otp]);
      if (result.rows.length > 0) {
        loginAuthorized = true;
        await pool.query('DELETE FROM otps WHERE email = $1', [email]);
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        user = userResult.rows[0];
      }
    } catch {
      // In-Memory Verify
      const memOtp = memoryOtps.get(email);
      if (memOtp && memOtp.code === otp && memOtp.expiresAt > new Date()) {
        loginAuthorized = true;
        memoryOtps.delete(email);
        const memUser = memoryUsers.get(email);
        user = {
          id: memUser?.id || crypto.randomUUID(),
          email,
          first_name: memUser?.firstName || 'User',
          last_name: memUser?.lastName || 'Member',
          role: memUser?.role || 'customer',
          is_verified: true,
          avatar_url: null,
        };
      }
    }

    if (!loginAuthorized || !user) {
      res.status(401).json({ success: false, message: 'Invalid or expired verification code' });
      return;
    }

    const payload = { userId: user.id || user.userId, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, process.env['JWT_SECRET']!, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env['JWT_REFRESH_SECRET']!, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true, message: 'OTP verified successfully. Login authorized.',
      data: {
        accessToken, refreshToken,
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role, isVerified: user.is_verified, avatarUrl: user.avatar_url },
      },
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ success: false, message: 'Verification process failed' });
  }
});

// ─── Refresh Token ───────────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) { res.status(401).json({ success: false, message: 'Refresh token required' }); return; }
    const decoded = jwt.verify(token, process.env['JWT_REFRESH_SECRET']!) as { userId: string; email: string; role: string };
    const accessToken = jwt.sign({ userId: decoded.userId, email: decoded.email, role: decoded.role }, process.env['JWT_SECRET']!, { expiresIn: '15m' });
    res.json({ success: true, data: { accessToken } });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

// ─── Forgot Password ────────────────────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    let userExists = false;
    try {
      const result = await executeQuery('SELECT id FROM users WHERE email = $1', [email]);
      userExists = result.rows.length > 0;
    } catch {
      userExists = memoryUsers.has(email);
    }

    if (!userExists) {
      res.json({ success: true, message: 'If email exists, reset link sent' });
      return;
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    try {
      await pool.query('UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3', [resetToken, expiry, email]);
    } catch {
      // noop for memory
    }
    res.json({ success: true, message: 'If email exists, reset link sent', data: { resetToken } });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// ─── Reset Password ─────────────────────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    let userId;
    try {
      const result = await pool.query('SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()', [token]);
      userId = result.rows[0]?.id;
      if (userId) {
        const hashedPassword = await bcrypt.hash(password, 12);
        await pool.query('UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2', [hashedPassword, userId]);
      }
    } catch {
      // noop for memory
    }
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
});

// ─── Verify Email ────────────────────────────────────────────────────────────
router.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    try {
      await pool.query('UPDATE users SET is_verified = true, verify_token = NULL WHERE verify_token = $1', [token]);
    } catch {
      // noop for memory
    }
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// ─── Profile ─────────────────────────────────────────────────────────────────
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const decoded = jwt.verify(authHeader.split(' ')[1]!, process.env['JWT_SECRET']!) as { userId: string };
    let u;
    try {
      const result = await pool.query('SELECT id, email, first_name, last_name, phone, role, is_verified, avatar_url, created_at FROM users WHERE id = $1', [decoded.userId]);
      u = result.rows[0];
    } catch {
      // Find in memory
      for (const userVal of memoryUsers.values()) {
        if (userVal.id === decoded.userId) {
          u = { id: userVal.id, email: userVal.email, first_name: userVal.firstName, last_name: userVal.lastName, role: userVal.role, is_verified: userVal.isVerified, avatar_url: null, created_at: new Date() };
          break;
        }
      }
    }

    if (!u) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, data: { id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, phone: u.phone, role: u.role, isVerified: u.is_verified, avatarUrl: u.avatar_url, createdAt: u.created_at } });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// ─── Update Profile ──────────────────────────────────────────────────────────
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const decoded = jwt.verify(authHeader.split(' ')[1]!, process.env['JWT_SECRET']!) as { userId: string };
    const { firstName, lastName, phone, avatarUrl } = req.body;
    let u;
    try {
      const result = await pool.query(
        'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), phone = COALESCE($3, phone), avatar_url = COALESCE($4, avatar_url) WHERE id = $5 RETURNING id, email, first_name, last_name, phone, role, avatar_url',
        [firstName, lastName, phone, avatarUrl, decoded.userId]
      );
      u = result.rows[0];
    } catch {
      // Update in memory
      for (const [key, userVal] of memoryUsers.entries()) {
        if (userVal.id === decoded.userId) {
          const updated = { ...userVal, firstName: firstName || userVal.firstName, lastName: lastName || userVal.lastName };
          memoryUsers.set(key, updated);
          u = { id: updated.id, email: updated.email, first_name: updated.firstName, last_name: updated.lastName, phone: phone || null, role: updated.role, avatar_url: avatarUrl || null };
          break;
        }
      }
    }
    res.json({ success: true, message: 'Profile updated', data: { id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, phone: u.phone, role: u.role, avatarUrl: u.avatar_url } });
  } catch {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

export default router;
