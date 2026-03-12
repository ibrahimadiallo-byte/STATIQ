/**
 * Phase 4 tests: deploy readiness — BACKEND.md has deploy + smoke test steps;
 * run Phase 1 + 2 + 3 to ensure full flow still works.
 * Run: node tests/phase4.js
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawnSync } from 'child_process';

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

// 1. docs/BACKEND.md has deploy and smoke test section
try {
  const backend = readFileSync(join(root, 'docs', 'BACKEND.md'), 'utf8');
  if (backend.includes('Phase 4') && (backend.includes('smoke') || backend.includes('curl')))
    ok('docs/BACKEND.md has Phase 4 deploy & smoke test steps');
  else
    fail('docs/BACKEND.md', 'expected Phase 4 / smoke test / curl');
  if (backend.includes('/api/health') && backend.includes('YOUR_APP'))
    ok('docs/BACKEND.md includes health check curl example');
  else
    fail('docs/BACKEND.md', 'expected health curl with YOUR_APP');
} catch (e) {
  fail('docs/BACKEND.md', e.message);
}

// 2. Run Phase 1 + 2 + 3 (flow check)
for (const phase of ['phase1', 'phase2', 'phase3']) {
  const r = spawnSync('node', [join(root, 'tests', `${phase}.js`)], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10000,
  });
  if (r.status === 0)
    ok(`Phase 1–3 flow: ${phase} passed`);
  else
    fail(phase, r.stderr || r.stdout || `exit ${r.status}`);
}

console.log('');
console.log(`Phase 4: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
