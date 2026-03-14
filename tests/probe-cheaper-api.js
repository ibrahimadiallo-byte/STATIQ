/**
 * One-off probe: find which param/path works for Cheaper Version player search.
 * Run: node tests/probe-cheaper-api.js
 */
import 'dotenv/config';
import axios from 'axios';

const host = process.env.RAPIDAPI_HOST || 'free-api-live-football-data-cheaper-version.p.rapidapi.com';
const key = process.env.RAPIDAPI_KEY;
const base = `https://${host}`;

if (!key) {
  console.log('RAPIDAPI_KEY missing');
  process.exit(1);
}

const searchTerm = 'mbappe';

async function tryGet(path, params) {
  const { status, data } = await axios.get(`${base}${path}`, {
    params,
    headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': host },
    validateStatus: () => true,
  });
  const list = data?.response?.list ?? data?.list ?? (Array.isArray(data?.response) ? data.response : null);
  const count = Array.isArray(list) ? list.length : 0;
  return { status, keys: data && typeof data === 'object' ? Object.keys(data) : [], count, sample: Array.isArray(list) ? list[0] : null };
}

async function tryPost(path, body) {
  const { status, data } = await axios.post(`${base}${path}`, body, {
    headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': host, 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });
  const list = data?.response?.list ?? data?.list ?? (Array.isArray(data?.response) ? data.response : null);
  const count = Array.isArray(list) ? list.length : 0;
  return { status, keys: data && typeof data === 'object' ? Object.keys(data) : [], count, sample: Array.isArray(list) ? list[0] : null };
}

async function main() {
  console.log('Probing Cheaper Version API:', base);
  console.log('Search term:', searchTerm, '\n');

  const paramNames = ['search', 'name', 'player_name', 'q', 'player', 'keyword'];
  for (const param of paramNames) {
    const { status, data } = await axios.get(`${base}/football-get-list-player`, {
      params: { [param]: searchTerm },
      headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': host },
      validateStatus: () => true,
    });
    const resp = data?.response;
    const respKeys = resp && typeof resp === 'object' ? Object.keys(resp) : [];
    const list = resp?.list ?? resp?.players ?? resp?.data ?? (Array.isArray(resp) ? resp : null);
    const count = Array.isArray(list) ? list.length : 0;
    console.log(`GET /football-get-list-player?${param}=... → ${status} response keys=[${respKeys.join(', ')}] listCount=${count}`);
    if (status === 200 && respKeys.length > 0 && count === 0) {
      console.log('  response sample:', JSON.stringify(resp).slice(0, 300));
    }
    if (status === 200 && count > 0) {
      console.log('  WINNER: param =', param);
      console.log('  Sample item keys:', list[0] && typeof list[0] === 'object' ? Object.keys(list[0]) : 'n/a');
      process.exit(0);
    }
  }

  const pathAlt = ['/football-players-search', '/players/list', '/players/search', '/list-player'];
  for (const path of pathAlt) {
    const r = await tryGet(path, { search: searchTerm });
    console.log(`GET ${path}?search=... → ${r.status} keys=[${r.keys.join(', ')}] listCount=${r.count}`);
    if (r.status === 200 && r.count > 0) {
      console.log('  WINNER: path =', path, 'param = search');
      process.exit(0);
    }
  }

  const r = await tryPost('/football-get-list-player', { search: searchTerm });
  console.log(`POST /football-get-list-player body={search} → ${r.status} keys=[${r.keys.join(', ')}] listCount=${r.count}`);
  if (r.status === 200 && r.count > 0) {
    console.log('  WINNER: method = POST, param in body');
    process.exit(0);
  }

  console.log('\nNo working combination found.');
}
main().catch((e) => { console.error(e); process.exit(1); });
