import { isoDay } from "./datetime";

// "Find" helpers. A match that has not finished and falls in the next N days (today included) makes a team or a ground busy.
export const FIND_DAYS = 7;
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

export function windowOf(now = new Date(), days = FIND_DAYS) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return { from: isoDay(now), to: isoDay(end) };
}

const dayOf = (m) => String(m.date || "").slice(0, 10);
const open = (m) => m && m.status !== "completed" && m.status !== "abandoned" && m.status !== "cancelled";
const inWindow = (m, w) => open(m) && /^\d{4}-\d{2}-\d{2}$/.test(dayOf(m)) && dayOf(m) >= w.from && dayOf(m) <= w.to;

// Teams with no unfinished match in the next 7 days, A-Z.
export function availableTeams(all, now = new Date(), days = FIND_DAYS) {
  const w = windowOf(now, days);
  const busy = new Set();
  for (const m of all.matches || []) if (inWindow(m, w)) { busy.add(m.teamAId); busy.add(m.teamBId); }
  return (all.teams || []).filter((t) => t && t.name && !busy.has(t.id)).sort((a, b) => a.name.localeCompare(b.name));
}

// Grounds the app knows of (every venue used in a match) with no unfinished match there in the next 7 days.
export function availableGrounds(all, now = new Date(), days = FIND_DAYS) {
  const w = windowOf(now, days);
  const grounds = new Map();
  const busy = new Set();
  for (const m of all.matches || []) {
    const v = String(m.venue || "").trim();
    if (!v) continue;
    const k = norm(v);
    if (!grounds.has(k)) grounds.set(k, { name: v, city: m.city || "" });
    else if (!grounds.get(k).city && m.city) grounds.get(k).city = m.city;
    if (inWindow(m, w)) busy.add(k);
  }
  return [...grounds.entries()].filter(([k]) => !busy.has(k)).map(([, g]) => g).sort((a, b) => a.name.localeCompare(b.name));
}

export const GROUND_NOTE =
  "Note: CricCorner only lists grounds that have no match scheduled in the app for the next 7 days. It is not CricCorner's responsibility to find, confirm or book any ground, and a ground shown here may still be in use or unavailable. Please check with the council (or the ground's owner) before planning a match.";
