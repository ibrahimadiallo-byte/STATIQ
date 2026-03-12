/**
 * In-memory TTL cache for RapidAPI responses. Reduces throttling and keeps data fresh.
 * Keys and TTLs per BACKEND.md Live Data + Stable ID Plan.
 */

const store = new Map();

/**
 * @param {string} key
 * @param {number} ttlMs
 * @returns {any | null} Cached value or null if missing/expired
 */
export function get(key, ttlMs) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * @param {string} key
 * @param {any} value
 */
export function set(key, value) {
  store.set(key, { value, at: Date.now() });
}

/** TTLs in ms (per BACKEND.md) */
export const TTL = {
  LIVE_FIXTURES_MS: 45 * 1000,       // 30–60 s
  FIXTURES_TODAY_MS: 2 * 60 * 1000,  // 2 min
  PLAYER_STATS_MS: 6 * 60 * 1000,    // 5–10 min
  STANDINGS_MS: 2 * 60 * 60 * 1000,  // 1–6 h
  TEAM_MS: 30 * 60 * 1000,           // 30 min
};
