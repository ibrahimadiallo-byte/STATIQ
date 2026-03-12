import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

// 1. Build guide mentions /api/index.js
try {
  const buildguide = readFileSync(join(root, 'buildguide.md'), 'utf8');
  if (buildguide.includes('/api/index.js') && !buildguide.includes('destination": "/src/index.js"'))
    ok('buildguide.md has correct vercel destination /api/index.js');
  else
    fail('buildguide.md', 'expected /api/index.js in vercel config');
} catch (e) {
  fail('buildguide.md', e.message);
}

// 2. package.json has "server" script
try {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  if (pkg.scripts && pkg.scripts.server)
    ok('package.json has "server" script');
  else
    fail('package.json', 'missing scripts.server');
} catch (e) {
  fail('package.json', e.message);
}

// 3. refreshService exists and ensureProfileFresh is used
try {
  const appCode = readFileSync(join(root, 'server', 'app.js'), 'utf8');
  if (appCode.includes('ensureProfileFresh') && appCode.includes('refreshService'))
    ok('app.js uses ensureProfileFresh from refreshService');
  else
    fail('server/app.js', 'missing ensureProfileFresh usage');
} catch (e) {
  fail('refreshService', e.message);
}

// 4. server/run.js exists
try {
  const run = readFileSync(join(root, 'server', 'run.js'), 'utf8');
  if (run.includes('listen') && run.includes('app'))
    ok('server/run.js starts Express app');
  else
    fail('server/run.js', 'expected app.listen');
} catch (e) {
  fail('server/run.js', e.message);
}

// 5. Server health (only if env set)
const hasEnv = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
if (hasEnv) {
  try {
    const appModule = await import(pathToFileURL(join(root, 'server', 'app.js')).href);
    const app = appModule.default;
    const http = await import('http');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, () => resolve()));
    const port = server.address().port;
    const res = await new Promise((resolve) => {
      const req = http.request({ host: 'localhost', port, path: '/api/health', method: 'GET' }, (r) => {
        let b = '';
        r.on('data', (c) => (b += c));
        r.on('end', () => resolve({ statusCode: r.statusCode, body: b }));
      });
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
  console.log('  ⊘ GET /api/health (SKIP: set SUPABASE_URL and SUPABASE_ANON_KEY in .env to run)');
}

console.log('');
console.log(passed + failed > 0 ? `Phase 1: ${passed} passed, ${failed} failed` : 'Phase 1: no tests run');
process.exit(failed > 0 ? 1 : 0);
