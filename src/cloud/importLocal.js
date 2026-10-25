import AsyncStorage from "@react-native-async-storage/async-storage";
import { KINDS } from "./sync";

// Finds data that older versions of the app saved on THIS phone, so it can be
// uploaded to the shared cloud database once.

const OLD_PREFIX = "@cricket_scorer_state_v2:"; // one key per old on-device account
const OLDEST_KEY = "@cricket_scorer_state_v1"; // before accounts were separated
const DONE_KEY = "@criccorner_imported_v1";

const countOf = (data) => {
  const c = {};
  for (const k of KINDS) c[k] = Array.isArray(data && data[k]) ? data[k].length : 0;
  return c;
};
export const totalOf = (c) => KINDS.reduce((n, k) => n + (c[k] || 0), 0);

async function doneSet() {
  try {
    return new Set(JSON.parse((await AsyncStorage.getItem(DONE_KEY)) || "[]"));
  } catch (e) {
    return new Set();
  }
}

export async function markImported(key) {
  const s = await doneSet();
  s.add(key);
  try {
    await AsyncStorage.setItem(DONE_KEY, JSON.stringify([...s]));
  } catch (e) {}
}

// -> [{ key, label, counts, total, imported }]
export async function findLocalWorkspaces() {
  let keys = [];
  try {
    keys = await AsyncStorage.getAllKeys();
  } catch (e) {
    return [];
  }
  const done = await doneSet();
  const out = [];
  for (const key of keys.filter((k) => k.startsWith(OLD_PREFIX) || k === OLDEST_KEY)) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      const counts = countOf(data);
      if (!totalOf(counts)) continue;
      const label = key === OLDEST_KEY ? "Data from the first version of the app" : `Data saved on this phone for ${key.slice(OLD_PREFIX.length)}`;
      out.push({ key, label, counts, total: totalOf(counts), imported: done.has(key) });
    } catch (e) {}
  }
  return out;
}

export async function readWorkspace(key) {
  const raw = await AsyncStorage.getItem(key);
  const data = raw ? JSON.parse(raw) : {};
  const out = {};
  for (const k of KINDS) out[k] = Array.isArray(data[k]) ? data[k] : [];
  return out;
}
