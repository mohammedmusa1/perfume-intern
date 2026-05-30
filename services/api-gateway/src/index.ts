import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { collectDefaultMetrics, register } from 'prom-client';

dotenv.config({ path: '../../.env' });
collectDefaultMetrics();

const app = express();
const PORT = process.env['API_GATEWAY_PORT'] || 3000;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || 'http://localhost:4000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
  max: parseInt(process.env['RATE_LIMIT_MAX'] || '100'),
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() }));
app.get('/metrics', async (_req, res) => { res.set('Content-Type', register.contentType); res.end(await register.metrics()); });

// Service URLs
const services = {
  auth: process.env['AUTH_SERVICE_URL'] || 'http://localhost:3001',
  products: process.env['PRODUCT_SERVICE_URL'] || 'http://localhost:3002',
  cart: process.env['CART_SERVICE_URL'] || 'http://localhost:3003',
  orders: process.env['ORDER_SERVICE_URL'] || 'http://localhost:3004',
  payments: process.env['PAYMENT_SERVICE_URL'] || 'http://localhost:3005',
  coupons: process.env['COUPON_SERVICE_URL'] || 'http://localhost:3006',
  notifications: process.env['NOTIFICATION_SERVICE_URL'] || 'http://localhost:3007',
  admin: process.env['ADMIN_SERVICE_URL'] || 'http://localhost:3008',
};

// Proxy error helper
const onError = (target: string) => (err: Error, _req: any, res: any) => {
  console.error(`Proxy error to ${target}:`, err.message);
  if (res.status) {
    res.status(502).json({ success: false, message: 'Service unavailable' });
  }
};

// Mount proxy middlewares on root level to preserve path prefixes
app.use(createProxyMiddleware({
  pathFilter: '/api/auth',
  target: services.auth,
  changeOrigin: true,
  on: { error: onError(services.auth) },
}));

app.use(createProxyMiddleware({
  pathFilter: '/api/products',
  target: services.products,
  changeOrigin: true,
  on: { error: onError(services.products) },
}));

app.use(createProxyMiddleware({
  pathFilter: '/api/cart',
  target: services.cart,
  changeOrigin: true,
  on: { error: onError(services.cart) },
}));

app.use(createProxyMiddleware({
  pathFilter: '/api/orders',
  target: services.orders,
  changeOrigin: true,
  on: { error: onError(services.orders) },
}));

app.use(createProxyMiddleware({
  pathFilter: '/api/payments',
  target: services.payments,
  changeOrigin: true,
  on: { error: onError(services.payments) },
}));

app.use(createProxyMiddleware({
  pathFilter: '/api/coupons',
  target: services.coupons,
  changeOrigin: true,
  on: { error: onError(services.coupons) },
}));

app.use(createProxyMiddleware({
  pathFilter: '/api/notifications',
  target: services.notifications,
  changeOrigin: true,
  on: { error: onError(services.notifications) },
}));

app.use(createProxyMiddleware({
  pathFilter: '/api/admin',
  target: services.admin,
  changeOrigin: true,
  on: { error: onError(services.admin) },
}));

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Routes configured:', Object.entries(services).map(([k, v]) => `${k} -> ${v}`).join(', '));
});

export default app;
