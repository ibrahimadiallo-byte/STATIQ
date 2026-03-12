/**
 * Phase 3 tests: deployment readiness — backend docs, Vercel config, package script.
 * Run: node tests/phase3.js
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// 1. README or docs mention Backend and run/deploy
try {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  if (readme.includes('Backend') && (readme.includes('BACKEND.md') || readme.includes('docs/')))
    ok('README has Backend section and links to docs');
  else
    fail('README', 'expected Backend section and link to docs');
} catch (e) {
  fail('README', e.message);
}

// 2. docs/BACKEND.md exists with run locally + env + Vercel
try {
  const backend = readFileSync(join(root, 'docs', 'BACKEND.md'), 'utf8');
  if (backend.includes('npm run server') && backend.includes('localhost'))
    ok('docs/BACKEND.md describes run locally (npm run server)');
  else
    fail('docs/BACKEND.md', 'expected npm run server and localhost');
  if (backend.includes('SUPABASE_URL') && backend.includes('OPENAI_API_KEY'))
    ok('docs/BACKEND.md lists required env vars');
  else
    fail('docs/BACKEND.md', 'expected required env vars');
  if (backend.includes('Vercel') && (backend.includes('Environment Variables') || backend.includes('env')))
    ok('docs/BACKEND.md describes Vercel deploy and env');
  else
    fail('docs/BACKEND.md', 'expected Vercel deploy steps');
} catch (e) {
  fail('docs/BACKEND.md', e.message);
}

// 3. vercel.json rewrite destination is /api/index.js
try {
  const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  const dest = vercel.rewrites?.[0]?.destination;
  if (dest && dest.includes('/api'))
    ok('vercel.json rewrites to API entrypoint (/api)');
  else
    fail('vercel.json', 'expected rewrites[0].destination to /api');
} catch (e) {
  fail('vercel.json', e.message);
}

// 4. api/index.js exports default (Express app or 503 handler)
try {
  const apiIndex = readFileSync(join(root, 'api', 'index.js'), 'utf8');
  if (apiIndex.includes('export default'))
    ok('api/index.js exports default (app or handler)');
  else
    fail('api/index.js', 'expected export default');
} catch (e) {
  fail('api/index.js', e.message);
}

// 5. package.json has server script
try {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  if (pkg.scripts?.server)
    ok('package.json has "server" script');
  else
    fail('package.json', 'missing scripts.server');
} catch (e) {
  fail('package.json', e.message);
}

console.log('');
console.log(`Phase 3: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
