// Registered = has a mobile number or an email (same rule as access/scope.js).
const hasContact = (p) => !!p && !!(String(p.phone || "").trim() || String(p.email || "").trim());

// What a team can say it is looking for, and how it relates to a player's playing role.
export const LOOKING_FOR = ["Bowler", "Batter", "WicketKeeper", "Allrounder", "Any"];

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "");
// A player's role text (from the profile) -> one of the strengths above, or null when it can't be told.
export function strengthOf(role) {
  const r = norm(role);
  if (!r) return null;
  if (r.includes("allround")) return "Allrounder";
  if (r.includes("keeper")) return "WicketKeeper";
  if (r.includes("bowl")) return "Bowler";
  if (r.includes("bat")) return "Batter";
  return null;
}

// Players who said they are available to join a team (registered ones only: they have a mobile number or email).
// Optional filters: a strength, and a city (text, case-insensitive). Players in the same city come first.
export function availablePlayers(players, { strength = null, city = "", excludeIds = [] } = {}) {
  const skip = new Set(excludeIds);
  const c = norm(city);
  const out = (players || [])
    .filter((p) => p && !p.deleted && p.availableToJoin && hasContact(p) && !skip.has(p.id))
    .filter((p) => !strength || strength === "Any" || strengthOf(p.role) === strength)
    .filter((p) => !c || norm(p.city).includes(c));
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// Teams that are looking for the kind of player this person is, best match first:
//  +3 team is in the same city, +2 team asked for exactly this strength, +1 team asked for "Any".
// Teams the person is already in, and teams that have set nothing, are left out.
export function teamsLookingFor(teams, { role, city, playerId }) {
  const mine = strengthOf(role);
  const c = norm(city);
  const rows = [];
  for (const t of teams || []) {
    if (!t || t.deleted || !t.name) continue;
    if (playerId && (t.playerIds || []).includes(playerId)) continue;
    const want = Array.isArray(t.lookingFor) ? t.lookingFor : [];
    if (!want.length) continue;
    const exact = !!mine && want.includes(mine);
    const any = want.includes("Any");
    if (!exact && !any) continue;
    const sameCity = !!c && norm(t.city) === c || (!!c && !!norm(t.city) && (norm(t.city).includes(c) || c.includes(norm(t.city))));
    rows.push({ team: t, score: (sameCity ? 3 : 0) + (exact ? 2 : 0) + (any ? 1 : 0), sameCity, exact, any });
  }
  return rows.sort((a, b) => b.score - a.score || a.team.name.localeCompare(b.team.name));
}
