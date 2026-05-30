import express, { Request, Response } from 'express';
import client from 'prom-client';
import axios from 'axios';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8005;
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const scrapeAttempts = new client.Counter({
  name: 'observability_scrape_attempts_total',
  help: 'Total scrape attempts against Prometheus',
  registers: [register],
});

interface MetricSnapshot {
  up: boolean;
  services: string[];
  timestamp: string;
}

async function collectMetrics(): Promise<MetricSnapshot> {
  scrapeAttempts.inc();
  try {
    const resp = await axios.get(`${PROMETHEUS_URL}/api/v1/targets`);
    const targets = resp.data?.data?.activeTargets || [];
    const upServices: string[] = targets
      .filter((t: { health: string; labels?: { job?: string } }) => t.health === 'up')
      .map((t: { labels?: { job?: string } }) => t.labels?.job || 'unknown');
    return { up: true, services: upServices, timestamp: new Date().toISOString() };
  } catch (err) {
    console.error('[observability] Prometheus unreachable:', (err as Error).message);
    return { up: false, services: [], timestamp: new Date().toISOString() };
  }
}

setInterval(collectMetrics, 30_000);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', agent: 'observability', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/execute', async (_req: Request, res: Response) => {
  const snapshot = await collectMetrics();
  res.json({ success: true, result: snapshot });
});

app.listen(PORT, () => {
  console.log(`[observability-agent] Running on port ${PORT}`);
});
