// Read-only share links for a player, team, match or tournament.
//   https://<site>/open.html?s=player&i=<id>     (what people send each other)
//   criccorner://share/player/<id>               (what open.html hands to the installed app)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SHARE_WEB_BASE } from "./config";

export const SHARE_KINDS = ["player", "team", "match", "tournament"];
const LABEL = { player: "player profile", team: "team", match: "match", tournament: "tournament" };

export function buildShareLink(kind, id, base = SHARE_WEB_BASE) {
  if (!SHARE_KINDS.includes(kind) || !id) return null;
  const k = encodeURIComponent(kind);
  const i = encodeURIComponent(id);
  const b = (base || "").trim();
  if (!b) return `criccorner://share/${k}/${i}`; // app-only link when no website is set
  return `${b.endsWith("/") ? b : b + "/"}open.html?s=${k}&i=${i}`;
}

// What goes into WhatsApp / email.
export function shareMessage(kind, name, link) {
  const what = LABEL[kind] || "page";
  return `${name || "CricCorner"} — ${what} on CricCorner 🏏\n\nView it here: ${link}`;
}

export function parseShareUrl(url) {
  if (typeof url !== "string" || !url) return null;
  const clean = (v) => { try { return decodeURIComponent(v); } catch (e) { return null; } };
  let m = url.match(/^criccorner:\/\/share\/([a-z]+)\/([^/?#]+)/i);
  if (m) {
    const kind = m[1].toLowerCase();
    const id = clean(m[2]);
    return SHARE_KINDS.includes(kind) && id ? { kind, id } : null;
  }
  if (/^https?:\/\//i.test(url)) {
    const s = url.match(/[?&]s=([a-z]+)/i);
    const i = url.match(/[?&]i=([^&#]+)/);
    if (s && i) {
      const kind = s[1].toLowerCase();
      const id = clean(i[1]);
      return SHARE_KINDS.includes(kind) && id ? { kind, id } : null;
    }
  }
  return null;
}

// Where in the app each kind lives: [tab, screen, param name]
export const SHARE_TARGETS = {
  player: ["Players", "PlayerStats", "playerId"],
  team: ["Teams", "TeamDetail", "teamId"],
  match: ["Matches", "Scorecard", "matchId"],
  tournament: ["Tournaments", "TournamentDetail", "tournamentId"],
};

// ---- a link that arrived before login / before the data loaded ----
const KEY = "criccorner.share.v1";
let pending = null;
const listeners = new Set();
export const getPendingShare = () => pending;
export function setPendingShare(s) {
  pending = s || null;
  listeners.forEach((fn) => fn(pending));
  try {
    if (pending) AsyncStorage.setItem(KEY, JSON.stringify(pending)).catch(() => {});
    else AsyncStorage.removeItem(KEY).catch(() => {});
  } catch (e) {}
}
export const clearPendingShare = () => setPendingShare(null);
export function subscribePendingShare(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export async function loadPendingShare() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw && !pending) {
      const s = JSON.parse(raw);
      if (s && SHARE_KINDS.includes(s.kind) && s.id) {
        pending = s;
        listeners.forEach((fn) => fn(pending));
      }
    }
  } catch (e) {}
  return pending;
}
