import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { collectDefaultMetrics, register } from 'prom-client';
import couponRoutes from './routes';

dotenv.config({ path: '../../.env' });
collectDefaultMetrics();

const app = express();
const PORT = process.env['COUPON_SERVICE_PORT'] || 3006;

app.use(helmet());
app.use(cors({ origin: process.env['CORS_ORIGIN'] || 'http://localhost:4000', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'coupon-service' }));
app.get('/metrics', async (_req, res) => { res.set('Content-Type', register.contentType); res.end(await register.metrics()); });
app.use('/api/coupons', couponRoutes);

app.listen(PORT, () => console.log(`Coupon service running on port ${PORT}`));
export default app;
