// Who can play a scheduled match. A player answers for himself: the answer is kept on
// his own player entry (player.availability[matchId]), so he can always save it.
export const STATUSES = [
  { key: "yes", icon: "✅", label: "Available" },
  { key: "no", icon: "❌", label: "Not available" },
  { key: "maybe", icon: "❓", label: "Maybe" },
];
export const statusInfo = (k) => STATUSES.find((s) => s.key === k) || null;

export const availabilityOf = (player, matchId) => {
  const a = player && player.availability && player.availability[matchId];
  return a && statusInfo(a.status) ? a.status : null;
};

// Group a side's players by answer. `ids` = the players expected for the match.
export function summarise(ids, players, matchId) {
  const out = { yes: [], no: [], maybe: [], none: [] };
  for (const id of ids) {
    const p = players.find((x) => x.id === id);
    if (!p) continue;
    (out[availabilityOf(p, matchId) || "none"]).push(p);
  }
  return out;
}

export function setAvailability(player, matchId, status) {
  const cur = { ...((player && player.availability) || {}) };
  if (!status) delete cur[matchId];
  else cur[matchId] = { status, at: new Date().toISOString() };
  return Object.keys(cur).length ? cur : undefined;
}
