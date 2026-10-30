// What a player's profile shows next to his name: the teams he is in, the tournaments he organized,
// and short titles ("Wicketkeeper Batsman", "Organizer", "Captain", ...). Pure functions.

// Tournaments he organized. New tournaments store `organizerId` (the creator's player entry).
// Older ones are matched through the account that created them when that account is `me`.
export function organizedBy(playerId, { tournaments = [], owners = {}, me = null, myPlayerIds = new Set() }) {
  const own = (owners && owners.tournaments) || {};
  return tournaments.filter((t) => {
    if (t.organizerId) return t.organizerId === playerId;
    return !!me && own[t.id] === me && myPlayerIds.has(playerId);
  });
}

export function teamsOf(playerId, teams = []) {
  return teams.filter((t) => (t.playerIds || []).includes(playerId) || t.ownerId === playerId);
}

export function playerTitles(player, { teams = [], matches = [], organized = [] }) {
  const titles = [];
  if (player.role && player.role !== "Player") titles.push(player.role);
  if (organized.length) titles.push("Organizer");
  const captain = matches.some((m) => m.captainA === player.id || m.captainB === player.id);
  if (captain) titles.push("Captain");
  const keeper = matches.some((m) => m.keeperA === player.id || m.keeperB === player.id);
  if (keeper && !/keeper/i.test(player.role || "")) titles.push("Wicketkeeper");
  if (teams.some((t) => t.ownerId === player.id)) titles.push("Team owner");
  return titles;
}
