import express, { Request, Response } from 'express';
import client from 'prom-client';
import axios from 'axios';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8006;
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const scansTotal = new client.Counter({
  name: 'security_scans_total',
  help: 'Total security scans performed',
  registers: [register],
});

const issuesFound = new client.Gauge({
  name: 'security_issues_found',
  help: 'Number of issues found in last scan',
  registers: [register],
});

const SERVICE_ENDPOINTS = [
  { name: 'api-gateway', url: process.env.API_GATEWAY_URL || 'http://api-gateway:3000' },
  { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001' },
  { name: 'product-service', url: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002' },
  { name: 'cart-service', url: process.env.CART_SERVICE_URL || 'http://cart-service:3003' },
  { name: 'order-service', url: process.env.ORDER_SERVICE_URL || 'http://order-service:3004' },
];

interface ScanResult {
  service: string;
  reachable: boolean;
  hasSecurityHeaders: boolean;
  issues: string[];
}

async function runSecurityScan(): Promise<ScanResult[]> {
  scansTotal.inc();
  const results: ScanResult[] = [];
  let totalIssues = 0;

  for (const svc of SERVICE_ENDPOINTS) {
    const result: ScanResult = { service: svc.name, reachable: false, hasSecurityHeaders: false, issues: [] };
    try {
      const resp = await axios.get(`${svc.url}/health`, { timeout: 5000 });
      result.reachable = true;
      const headers = resp.headers;
      const hasHSTS = !!headers['strict-transport-security'];
      const hasCSP = !!headers['content-security-policy'];
      const hasXFrame = !!headers['x-frame-options'];
      result.hasSecurityHeaders = hasHSTS && hasCSP && hasXFrame;
      if (!hasHSTS) result.issues.push('Missing HSTS header');
      if (!hasCSP) result.issues.push('Missing Content-Security-Policy');
      if (!hasXFrame) result.issues.push('Missing X-Frame-Options');
    } catch {
      result.issues.push('Service unreachable');
    }
    totalIssues += result.issues.length;
    results.push(result);
  }

  issuesFound.set(totalIssues);
  console.log(`[security] Scan complete. Issues found: ${totalIssues}`);
  return results;
}

// Scan every 10 minutes
setInterval(runSecurityScan, 10 * 60_000);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', agent: 'security', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/execute', async (_req: Request, res: Response) => {
  const results = await runSecurityScan();
  res.json({ success: true, result: { scans: results, timestamp: new Date().toISOString() } });
});

app.listen(PORT, () => {
  console.log(`[security-agent] Running on port ${PORT}`);
});
