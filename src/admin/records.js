// Search over everything in the system, for the admin "All records" page. Pure functions (easy to test).
export const TYPES = ["All", "Player", "Team", "Tournament"];

const low = (s) => String(s || "").toLowerCase();

const asPlayer = (p) => ({ type: "Player", id: p.id, title: p.name || "(no name)", sub: [p.phone, p.email, p.role].filter(Boolean).join(" · "), hay: low([p.name, p.phone, p.email].join(" ")) });
const asTeam = (t) => ({ type: "Team", id: t.id, title: t.name || "(no name)", sub: [t.cityLabel || t.city, `${(t.playerIds || []).length} players`].filter(Boolean).join(" · "), hay: low([t.name, t.city, t.cityLabel].join(" ")) });
const asTournament = (t) => ({ type: "Tournament", id: t.id, title: t.name || "(no name)", sub: [t.cityLabel || t.city, t.startDate].filter(Boolean).join(" · "), hay: low([t.name, t.city, t.cityLabel].join(" ")) });

export function asRecords(state) {
  return {
    Player: (state.players || []).filter((p) => !p.deleted).map(asPlayer),
    Team: (state.teams || []).filter((t) => !t.deleted).map(asTeam),
    Tournament: (state.tournaments || []).filter((t) => !t.deleted).map(asTournament),
  };
}

// text: words that must all appear (name, phone, email or city). type: one of TYPES.
export function searchRecords(state, text, type = "All") {
  const rec = asRecords(state);
  const words = low(text).split(/\s+/).filter(Boolean);
  const kinds = type === "All" || !rec[type] ? ["Player", "Team", "Tournament"] : [type];
  const out = [];
  for (const k of kinds) for (const r of rec[k]) if (words.every((w) => r.hay.includes(w))) out.push(r);
  return out.sort((a, b) => a.title.localeCompare(b.title));
}

// Where to open a record (the details screens have the Edit and Delete options).
export function openRecord(navigation, r) {
  if (r.type === "Player") navigation.navigate("Players", { screen: "PlayerStats", params: { playerId: r.id } });
  else if (r.type === "Team") navigation.navigate("Teams", { screen: "TeamDetail", params: { teamId: r.id } });
  else navigation.navigate("Tournaments", { screen: "TournamentDetail", params: { tournamentId: r.id } });
}
