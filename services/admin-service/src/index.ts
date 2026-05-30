import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { collectDefaultMetrics, register } from 'prom-client';
import adminRoutes from './routes';

dotenv.config({ path: '../../.env' });
collectDefaultMetrics();

const app = express();
const PORT = process.env['ADMIN_SERVICE_PORT'] || 3008;

app.use(helmet());
app.use(cors({ origin: process.env['CORS_ORIGIN'] || 'http://localhost:4000', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'admin-service' }));
app.get('/metrics', async (_req, res) => { res.set('Content-Type', register.contentType); res.end(await register.metrics()); });
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => console.log(`Admin service running on port ${PORT}`));
export default app;
