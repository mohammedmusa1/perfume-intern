import express, { Request, Response } from 'express';
import client from 'prom-client';
import * as fs from 'fs';
import * as path from 'path';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8001;
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const executionsTotal = new client.Counter({
  name: 'codegen_executions_total',
  help: 'Total number of codegen executions',
  registers: [register],
});

// GET /health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', agent: 'codegen', timestamp: new Date().toISOString() });
});

// GET /metrics
app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// POST /execute
app.post('/execute', (req: Request, res: Response) => {
  executionsTotal.inc();
  const { target = 'docker-compose' } = req.body as { target?: string };

  const configSummary = {
    generated: true,
    target,
    timestamp: new Date().toISOString(),
    message: `Config for ${target} generated/updated by codegen agent`,
    files: [
      'docker-compose.yml',
      'kubernetes/namespace.yaml',
      'kubernetes/deployments.yaml',
      '.env.example',
    ],
  };

  console.log(`[codegen] Executed config generation for target: ${target}`);
  res.json({ success: true, result: configSummary });
});

app.listen(PORT, () => {
  console.log(`[codegen-agent] Running on port ${PORT}`);
});
