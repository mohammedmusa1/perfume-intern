import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from './types';

// ─── JWT Utilities ───────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export function generateAccessToken(payload: JwtPayload): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn: process.env['JWT_EXPIRES_IN'] || '15m' });
}

export function generateRefreshToken(payload: JwtPayload): string {
  const secret = process.env['JWT_REFRESH_SECRET'];
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d' });
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.verify(token, secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const secret = process.env['JWT_REFRESH_SECRET'];
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.verify(token, secret) as JwtPayload;
}

// ─── Auth Middleware ─────────────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ success: false, message: 'Invalid token format' });
      return;
    }
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  next();
}

export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      if (token) {
        req.user = verifyAccessToken(token);
      }
    } catch {
      // Token invalid, continue without auth
    }
  }
  next();
}

// ─── Error Handler ───────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: process.env['NODE_ENV'] === 'production' ? 'Internal server error' : err.message,
  });
}

// ─── Validation Middleware ───────────────────────────────────────────────────

import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Query validation failed',
          error: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

// ─── Utility Functions ───────────────────────────────────────────────────────

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AP-${timestamp}-${random}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

export function calculateDiscount(
  orderTotal: number,
  couponType: 'percentage' | 'flat',
  couponValue: number,
  maxDiscount?: number
): number {
  let discount = 0;
  if (couponType === 'percentage') {
    discount = (orderTotal * couponValue) / 100;
  } else {
    discount = couponValue;
  }
  if (maxDiscount && discount > maxDiscount) {
    discount = maxDiscount;
  }
  if (discount > orderTotal) {
    discount = orderTotal;
  }
  return Math.round(discount * 100) / 100;
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}
