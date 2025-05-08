/*  src/lib/api.js
    ------------------------------------------------------------
    Centralised helper functions for the Laravel API.
*/
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');

/* unwrap “{ data: [...] }” or just return the payload if it’s already an array */
const unwrap = (payload) =>
  Array.isArray(payload) ? payload
  : Array.isArray(payload?.data) ? payload.data
  : payload;

/* generic GET */
async function apiGet(endpoint) {
  const url = `${API_BASE_URL}/${String(endpoint).replace(/^\/+/, '')}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return unwrap(await res.json());
}

/* ───────────────────────── exposed helpers ───────────────────────── */
export const fetchMatches = () => apiGet('matches');
export const fetchMatch   = (id) => apiGet(`matches/${id}`);

export const fetchEvents  = () => apiGet('events');
export const fetchNews    = () => apiGet('news');

/* forum, auth, etc. unchanged … */
