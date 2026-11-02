// Attendance: players mark themselves available for a scheduled match (see utils/availability.js),
// then each side's captain picks the final XI and confirms it. After that a player can no longer
// withdraw himself - only the captain changes the XI.
//   match.lockedA / match.lockedB  - true once that side's XI is confirmed
import { availabilityOf } from "./availability";

export const XI_SIZE = 11;
const arr = (x) => (Array.isArray(x) ? x : []);

export const isLocked = (match, side) => !!(match && (side === "A" ? match.lockedA : match.lockedB));
export const sideOfTeam = (match, teamId) => (teamId === match.teamAId ? "A" : teamId === match.teamBId ? "B" : null);
export const squadOfSide = (match, side) => arr(side === "A" ? match.squadA : match.squadB);

// Is this player in the confirmed XI of his side?
export function inConfirmedXI(match, playerId) {
  return (isLocked(match, "A") && arr(match.squadA).includes(playerId)) || (isLocked(match, "B") && arr(match.squadB).includes(playerId));
}

// May this player change his answer to `status` right now? Once he is in a confirmed XI he can't pull out himself.
export function canChangeAnswer(match, playerId, status, isManager) {
  if (isManager) return true;
  if (!inConfirmedXI(match, playerId)) return true;
  return status === "yes";
}

const today = (now = new Date()) => now.toISOString().slice(0, 10);

// Matches still to be played whose attendance this player has not answered.
// -> [{ match, playerId, side }]
export function pendingAttendance({ matches, teams, myPlayerIds, players, now = new Date() }) {
  const ids = new Set(myPlayerIds || []);
  if (!ids.size) return [];
  const cutoff = new Date(now.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10); // keep yesterday's visible
  const out = [];
  for (const m of matches || []) {
    if (m.status !== "scheduled" || String(m.date || "") < cutoff) continue;
    for (const side of ["A", "B"]) {
      if (isLocked(m, side)) continue; // that side's XI is already confirmed
      const team = (teams || []).find((t) => t.id === (side === "A" ? m.teamAId : m.teamBId));
      if (!team) continue;
      for (const pid of team.playerIds || []) {
        if (!ids.has(pid)) continue;
        const p = (players || []).find((x) => x.id === pid);
        if (!p || availabilityOf(p, m.id)) continue;
        out.push({ match: m, playerId: pid, side });
      }
    }
  }
  return out.sort((a, b) => String(a.match.date).localeCompare(String(b.match.date)));
}

// Matches where this player was picked in a confirmed XI (shown in the bell as good news).
export function confirmedFor({ matches, myPlayerIds, now = new Date() }) {
  const ids = new Set(myPlayerIds || []);
  const cutoff = today(now);
  const out = [];
  for (const m of matches || []) {
    if (m.status !== "scheduled" || String(m.date || "") < cutoff) continue;
    for (const side of ["A", "B"]) {
      if (!isLocked(m, side)) continue;
      for (const pid of squadOfSide(m, side)) if (ids.has(pid)) out.push({ match: m, playerId: pid, side });
    }
  }
  return out;
}

// Who is available for one side, from the team roster: { yes, maybe, no, none } arrays of players.
export function attendanceOf(match, side, teams, players) {
  const team = (teams || []).find((t) => t.id === (side === "A" ? match.teamAId : match.teamBId));
  const out = { yes: [], maybe: [], no: [], none: [] };
  for (const pid of (team && team.playerIds) || []) {
    const p = (players || []).find((x) => x.id === pid);
    if (!p) continue;
    out[availabilityOf(p, match.id) || "none"].push(p);
  }
  return out;
}

// Can the XI be confirmed? Between 2 and XI_SIZE players, a captain and a keeper among them.
export function validateXI({ ids, captainId, keeperId }) {
  if (!ids || ids.length < 2) return "Pick at least 2 players.";
  if (ids.length > XI_SIZE) return `Pick no more than ${XI_SIZE} players.`;
  if (!captainId || !ids.includes(captainId)) return "Choose a captain from the players you picked.";
  if (!keeperId || !ids.includes(keeperId)) return "Choose a wicketkeeper from the players you picked.";
  return null;
}
