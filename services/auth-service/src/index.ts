import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { collectDefaultMetrics, register } from 'prom-client';
import authRoutes from './routes';

dotenv.config({ path: '../../.env' });
collectDefaultMetrics();

const app = express();
const PORT = process.env['AUTH_SERVICE_PORT'] || 3001;

app.use(helmet());
app.use(cors({ origin: process.env['CORS_ORIGIN'] || 'http://localhost:4000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));
app.get('/metrics', async (_req, res) => { res.set('Content-Type', register.contentType); res.end(await register.metrics()); });
app.use('/api/auth', authRoutes);

app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));
export default app;
