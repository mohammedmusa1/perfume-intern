import express, { Request, Response } from 'express';
import client from 'prom-client';
import axios from 'axios';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8004;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'mohammedmusa1/perfume-intern';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const buildsChecked = new client.Counter({
  name: 'cicd_builds_checked_total',
  help: 'Total CI/CD build checks performed',
  registers: [register],
});

const buildFailures = new client.Counter({
  name: 'cicd_build_failures_total',
  help: 'Total CI/CD build failures detected',
  registers: [register],
});

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
}

async function checkBuilds(): Promise<WorkflowRun[]> {
  buildsChecked.inc();
  if (!GITHUB_TOKEN) {
    return [{ id: 0, name: 'mock-build', status: 'completed', conclusion: 'success', html_url: '#', created_at: new Date().toISOString() }];
  }
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=10`;
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
    });
    const runs: WorkflowRun[] = resp.data.workflow_runs || [];
    runs.forEach((r) => {
      if (r.conclusion === 'failure') {
        buildFailures.inc();
        console.warn(`[ci-cd] FAILED build: ${r.name} at ${r.html_url}`);
      }
    });
    return runs;
  } catch (err) {
    console.error('[ci-cd] GitHub API error:', (err as Error).message);
    return [];
  }
}

// Check every 5 minutes
setInterval(checkBuilds, 5 * 60_000);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', agent: 'ci-cd', repo: GITHUB_REPO, timestamp: new Date().toISOString() });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/execute', async (_req: Request, res: Response) => {
  const runs = await checkBuilds();
  res.json({ success: true, result: { runs: runs.slice(0, 5), timestamp: new Date().toISOString() } });
});

app.listen(PORT, () => {
  console.log(`[ci-cd-agent] Running on port ${PORT}`);
});
