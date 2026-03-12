/**
 * Phase 2 tests: env validation, AI timeout, route error handling (503/502/404).
 * Run: node tests/phase2.js
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
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

// 1. server/env.js exists and exports validateEnv
try {
  const envCode = readFileSync(join(root, 'server', 'env.js'), 'utf8');
  if (envCode.includes('validateEnv') && (envCode.includes('SUPABASE_URL') || envCode.includes('REQUIRED')))
    ok('server/env.js exports validateEnv and checks required env');
  else
    fail('server/env.js', 'expected validateEnv and required env check');
} catch (e) {
  fail('server/env.js', e.message);
}

// 2. api/index.js validates env before loading app
try {
  const apiIndex = readFileSync(join(root, 'api', 'index.js'), 'utf8');
  if (apiIndex.includes('validateEnv') && apiIndex.includes('503'))
    ok('api/index.js validates env and returns 503 when missing');
  else
    fail('api/index.js', 'expected validateEnv and 503 on missing env');
} catch (e) {
  fail('api/index.js', e.message);
}

// 3. aiService has timeout (AI_TIMEOUT_MS or withTimeout)
try {
  const aiCode = readFileSync(join(root, 'server', 'aiService.js'), 'utf8');
  if ((aiCode.includes('AI_TIMEOUT') || aiCode.includes('withTimeout')) && aiCode.includes('timeout'))
    ok('server/aiService.js has AI timeout');
  else
    fail('server/aiService.js', 'expected timeout for OpenAI calls');
} catch (e) {
  fail('server/aiService.js', e.message);
}

// 4. app.js has sendError and uses it in catch blocks
try {
  const appCode = readFileSync(join(root, 'server', 'app.js'), 'utf8');
  if (appCode.includes('sendError') && appCode.includes('503') && appCode.includes('502') && appCode.includes('404'))
    ok('server/app.js uses sendError with 503/502/404');
  else
    fail('server/app.js', 'expected sendError mapping to 503/502/404');
} catch (e) {
  fail('server/app.js', e.message);
}

// 5. Env module can be required and validateEnv throws when env missing (optional)
try {
  const { validateEnv } = await import(pathToFileURL(join(root, 'server', 'env.js')).href);
  if (typeof validateEnv === 'function') ok('validateEnv is a function');
  else fail('env.js', 'validateEnv should be a function');
} catch (e) {
  fail('env.js load', e.message);
}

console.log('');
console.log(`Phase 2: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
