import 'dotenv/config';
import { validateEnv } from '../server/env.js';

let app;
try {
  validateEnv();
  app = (await import('../server/app.js')).default;
} catch (err) {
  const message = err.message || 'Missing required environment variables';
  app = (req, res) => res.status(503).set('Content-Type', 'application/json').json({ error: message });
}

export default app;
