// App-level sponsors (added by an administrator, shown on matches in their city) - stored in the
// `app_sponsors` table (see supabase/app_sponsors.sql). Read by everyone, written by admins only.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { rest } from "../cloud/api";
import { distanceKm, sameCity } from "../geo/cities";

const CACHE_KEY = "@criccorner_app_sponsors_v1";
const COLS = "id,name,tagline,contact,image_url,city,city_lat,city_lng,active,sort,created_at";

const fromRow = (r) => ({
  id: r.id, name: r.name, tagline: r.tagline || null, contact: r.contact || null, imageUrl: r.image_url || null,
  city: r.city || null, cityLat: r.city_lat, cityLng: r.city_lng, active: r.active !== false, sort: r.sort || 0, createdAt: r.created_at,
});
const toRow = (s) => ({
  name: String(s.name || "").trim(), tagline: s.tagline || null, contact: s.contact || null, image_url: s.imageUrl || null,
  city: s.city || null, city_lat: Number.isFinite(s.cityLat) ? s.cityLat : null, city_lng: Number.isFinite(s.cityLng) ? s.cityLng : null,
  active: s.active !== false, sort: s.sort || 0, updated_at: new Date().toISOString(),
});

let memory = null;
export async function loadCachedSponsors() {
  if (memory) return memory;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    memory = raw ? JSON.parse(raw) : [];
  } catch (e) {
    memory = [];
  }
  return memory;
}

// Fresh list from the server; falls back to the saved copy when offline.
export async function fetchSponsors() {
  try {
    const r = await rest(`app_sponsors?select=${COLS}&order=sort.asc,created_at.desc`);
    const rows = r && r.json;
    memory = (Array.isArray(rows) ? rows : []).map(fromRow);
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memory)).catch(() => {});
    return memory;
  } catch (e) {
    return loadCachedSponsors();
  }
}

export async function saveSponsor(s) {
  if (!String(s.name || "").trim()) throw new Error("Please enter the sponsor's name.");
  if (s.id) await rest(`app_sponsors?id=eq.${encodeURIComponent(s.id)}`, { method: "PATCH", body: toRow(s), headers: { Prefer: "return=minimal" } });
  else await rest("app_sponsors", { method: "POST", body: toRow(s), headers: { Prefer: "return=minimal" } });
  return fetchSponsors();
}
export async function deleteSponsor(id) {
  await rest(`app_sponsors?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  return fetchSponsors();
}

// Which app sponsors a match shows: those for its city (by name, or within 25 km), and those with no city (everywhere).
export function sponsorsForCity(list, place) {
  const here = place && place.name ? place : null;
  const hp = here && Number.isFinite(here.lat) && Number.isFinite(here.lng) ? { lat: here.lat, lng: here.lng } : null;
  return (list || []).filter((s) => {
    if (s.active === false) return false;
    if (!s.city) return true;
    if (!here) return false;
    if (sameCity(s.city, here.name)) return true;
    return !!hp && Number.isFinite(s.cityLat) && Number.isFinite(s.cityLng) && distanceKm(hp, { lat: s.cityLat, lng: s.cityLng }) <= 25;
  });
}
