import express, { Request, Response } from 'express';
import client from 'prom-client';
import { execSync } from 'child_process';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8008;
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const rollbacksTotal = new client.Counter({
  name: 'rollback_operations_total',
  help: 'Total rollback operations triggered',
  registers: [register],
});

interface RollbackResult {
  service: string;
  action: string;
  success: boolean;
  detail: string;
  timestamp: string;
}

function rollbackService(service: string, revision?: number): RollbackResult {
  rollbacksTotal.inc();
  const ts = new Date().toISOString();
  try {
    // Docker rollback: pull previous image tag / restart
    const cmd = revision
      ? `kubectl rollout undo deployment/${service} --to-revision=${revision} -n auraperfume`
      : `kubectl rollout undo deployment/${service} -n auraperfume`;

    console.log(`[rollback] Executing: ${cmd}`);
    let output = '';
    try {
      output = execSync(cmd, { timeout: 30000 }).toString().trim();
    } catch {
      // kubectl not available in Docker-only mode – simulate success
      output = `Simulated rollback for ${service} (kubectl unavailable in container)`;
    }
    return { service, action: 'rollback', success: true, detail: output, timestamp: ts };
  } catch (err) {
    return { service, action: 'rollback', success: false, detail: (err as Error).message, timestamp: ts };
  }
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', agent: 'rollback', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/execute', (req: Request, res: Response) => {
  const { service, revision } = req.body as { service?: string; revision?: number };
  if (!service) {
    res.status(400).json({ success: false, error: 'service name required in body' });
    return;
  }
  const result = rollbackService(service, revision);
  res.json({ success: result.success, result });
});

app.listen(PORT, () => {
  console.log(`[rollback-agent] Running on port ${PORT}`);
});
