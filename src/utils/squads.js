// Match squads: the players chosen from each team for ONE match, plus the
// captain and wicketkeeper of each side.
//   match.squadA / squadB       - player ids
//   match.captainA / captainB   - player id (must be in that squad)
//   match.keeperA / keeperB     - player id (must be in that squad)
// Old matches (and tournament fixtures that have not been set up yet) have no
// squad saved, so they fall back to the whole team.

const arr = (x) => (Array.isArray(x) ? x : null);

// Ids of the players who play for `teamId` in this match.
export function squadIds(match, teams, teamId) {
  if (!match) return [];
  const saved = teamId === match.teamAId ? arr(match.squadA) : teamId === match.teamBId ? arr(match.squadB) : null;
  if (saved) return saved;
  const team = (teams || []).find((t) => t.id === teamId);
  return (team && team.playerIds) || [];
}

export const hasSquads = (match) => !!(match && arr(match.squadA) && arr(match.squadB));

// Captain / wicketkeeper of one side of a match (null when not chosen).
export function captainOf(match, teamId) {
  if (!match) return null;
  return (teamId === match.teamAId ? match.captainA : teamId === match.teamBId ? match.captainB : null) || null;
}
export function keeperOf(match, teamId) {
  if (!match) return null;
  return (teamId === match.teamAId ? match.keeperA : teamId === match.teamBId ? match.keeperB : null) || null;
}

// " (C)", " (WK)" or " (C, WK)" to put after a player's name in this match.
export function roleTag(match, playerId) {
  if (!match || !playerId) return "";
  const c = match.captainA === playerId || match.captainB === playerId;
  const k = match.keeperA === playerId || match.keeperB === playerId;
  if (c && k) return " (C, WK)";
  if (c) return " (C)";
  if (k) return " (WK)";
  return "";
}

// Players who appear in both squads.
export function overlap(squadA, squadB) {
  const b = new Set(squadB || []);
  return (squadA || []).filter((id) => b.has(id));
}

// A side is { ids, captainId, keeperId }. Returns an error message or null.
export function validateMatchSquads(a, b, players, minPlayers = 2) {
  const nameOf = (id) => ((players || []).find((p) => p.id === id) || {}).name || "A player";
  const both = overlap(a.ids, b.ids);
  if (both.length) return `${both.map(nameOf).join(", ")} cannot play for both teams. Remove them from one squad.`;
  const sides = [["Team A", a], ["Team B", b]];
  for (const [label, s] of sides) {
    if ((s.ids || []).length < minPlayers) return `${label} needs at least ${minPlayers} players in its squad.`;
    if (!s.captainId) return `Choose a captain for ${label}.`;
    if (!s.ids.includes(s.captainId)) return `${label}'s captain must be in its squad.`;
    if (!s.keeperId) return `Choose a wicketkeeper for ${label}.`;
    if (!s.ids.includes(s.keeperId)) return `${label}'s wicketkeeper must be in its squad.`;
  }
  return null;
}

// Fields to save on the match.
export const squadFields = (a, b) => ({
  squadA: a.ids, squadB: b.ids,
  captainA: a.captainId, captainB: b.captainId,
  keeperA: a.keeperId, keeperB: b.keeperId,
});

// Starting value for the pickers from a saved match (or empty).
export const sideFromMatch = (match, side, fallbackIds = []) => {
  const A = side === "A";
  const ids = arr(A ? match?.squadA : match?.squadB) || fallbackIds;
  const c = A ? match?.captainA : match?.captainB;
  const k = A ? match?.keeperA : match?.keeperB;
  return { ids, captainId: ids.includes(c) ? c : null, keeperId: ids.includes(k) ? k : null };
};

// Can this account delete the match? Only a captain of either side, or - for
// older matches that have no captain recorded - an administrator.
export function canDeleteMatch(match, players, user, playerMatchesUser) {
  if (!match || !user) return false;
  const caps = [match.captainA, match.captainB].filter(Boolean);
  if (!caps.length) return !!user.isAdmin;
  return caps.some((id) => playerMatchesUser((players || []).find((p) => p.id === id), user));
}

// Sides ("A" / "B") whose captain this account is. An administrator may correct both.
export function captainSides(match, players, user, playerMatchesUser) {
  if (!match || !user) return [];
  if (user.isAdmin) return ["A", "B"];
  const who = (id) => (players || []).find((p) => p.id === id);
  const out = [];
  if (match.captainA && playerMatchesUser(who(match.captainA), user)) out.push("A");
  if (match.captainB && playerMatchesUser(who(match.captainB), user)) out.push("B");
  return out;
}
