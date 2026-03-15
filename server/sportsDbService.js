/**
 * TheSportsDB Service - Free player photos
 * https://www.thesportsdb.com/api.php
 */

import axios from 'axios';

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';
const TIMEOUT_MS = 10000;

// Cache to avoid repeated API calls
const photoCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Search for a player and get their photo URL.
 * Tries full name first, then surname only (e.g. "Ronaldo", "Messi") for better matching.
 * @param {string} playerName - Player name to search
 * @returns {Promise<string|null>} - Photo URL or null
 */
export async function getPlayerPhoto(playerName) {
  if (!playerName) return null;

  const trimmed = String(playerName).trim();
  const cacheKey = trimmed.toLowerCase();
  const cached = photoCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.url;
  }

  const searchTerms = [trimmed];
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    const surname = parts[parts.length - 1];
    if (surname.length >= 2) searchTerms.push(surname);
  }

  for (const term of searchTerms) {
    try {
      const { data } = await axios.get(`${BASE_URL}/searchplayers.php`, {
        params: { p: term },
        timeout: TIMEOUT_MS,
      });

      if (data?.player?.length > 0) {
        const soccerPlayer = data.player.find(
          (p) => p.strSport === 'Soccer' && (p.strThumb || p.strCutout)
        );
        const first = data.player[0];
        const photoUrl =
          soccerPlayer?.strCutout ||
          soccerPlayer?.strThumb ||
          first?.strCutout ||
          first?.strThumb;

        if (photoUrl) {
          photoCache.set(cacheKey, { url: photoUrl, timestamp: Date.now() });
          return photoUrl;
        }
      }
    } catch (err) {
      console.error('[TheSportsDB]', term, err.message);
    }
  }

  photoCache.set(cacheKey, { url: null, timestamp: Date.now() });
  return null;
}

/**
 * Batch fetch photos for multiple players
 * @param {string[]} playerNames - Array of player names
 * @returns {Promise<Map<string, string>>} - Map of name -> photo URL
 */
export async function getPlayerPhotos(playerNames) {
  const results = new Map();
  const uncached = playerNames.filter((name) => {
    const cached = photoCache.get(name.toLowerCase().trim());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      results.set(name, cached.url);
      return false;
    }
    return true;
  });

  // Fetch uncached in parallel (limit to 5 concurrent)
  const chunks = [];
  for (let i = 0; i < uncached.length; i += 5) {
    chunks.push(uncached.slice(i, i + 5));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (name) => {
      const url = await getPlayerPhoto(name);
      results.set(name, url);
    });
    await Promise.all(promises);
  }

  return results;
}
