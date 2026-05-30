import express, { Request, Response } from 'express';
import client from 'prom-client';
import * as k8s from '@kubernetes/client-node';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8003;
const NAMESPACE = process.env.K8S_NAMESPACE || 'auraperfume';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const podsRecreated = new client.Counter({
  name: 'k8s_pods_recreated_total',
  help: 'Total pods deleted to trigger recreation',
  registers: [register],
});

function getK8sClient() {
  const kc = new k8s.KubeConfig();
  try {
    kc.loadFromCluster();
  } catch {
    kc.loadFromDefault();
  }
  return kc.makeApiClient(k8s.CoreV1Api);
}

async function watchAndHeal(): Promise<{ pod: string; status: string }[]> {
  const results: { pod: string; status: string }[] = [];
  try {
    const k8sApi = getK8sClient();
    const podList = await k8sApi.listNamespacedPod(NAMESPACE);
    const pods = podList.body.items;

    for (const pod of pods) {
      const name = pod.metadata?.name || 'unknown';
      const phase = pod.status?.phase || '';
      const containerStatuses = pod.status?.containerStatuses || [];
      const isUnhealthy =
        phase === 'Failed' ||
        containerStatuses.some(
          (cs) => cs.state?.waiting?.reason === 'CrashLoopBackOff'
        );

      if (isUnhealthy) {
        await k8sApi.deleteNamespacedPod(name, NAMESPACE);
        podsRecreated.inc();
        results.push({ pod: name, status: 'recreated' });
        console.log(`[k8s-agent] Deleted unhealthy pod for recreation: ${name}`);
      } else {
        results.push({ pod: name, status: phase });
      }
    }
  } catch (err) {
    console.error('[k8s-agent] K8s API error:', (err as Error).message);
  }
  return results;
}

// Auto-scan every 90 seconds
setInterval(async () => {
  await watchAndHeal();
}, 90_000);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', agent: 'k8s', namespace: NAMESPACE, timestamp: new Date().toISOString() });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/execute', async (_req: Request, res: Response) => {
  const results = await watchAndHeal();
  res.json({ success: true, result: { pods: results, timestamp: new Date().toISOString() } });
});

app.listen(PORT, () => {
  console.log(`[k8s-agent] Running on port ${PORT}, namespace: ${NAMESPACE}`);
});
