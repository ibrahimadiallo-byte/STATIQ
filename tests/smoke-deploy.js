/**
 * Smoke test for deployed backend. Run after deploying to Vercel.
 * Usage: DEPLOY_URL=https://your-app.vercel.app node tests/smoke-deploy.js
 * Requires: DEPLOY_URL (base URL, no trailing slash)
 */
const base = process.env.DEPLOY_URL?.replace(/\/$/, '');
if (!base) {
  console.log('Usage: DEPLOY_URL=https://your-app.vercel.app node tests/smoke-deploy.js');
  process.exit(1);
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

async function fetchJSON(url) {
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

(async () => {
  console.log(`Smoke test: ${base}\n`);

  const health = await fetchJSON(`${base}/api/health`);
  if (health.status === 200 && health.body?.ok === true) {
    ok('GET /api/health returns 200 and { ok: true }');
  } else {
    fail('GET /api/health', `status=${health.status} body=${JSON.stringify(health.body)}`);
  }

  const search = await fetchJSON(`${base}/api/players/search?q=mbappe`);
  if (search.status === 200 && (search.body?.player || search.body?.error)) {
    ok('GET /api/players/search returns 200 with player or error');
  } else if (search.status === 503) {
    ok('GET /api/players/search returns 503 (env not set on Vercel — add env vars)');
  } else {
    fail('GET /api/players/search', `status=${search.status}`);
  }

  console.log('');
  console.log(`Smoke test: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
