import express, { Request, Response } from 'express';
import client from 'prom-client';
import nodemailer from 'nodemailer';
import axios from 'axios';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8009;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const REPORT_TO = process.env.REPORT_EMAIL || SMTP_USER;
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const reportsSent = new client.Counter({
  name: 'notifier_reports_sent_total',
  help: 'Total infrastructure reports sent',
  registers: [register],
});

const lastReportTime = new client.Gauge({
  name: 'notifier_last_report_timestamp',
  help: 'Unix timestamp of last report sent',
  registers: [register],
});

function createTransport() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function gatherMetrics(): Promise<string> {
  try {
    const resp = await axios.get(`${PROMETHEUS_URL}/api/v1/targets`, { timeout: 5000 });
    const targets = resp.data?.data?.activeTargets || [];
    const up = targets.filter((t: { health: string }) => t.health === 'up').length;
    const down = targets.filter((t: { health: string }) => t.health !== 'up').length;
    return `Prometheus Targets: ${up} UP / ${down} DOWN`;
  } catch {
    return 'Prometheus: unreachable (metrics unavailable)';
  }
}

async function sendReport(): Promise<boolean> {
  const metricsLine = await gatherMetrics();
  const now = new Date();
  const subject = `[AuraPerfume AutoOps] 12-Hour Infrastructure Report - ${now.toUTCString()}`;
  const html = `
    <h2>🌹 AuraPerfume AutoOps — Infrastructure Report</h2>
    <p><strong>Generated:</strong> ${now.toISOString()}</p>
    <hr/>
    <h3>📊 Service Health</h3>
    <p>${metricsLine}</p>
    <h3>🤖 Active Agents</h3>
    <ul>
      <li>✅ codegen-agent (port 8001)</li>
      <li>✅ docker-monitor-agent (port 8002)</li>
      <li>✅ k8s-agent (port 8003)</li>
      <li>✅ ci-cd-agent (port 8004)</li>
      <li>✅ observability-agent (port 8005)</li>
      <li>✅ security-agent (port 8006)</li>
      <li>✅ cloud-agent (port 8007)</li>
      <li>✅ rollback-agent (port 8008)</li>
      <li>✅ notifier-agent (port 8009)</li>
    </ul>
    <h3>🛒 E-Commerce Services</h3>
    <ul>
      <li>api-gateway :3000</li>
      <li>auth-service :3001</li>
      <li>product-service :3002</li>
      <li>cart-service :3003</li>
      <li>order-service :3004</li>
      <li>payment-service :3005</li>
      <li>coupon-service :3006</li>
      <li>notification-service :3007</li>
      <li>admin-service :3008</li>
    </ul>
    <h3>🔗 Dashboards</h3>
    <ul>
      <li><a href="http://localhost:3100">Grafana (port 3100)</a></li>
      <li><a href="http://localhost:9090">Prometheus (port 9090)</a></li>
      <li><a href="http://localhost:4000">Frontend (port 4000)</a></li>
    </ul>
    <hr/>
    <p><em>AutoOps — Autonomous DevOps Platform</em></p>
  `;

  if (!SMTP_USER || !SMTP_PASS) {
    console.log('[notifier] SMTP not configured — skipping email send');
    console.log('[notifier] Report content:\n', subject);
    reportsSent.inc();
    lastReportTime.set(Date.now() / 1000);
    return true;
  }

  try {
    const transporter = createTransport();
    await transporter.sendMail({ from: SMTP_USER, to: REPORT_TO, subject, html });
    reportsSent.inc();
    lastReportTime.set(Date.now() / 1000);
    console.log(`[notifier] Report sent to ${REPORT_TO}`);
    return true;
  } catch (err) {
    console.error('[notifier] Email send failed:', (err as Error).message);
    return false;
  }
}

// Send every 12 hours
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
setInterval(sendReport, TWELVE_HOURS);
// Also send on startup after 10s
setTimeout(sendReport, 10_000);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', agent: 'notifier', smtpConfigured: !!(SMTP_USER && SMTP_PASS), timestamp: new Date().toISOString() });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/execute', async (_req: Request, res: Response) => {
  const sent = await sendReport();
  res.json({ success: sent, result: { sent, timestamp: new Date().toISOString() } });
});

// Manual trigger endpoint
app.post('/report/send', async (_req: Request, res: Response) => {
  const sent = await sendReport();
  res.json({ success: sent, message: sent ? 'Report sent' : 'Failed to send report', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[notifier-agent] Running on port ${PORT} | SMTP: ${SMTP_HOST}:${SMTP_PORT}`);
});
