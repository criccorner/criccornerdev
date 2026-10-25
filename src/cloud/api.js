import { baseUrl, anonKey } from "./config";
import { request, ApiError } from "./http";
import { getSession, setSession, normalizeSession } from "./session";

// Supabase's older "anon" key is a JWT (starts with eyJ) and is also sent as Bearer;
// the newer "publishable" key (sb_publishable_...) goes in the apikey header only.
const apiHeaders = (token) => {
  const h = { apikey: anonKey() };
  if (token) h.Authorization = `Bearer ${token}`;
  else if (anonKey().startsWith("eyJ")) h.Authorization = `Bearer ${anonKey()}`;
  return h;
};

// ---------- Auth (Supabase GoTrue) ----------
export async function authCall(path, { method = "POST", body, token } = {}) {
  const r = await request(`${baseUrl()}/auth/v1${path}`, { method, body, headers: apiHeaders(token) });
  return r.json;
}

let refreshing = null;
// Exchange the refresh token for a new access token (one at a time).
export function refreshSession() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const s = getSession();
    if (!s || !s.refresh_token) throw new ApiError(401, null, "Please log in again.");
    try {
      const json = await authCall("/token?grant_type=refresh_token", { body: { refresh_token: s.refresh_token } });
      const next = normalizeSession(json);
      await setSession(next);
      return next;
    } catch (e) {
      // Only a real rejection ends the session; a network blip must not log people out.
      if (e instanceof ApiError && (e.status === 400 || e.status === 401 || e.status === 403)) await setSession(null);
      throw e;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function validToken() {
  let s = getSession();
  if (!s) throw new ApiError(401, null, "Please log in again.");
  if (s.expires_at - 60 < Math.floor(Date.now() / 1000)) s = await refreshSession();
  return s.access_token;
}

async function authed(fn) {
  try {
    return await fn(await validToken());
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && getSession()) {
      const s = await refreshSession();
      return fn(s.access_token);
    }
    throw e;
  }
}

// ---------- Database (PostgREST) ----------
// path like "docs?select=*&kind=eq.teams"
export function rest(path, { method = "GET", body, headers = {} } = {}) {
  return authed((token) =>
    request(`${baseUrl()}/rest/v1/${path}`, { method, body, headers: { ...apiHeaders(token), ...headers } })
  );
}

// ---------- Photos (Supabase Storage) ----------
export function publicAvatarUrl(path) {
  return `${baseUrl()}/storage/v1/object/public/avatars/${path}`;
}

export function uploadAvatar(path, blob, contentType = "image/jpeg") {
  return authed((token) =>
    request(`${baseUrl()}/storage/v1/object/avatars/${path}`, {
      method: "POST",
      body: blob,
      timeoutMs: 60000,
      headers: { ...apiHeaders(token), "Content-Type": contentType, "x-upsert": "true" },
    })
  );
}

export function removeAvatar(path) {
  return authed((token) =>
    request(`${baseUrl()}/storage/v1/object/avatars/${path}`, { method: "DELETE", headers: apiHeaders(token) })
  );
}
