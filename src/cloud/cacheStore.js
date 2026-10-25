import AsyncStorage from "@react-native-async-storage/async-storage";
import { KINDS, emptySynced, emptyOwners } from "./sync";

// Offline copy of the shared data. Stored in small pieces because Android
// can't read one huge AsyncStorage value (about 2 MB) back reliably.
const P = "@criccorner_cache_v1:";
const CHUNK = 15;
const written = new Map(); // key -> last string written (skip unchanged writes)

const metaKey = (uid) => `${P}${uid}:meta`;
const chunkKey = (uid, kind, i) => `${P}${uid}:${kind}:${i}`;

export async function saveCache(uid, state) {
  try {
    const meta = { v: 2, at: Date.now(), since: state._since || null, synced: state._synced || emptySynced(), owners: state._owners || emptyOwners(), counts: {} };
    const writes = [];
    for (const kind of KINDS) {
      const items = state[kind] || [];
      const n = Math.ceil(items.length / CHUNK);
      meta.counts[kind] = n;
      for (let i = 0; i < n; i++) {
        const key = chunkKey(uid, kind, i);
        const str = JSON.stringify(items.slice(i * CHUNK, (i + 1) * CHUNK));
        if (written.get(key) !== str) writes.push([key, str]);
      }
    }
    let prev = null;
    try {
      const raw = await AsyncStorage.getItem(metaKey(uid));
      prev = raw ? JSON.parse(raw) : null;
    } catch (e) {}
    if (writes.length) await AsyncStorage.multiSet(writes);
    writes.forEach(([k, s]) => written.set(k, s));
    await AsyncStorage.setItem(metaKey(uid), JSON.stringify(meta)); // meta last = a complete snapshot
    // remove chunks that no longer exist
    const stale = [];
    if (prev && prev.counts) for (const kind of KINDS) for (let i = meta.counts[kind]; i < (prev.counts[kind] || 0); i++) stale.push(chunkKey(uid, kind, i));
    if (stale.length) {
      await AsyncStorage.multiRemove(stale);
      stale.forEach((k) => written.delete(k));
    }
    return true;
  } catch (e) {
    console.warn("saveCache failed", e);
    return false;
  }
}

export async function loadCache(uid) {
  try {
    const raw = await AsyncStorage.getItem(metaKey(uid));
    if (!raw) return null;
    const meta = JSON.parse(raw);
    // A copy saved by an older version doesn't know who owns what: keep it (so
    // nothing waiting to upload is lost) but download everything again.
    const out = { _since: meta.owners ? meta.since || null : null, _synced: meta.synced || emptySynced(), _owners: meta.owners || emptyOwners() };
    for (const kind of KINDS) {
      const keys = [];
      for (let i = 0; i < (meta.counts[kind] || 0); i++) keys.push(chunkKey(uid, kind, i));
      const pairs = keys.length ? await AsyncStorage.multiGet(keys) : [];
      out[kind] = [];
      for (const [k, v] of pairs) {
        if (v == null) return null; // incomplete -> ignore the cache, re-download
        written.set(k, v);
        out[kind].push(...JSON.parse(v));
      }
    }
    return out;
  } catch (e) {
    return null;
  }
}

export async function clearCache(uid) {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(`${P}${uid}:`));
    if (keys.length) await AsyncStorage.multiRemove(keys);
    keys.forEach((k) => written.delete(k));
  } catch (e) {}
}
