// Venues the person used before (newest and most used first), optionally filtered by what they are typing.
export function knownVenues(matches, typed = "", limit = 8) {
  const seen = new Map();
  [...(matches || [])]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .forEach((m, i) => {
      const v = String(m.venue || "").trim();
      if (!v) return;
      const k = v.toLowerCase();
      const e = seen.get(k) || { name: v, n: 0, first: i };
      e.n += 1;
      seen.set(k, e);
    });
  const q = String(typed || "").trim().toLowerCase();
  return [...seen.values()]
    .filter((e) => !q || (e.name.toLowerCase().includes(q) && e.name.toLowerCase() !== q))
    .sort((a, b) => a.first - b.first || b.n - a.n)
    .slice(0, limit)
    .map((e) => e.name);
}

// The team's regular eleven: the players who played most for it in its last 10 matches. If there are fewer than
// eleven with a history, the rest are filled from the team's player list in order.
export function regularEleven(teamId, team, matches, validIds) {
  const roster = ((team && team.playerIds) || []).filter((id) => !validIds || validIds.has(id));
  const recent = [...(matches || [])]
    .filter((m) => (m.teamAId === teamId || m.teamBId === teamId) && m.status !== "scheduled")
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 10);
  const count = {};
  for (const m of recent) {
    const squad = (m.teamAId === teamId ? m.squadA : m.squadB) || [];
    for (const id of squad) count[id] = (count[id] || 0) + 1;
  }
  const inRoster = roster.map((id, i) => ({ id, i, n: count[id] || 0 }));
  const played = inRoster.filter((x) => x.n > 0).sort((a, b) => b.n - a.n || a.i - b.i).slice(0, 11);
  const out = played.map((x) => x.id);
  for (const x of inRoster) if (out.length < 11 && !out.includes(x.id)) out.push(x.id);
  return out;
}
