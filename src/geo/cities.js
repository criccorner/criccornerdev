// Real-city lookup (so a tournament can be listed by city and found by people nearby) and distances.
// Uses OpenStreetMap's free Nominatim search: no key, but please keep the volume low (one search per
// pause in typing, results cached).

const CITY_TYPES = new Set(["city", "town", "municipality", "village", "suburb", "borough", "city_district", "hamlet"]);
const cache = new Map();

// -> [{ name, label, lat, lng, country }]  (empty when nothing real matches)
export async function searchCities(query, fetchFn) {
  const q = String(query || "").trim().replace(/\s+/g, " ");
  if (q.length < 3) return [];
  const key = q.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  const f = fetchFn || (typeof fetch === "function" ? fetch : null);
  if (!f) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&accept-language=en&q=${encodeURIComponent(q)}`;
  const res = await f(url, { headers: { Accept: "application/json" } });
  if (!res || !res.ok) throw new Error("City search is not available right now.");
  const rows = await res.json();
  const out = [];
  const seen = new Set();
  for (const r of Array.isArray(rows) ? rows : []) {
    const a = r.address || {};
    const isPlace = (r.category === "place" && CITY_TYPES.has(r.type)) || (r.category === "boundary" && r.type === "administrative" && (a.city || a.town || a.municipality));
    if (!isPlace) continue;
    const name = a.city || a.town || a.village || a.municipality || a.suburb || r.name;
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const region = a.state || a.state_district || a.region || a.county || "";
    const country = a.country || "";
    const label = [name, region, country].filter(Boolean).join(", ");
    if (seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push({ name, label, lat, lng, country });
  }
  cache.set(key, out);
  return out;
}

// Great-circle distance in kilometres.
export function distanceKm(a, b) {
  if (!a || !b || ![a.lat, a.lng, b.lat, b.lng].every(Number.isFinite)) return Infinity;
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
export const sameCity = (a, b) => !!a && !!b && norm(a) === norm(b);

// A tournament's place, as saved by the creator.
export const placeOf = (t) => (t && Number.isFinite(t.cityLat) && Number.isFinite(t.cityLng) ? { lat: t.cityLat, lng: t.cityLng } : null);

const SAME_CITY_KM = 25;
const byNewest = (a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""));

// The "Other tournaments" list: the 10 newest in YOUR city; with none there, the 10 closest to you.
// home = { name, lat, lng } | null.  Returns { mode: "city" | "near" | "none", items: [{ tournament, km }] }.
export function tournamentsAround(tournaments, home, limit = 10) {
  const list = (tournaments || []).map((t, i) => ({ t, i }));
  if (!home) return { mode: "none", items: [] };
  const hp = Number.isFinite(home.lat) && Number.isFinite(home.lng) ? { lat: home.lat, lng: home.lng } : null;
  const withKm = list.map(({ t, i }) => ({ t, i, km: hp ? distanceKm(hp, placeOf(t)) : Infinity }));
  const inCity = withKm.filter((x) => sameCity(x.t.city, home.name) || x.km <= SAME_CITY_KM);
  const newest = (x, y) => byNewest(x.t, y.t) || y.i - x.i;
  if (inCity.length) {
    return { mode: "city", items: inCity.sort(newest).slice(0, limit).map((x) => ({ tournament: x.t, km: Number.isFinite(x.km) ? x.km : null })) };
  }
  const near = withKm.filter((x) => Number.isFinite(x.km)).sort((x, y) => x.km - y.km || newest(x, y));
  return { mode: near.length ? "near" : "none", items: near.slice(0, limit).map((x) => ({ tournament: x.t, km: x.km })) };
}

// The city a match is in: its own, else its tournament's. -> { name, lat, lng } | null
export function matchPlace(match, tournament) {
  const name = (match && match.city) || (tournament && tournament.city) || null;
  if (!name) return null;
  const lat = match && Number.isFinite(match.cityLat) ? match.cityLat : tournament && Number.isFinite(tournament.cityLat) ? tournament.cityLat : null;
  const lng = match && Number.isFinite(match.cityLng) ? match.cityLng : tournament && Number.isFinite(tournament.cityLng) ? tournament.cityLng : null;
  return { name, lat, lng };
}
