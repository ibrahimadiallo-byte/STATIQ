/**
 * Env validation for Phase 2: fail fast with clear message if required vars missing.
 * Required for all API: SUPABASE_URL, SUPABASE_ANON_KEY.
 * Required for AI routes only: OPENAI_API_KEY.
 */
const REQUIRED = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const REQUIRED_FOR_AI = ['OPENAI_API_KEY'];

function getMissing(keys) {
  return keys.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
}

export function validateEnv() {
  const missing = getMissing(REQUIRED);
  if (missing.length) {
    throw new Error(`Missing required env: ${missing.join(', ')}. Set them in .env or Vercel.`);
  }
}

export function validateEnvForAI() {
  validateEnv();
  const missing = getMissing(REQUIRED_FOR_AI);
  if (missing.length) {
    throw new Error(`Missing required env for AI: ${missing.join(', ')}.`);
  }
}

export function hasAIEnv() {
  return getMissing(REQUIRED_FOR_AI).length === 0;
}
