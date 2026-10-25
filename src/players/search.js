// Find players by name, mobile number or email. Pure function.
const digits = (s) => String(s || "").replace(/\D/g, "");

// `exclude` = ids to leave out (e.g. players already in the team).
// Returns [{ player, by: "mobile" | "email" | "name", exact }] best matches first.
export function searchPlayers(players, query, exclude = [], limit = 20) {
  const q = String(query || "").trim().toLowerCase();
  if (q.length < 2) return [];
  const skip = new Set(exclude);
  const qd = digits(q);
  const looksNumeric = qd.length >= 3 && /^[\d\s+\-().]+$/.test(q);
  const out = [];
  for (const p of players || []) {
    if (!p || skip.has(p.id)) continue;
    const name = String(p.name || "").toLowerCase();
    const email = String(p.email || "").toLowerCase();
    const pd = digits(p.phone);
    let hit = null;
    if (looksNumeric && pd) {
      // compare the last 9 digits so +61 434 916 595, 0434916595 and 434916595 all match
      const a = qd.slice(-9), b = pd.slice(-9);
      if (qd.length >= 9 ? a === b : pd.includes(qd)) hit = { by: "mobile", exact: qd.length >= 9 && a === b, rank: qd.length >= 9 ? 0 : 3 };
    }
    if (!hit && q.includes("@") && email) {
      if (email === q) hit = { by: "email", exact: true, rank: 0 };
      else if (email.includes(q)) hit = { by: "email", exact: false, rank: 3 };
    }
    if (!hit && name) {
      if (name === q) hit = { by: "name", exact: true, rank: 1 };
      else if (name.startsWith(q)) hit = { by: "name", exact: false, rank: 2 };
      else if (name.split(/\s+/).some((w) => w.startsWith(q))) hit = { by: "name", exact: false, rank: 2 };
      else if (name.includes(q)) hit = { by: "name", exact: false, rank: 4 };
    }
    if (!hit && !looksNumeric && !q.includes("@") && email && email.includes(q)) hit = { by: "email", exact: false, rank: 5 };
    if (hit) out.push({ player: p, by: hit.by, exact: hit.exact, rank: hit.rank });
  }
  out.sort((x, y) => x.rank - y.rank || String(x.player.name).localeCompare(String(y.player.name)));
  return out.slice(0, limit);
}
