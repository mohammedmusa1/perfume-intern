import express, { Request, Response } from 'express';
import client from 'prom-client';
import Docker from 'dockerode';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8002;
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const unhealthyRestarts = new client.Counter({
  name: 'docker_monitor_restarts_total',
  help: 'Total containers restarted due to unhealthy status',
  registers: [register],
});

const containersChecked = new client.Gauge({
  name: 'docker_monitor_containers_checked',
  help: 'Number of containers checked in last scan',
  registers: [register],
});

async function scanAndHeal(): Promise<string[]> {
  const restarted: string[] = [];
  try {
    const containers = await docker.listContainers({ all: true });
    containersChecked.set(containers.length);
    for (const info of containers) {
      const health = info.Status || '';
      const isUnhealthy = health.includes('unhealthy') || health.includes('Exited');
      if (isUnhealthy) {
        const name = (info.Names[0] || info.Id).replace('/', '');
        console.log(`[docker-monitor] Restarting unhealthy container: ${name}`);
        const container = docker.getContainer(info.Id);
        await container.restart();
        unhealthyRestarts.inc();
        restarted.push(name);
      }
    }
  } catch (err) {
    console.error('[docker-monitor] Docker socket error:', (err as Error).message);
  }
  return restarted;
}

// Auto-scan every 60 seconds
setInterval(async () => {
  const restarted = await scanAndHeal();
  if (restarted.length > 0) {
    console.log(`[docker-monitor] Auto-healed: ${restarted.join(', ')}`);
  }
}, 60_000);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', agent: 'docker-monitor', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/execute', async (_req: Request, res: Response) => {
  const restarted = await scanAndHeal();
  res.json({
    success: true,
    result: {
      restarted,
      count: restarted.length,
      timestamp: new Date().toISOString(),
    },
  });
});

app.listen(PORT, () => {
  console.log(`[docker-monitor-agent] Running on port ${PORT}`);
});
