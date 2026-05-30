// =============================================================================
// AuraPerfume — Shared Types
// =============================================================================

// ─── User Types ──────────────────────────────────────────────────────────────

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export interface IUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  verifyToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
}

// ─── Product Types ───────────────────────────────────────────────────────────

export enum PerfumeCategory {
  MEN = 'men',
  WOMEN = 'women',
  UNISEX = 'unisex',
}

export enum FragranceFamily {
  LUXURY = 'luxury',
  OUD = 'oud',
  FLORAL = 'floral',
  WOODY = 'woody',
  FRESH = 'fresh',
  ORIENTAL = 'oriental',
  CITRUS = 'citrus',
  AQUATIC = 'aquatic',
}

export interface IPerfume {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  category: PerfumeCategory;
  fragranceFamily: FragranceFamily;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  sizeML: number;
  images: string[];
  thumbnail: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventory {
  id: string;
  perfumeId: string;
  quantity: number;
  lowStockThreshold: number;
  updatedAt: Date;
}

export interface IReview {
  id: string;
  perfumeId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface ICategoryGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId?: string;
  sortOrder: number;
}

// ─── Cart Types ──────────────────────────────────────────────────────────────

export interface ICartItem {
  id: string;
  userId: string;
  perfumeId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  perfume?: IPerfume;
}

export interface ICart {
  items: ICartItem[];
  totalItems: number;
  subtotal: number;
  discount: number;
  total: number;
}

// ─── Order Types ─────────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  UPI = 'upi',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  NET_BANKING = 'net_banking',
}

export interface IOrderItem {
  id: string;
  orderId: string;
  perfumeId: string;
  quantity: number;
  price: number;
  perfume?: IPerfume;
}

export interface IOrder {
  id: string;
  userId: string;
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  shippingAddressId: string;
  shippingAddress?: IAddress;
  couponId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  id: string;
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  refundId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Coupon Types ────────────────────────────────────────────────────────────

export enum CouponType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
}

export interface ICoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  isOneTime: boolean;
  maxUsages: number;
  currentUsages: number;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  usedAt: Date;
}

// ─── Notification Types ──────────────────────────────────────────────────────

export enum NotificationType {
  WELCOME = 'welcome',
  VERIFY_ACCOUNT = 'verify_account',
  FORGOT_PASSWORD = 'forgot_password',
  PASSWORD_CHANGED = 'password_changed',
  COUPON_RECEIVED = 'coupon_received',
  PAYMENT_SUCCESS = 'payment_success',
  INVOICE = 'invoice',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  NEW_ORDER_ADMIN = 'new_order_admin',
  FAILED_PAYMENT_ADMIN = 'failed_payment_admin',
  STOCK_ALERT_ADMIN = 'stock_alert_admin',
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IEmailLog {
  id: string;
  to: string;
  subject: string;
  type: NotificationType;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: Date;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Filter Types ────────────────────────────────────────────────────────────

export interface ProductFilters {
  category?: PerfumeCategory;
  fragranceFamily?: FragranceFamily;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'name';
  page?: number;
  limit?: number;
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  recentOrders: IOrder[];
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  topProducts: { perfume: IPerfume; soldCount: number }[];
  lowStockProducts: { perfume: IPerfume; inventory: IInventory }[];
}
