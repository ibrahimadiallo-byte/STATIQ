/**
 * Backend Phase 1: APIs & env readiness.
 * Checks that required env vars are set (without printing values), then runs server health check.
 * Run: node tests/backend-apis-env.js
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENAI_API_KEY', 'RAPIDAPI_KEY'];

function hasAllEnv() {
  return REQUIRED_ENV.every((k) => process.env[k] && String(process.env[k]).trim() !== '');
}

let passed = 0;
let failed = 0;

function ok(name) {
  console.log(`  ✓ ${name}`);
  passed++;
}
function fail(name, msg) {
  console.log(`  ✗ ${name}: ${msg}`);
  failed++;
}

console.log('Backend Phase 1: APIs & env\n');

// 1. Check .env has all required keys (no values printed)
if (hasAllEnv()) {
  ok('All required env vars set (SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY, RAPIDAPI_KEY)');
} else {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  console.log(`  ⊘ Env: missing or empty (${missing.join(', ')}). Set in .env to run server health check.`);
}

// 2. If env set, start server and hit /api/health
if (hasAllEnv()) {
  try {
    const app = (await import(pathToFileURL(join(root, 'server', 'app.js')).href)).default;
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, () => resolve()));
    const port = server.address().port;
    const res = await new Promise((resolve) => {
      const req = http.request(
        { host: 'localhost', port, path: '/api/health', method: 'GET' },
        (r) => {
          let body = '';
          r.on('data', (c) => (body += c));
          r.on('end', () => resolve({ statusCode: r.statusCode, body }));
        }
      );
      req.end();
    });
    server.close();
    if (res.statusCode === 200 && res.body.includes('"ok":true'))
      ok('GET /api/health returns 200 and { ok: true }');
    else
      fail('GET /api/health', `status=${res.statusCode} body=${res.body}`);
  } catch (e) {
    fail('Server health', e.message);
  }
} else {
  console.log('  ⊘ GET /api/health (SKIP: set all 4 env vars in .env to run)');
}

// 3. docs/BACKEND.md has Phase 1 Supabase step
try {
  const doc = readFileSync(join(root, 'docs', 'BACKEND.md'), 'utf8');
  if (doc.includes('Backend Phase 1') && doc.includes('supabase/schema.sql') && doc.includes('SUPABASE_URL'))
    ok('docs/BACKEND.md has Phase 1 APIs & env steps');
  else
    fail('docs/BACKEND.md', 'expected Phase 1 and schema/Supabase steps');
} catch (e) {
  fail('docs/BACKEND.md', e.message);
}

console.log('');
console.log(`Backend Phase 1 (APIs & env): ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
