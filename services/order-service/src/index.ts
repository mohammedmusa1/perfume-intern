import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { collectDefaultMetrics, register } from 'prom-client';
import orderRoutes from './routes';

dotenv.config({ path: '../../.env' });
collectDefaultMetrics();

const app = express();
const PORT = process.env['ORDER_SERVICE_PORT'] || 3004;

app.use(helmet());
app.use(cors({ origin: process.env['CORS_ORIGIN'] || 'http://localhost:4000', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'order-service' }));
app.get('/metrics', async (_req, res) => { res.set('Content-Type', register.contentType); res.end(await register.metrics()); });
app.use('/api/orders', orderRoutes);

app.listen(PORT, () => console.log(`Order service running on port ${PORT}`));
export default app;
