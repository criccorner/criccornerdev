import AsyncStorage from "@react-native-async-storage/async-storage";

// The login session (tokens) is kept on the phone so people stay logged in.
const KEY = "@criccorner_cloud_session_v1";

let session = null;
const listeners = new Set();

export const getSession = () => session;

export function onSessionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const emit = () => listeners.forEach((fn) => { try { fn(session); } catch (e) {} });

// Supabase returns { access_token, refresh_token, expires_in, expires_at, user }
export function normalizeSession(raw) {
  if (!raw || !raw.access_token) return null;
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: raw.expires_at || now + (raw.expires_in || 3600),
    user: raw.user ? { id: raw.user.id, email: raw.user.email } : session ? session.user : null,
  };
}

export async function loadSession() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    session = raw ? JSON.parse(raw) : null;
  } catch (e) {
    session = null;
  }
  return session;
}

export async function setSession(next) {
  session = next ? normalizeSession(next) || next : null;
  try {
    if (session) await AsyncStorage.setItem(KEY, JSON.stringify(session));
    else await AsyncStorage.removeItem(KEY);
  } catch (e) {}
  emit();
  return session;
}
