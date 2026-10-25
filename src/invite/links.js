// Team invite links: building them, reading them, and remembering one that
// arrived before the player was logged in.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { INVITE_WEB_BASE, APP_DOWNLOAD_URL } from "./config";

export const SCHEME = "criccorner";
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no look-alikes (0/O, 1/I/L)

export function makeInviteCode(len = 10, rand = Math.random) {
  let s = "";
  for (let i = 0; i < len; i++) s += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)];
  return s;
}

// { app, web, link, message } for a team that has an inviteCode.
export function buildInviteLinks(team, { webBase = INVITE_WEB_BASE, downloadUrl = APP_DOWNLOAD_URL } = {}) {
  if (!team || !team.inviteCode) return null;
  const t = encodeURIComponent(team.id);
  const c = encodeURIComponent(team.inviteCode);
  const app = `${SCHEME}://join/${t}/${c}`;
  const base = (webBase || "").trim();
  const web = base ? `${base}${base.includes("?") ? "&" : "?"}t=${t}&c=${c}` : null;
  const link = web || app;
  const lines = [`Join ${team.name} on CricCorner 🏏`, "", `Tap to join the team: ${link}`];
  if (downloadUrl && downloadUrl.trim()) lines.push("", `No app yet? Get it here: ${downloadUrl.trim()}`);
  return { app, web, link, message: lines.join("\n") };
}

// Reads  criccorner://join/<team>/<code>  or  https://host/page?t=<team>&c=<code>
export function parseInviteUrl(url) {
  if (typeof url !== "string" || !url) return null;
  const clean = (v) => {
    try {
      return decodeURIComponent(v);
    } catch (e) {
      return null;
    }
  };
  let m = url.match(/^criccorner:\/\/join\/([^/?#]+)\/([^/?#]+)/i);
  if (m) {
    const teamId = clean(m[1]);
    const code = clean(m[2]);
    return teamId && code ? { teamId, code } : null;
  }
  m = url.match(/[?&]t=([^&#]+)/);
  const c = url.match(/[?&]c=([^&#]+)/);
  if (m && c && /^https?:\/\//i.test(url)) {
    const teamId = clean(m[1]);
    const code = clean(c[1]);
    return teamId && code ? { teamId, code } : null;
  }
  return null;
}

// ---- a link that arrived before login / before the data loaded ----
const KEY = "criccorner.invite.v1";
let pending = null;
const listeners = new Set();

export const getPendingInvite = () => pending;
export function setPendingInvite(inv) {
  pending = inv || null;
  listeners.forEach((fn) => fn(pending));
  try {
    if (pending) AsyncStorage.setItem(KEY, JSON.stringify(pending)).catch(() => {});
    else AsyncStorage.removeItem(KEY).catch(() => {});
  } catch (e) {}
}
export const clearPendingInvite = () => setPendingInvite(null);
export function subscribePendingInvite(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export async function loadPendingInvite() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw && !pending) {
      const inv = JSON.parse(raw);
      if (inv && inv.teamId && inv.code) {
        pending = inv;
        listeners.forEach((fn) => fn(pending));
      }
    }
  } catch (e) {}
  return pending;
}
