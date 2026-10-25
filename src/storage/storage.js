import AsyncStorage from "@react-native-async-storage/async-storage";

// Each logged-in account gets its OWN storage key, so players, teams, matches
// and tournaments are never shared between logins on the same phone.
// App.js calls setStorageUser() when someone logs in or out. With nobody
// logged in, nothing is read or written (so nothing can leak between users).

const LEGACY_KEY = "@cricket_scorer_state_v1"; // old single shared store
const PREFIX = "@cricket_scorer_state_v2:";

let currentUser = null;

export function setStorageUser(userId) {
  currentUser = userId || null;
}

const keyFor = (userId) => PREFIX + userId;

export async function loadState() {
  const userId = currentUser;
  if (!userId) return null;
  try {
    const own = await AsyncStorage.getItem(keyFor(userId));
    if (own) return JSON.parse(own);

    // One-time migration: data saved before this update lived in one shared
    // store. The first account to log in claims it; it is then removed so no
    // other account can ever see it.
    const legacy = await AsyncStorage.getItem(LEGACY_KEY);
    if (legacy) {
      await AsyncStorage.setItem(keyFor(userId), legacy);
      await AsyncStorage.removeItem(LEGACY_KEY);
      return JSON.parse(legacy);
    }
    return null;
  } catch (e) {
    console.warn("loadState failed", e);
    return null;
  }
}

export async function saveState(state) {
  const userId = currentUser; // resolve the key now, not after an await
  if (!userId) return;
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(state));
  } catch (e) {
    console.warn("saveState failed", e);
  }
}

export async function clearState() {
  const userId = currentUser;
  if (!userId) return;
  try {
    await AsyncStorage.removeItem(keyFor(userId));
  } catch (e) {
    console.warn("clearState failed", e);
  }
}

// ---- One-step safety backup, used before bulk data fixes (e.g. "Fix duplicate contacts") ----
const BACKUP_PREFIX = "@cricket_scorer_backup_v1:";

export async function saveBackup(snapshot) {
  const userId = currentUser;
  if (!userId) return false;
  try {
    await AsyncStorage.setItem(BACKUP_PREFIX + userId, JSON.stringify({ at: Date.now(), state: snapshot }));
    return true;
  } catch (e) {
    return false;
  }
}

export async function loadBackup() {
  const userId = currentUser;
  if (!userId) return null;
  try {
    const raw = await AsyncStorage.getItem(BACKUP_PREFIX + userId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
