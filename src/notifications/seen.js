// Which notifications you have already opened, so the 🔔 number goes down as you read them.
// Kept on this phone, per account. A notification is "seen" once you open its details or answer it.
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = (uid) => `criccorner.notif.seen.v1.${uid || "anon"}`;
const cache = {}; // uid -> Set
const loading = {};
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn());

async function load(uid) {
  if (cache[uid]) return cache[uid];
  if (!loading[uid]) {
    loading[uid] = AsyncStorage.getItem(KEY(uid))
      .then((raw) => { cache[uid] = new Set(raw ? JSON.parse(raw) : []); })
      .catch(() => { cache[uid] = new Set(); })
      .then(() => { emit(); return cache[uid]; });
  }
  return loading[uid];
}

// What identifies one notification: the kind, the match and (for availability) the player.
export const notifKey = (kind, matchId, playerId) => `${kind}:${matchId}${playerId ? `:${playerId}` : ""}`;

export async function markSeen(uid, keys) {
  const set = await load(uid);
  let changed = false;
  for (const k of [].concat(keys)) if (!set.has(k)) { set.add(k); changed = true; }
  if (!changed) return;
  emit();
  try { await AsyncStorage.setItem(KEY(uid), JSON.stringify([...set].slice(-500))); } catch (e) { /* keep in memory */ }
}

// -> Set of seen keys (re-renders when it changes)
export function useSeen(uid) {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((n) => n + 1);
    listeners.add(fn);
    load(uid);
    return () => { listeners.delete(fn); };
  }, [uid]);
  return cache[uid] || new Set();
}
