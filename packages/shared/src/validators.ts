import { z } from 'zod';
import { PerfumeCategory, FragranceFamily, CouponType } from './types';

// ─── Auth Validators ─────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

// ─── Product Validators ──────────────────────────────────────────────────────

export const createPerfumeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  brand: z.string().min(1, 'Brand is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().min(5).max(300),
  price: z.number().positive('Price must be positive'),
  salePrice: z.number().positive().optional(),
  category: z.nativeEnum(PerfumeCategory),
  fragranceFamily: z.nativeEnum(FragranceFamily),
  topNotes: z.array(z.string()).min(1),
  middleNotes: z.array(z.string()).min(1),
  baseNotes: z.array(z.string()).min(1),
  sizeML: z.number().positive(),
  images: z.array(z.string().url()).min(1),
  thumbnail: z.string().url(),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isTrending: z.boolean().default(false),
});

export const updatePerfumeSchema = createPerfumeSchema.partial();

export const productFilterSchema = z.object({
  category: z.nativeEnum(PerfumeCategory).optional(),
  fragranceFamily: z.nativeEnum(FragranceFamily).optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'name']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});

// ─── Cart Validators ─────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
  perfumeId: z.string().uuid('Invalid perfume ID'),
  quantity: z.number().int().positive().max(10, 'Max 10 items'),
});

export const updateCartSchema = z.object({
  quantity: z.number().int().positive().max(10, 'Max 10 items'),
});

// ─── Order Validators ────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  shippingAddressId: z.string().uuid('Invalid address ID'),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
});

// ─── Address Validators ──────────────────────────────────────────────────────

export const addressSchema = z.object({
  label: z.string().min(1).max(50),
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zipCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  isDefault: z.boolean().default(false),
});

// ─── Coupon Validators ───────────────────────────────────────────────────────

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(20)
    .transform((v) => v.toUpperCase()),
  type: z.nativeEnum(CouponType),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().default(0),
  maxDiscount: z.number().positive().optional(),
  isOneTime: z.boolean().default(false),
  maxUsages: z.number().int().positive().default(100),
  expiresAt: z.string().datetime(),
});

export const updateCouponSchema = createCouponSchema.partial();

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  orderTotal: z.number().positive(),
});

export const sendCouponSchema = z.object({
  couponId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1),
});

// ─── Review Validators ───────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  perfumeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(100),
  comment: z.string().min(5).max(1000),
});

// ─── Type exports ────────────────────────────────────────────────────────────

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePerfumeInput = z.infer<typeof createPerfumeSchema>;
export type UpdatePerfumeInput = z.infer<typeof updatePerfumeSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
