// Batting / bowling / fielding leaderboards for a set of matches (a team's matches or a tournament's matches).
// Pure functions. Uses the finished innings only (see collectInnings).
import { collectInnings } from "./playerStats";

const blank = (id) => ({
  id, matchIds: new Set(),
  bat: { inns: 0, runs: 0, balls: 0, outs: 0, notOut: 0, hundreds: 0, fifties: 0, thirties: 0, sixes: 0, fours: 0 },
  bowl: { balls: 0, runs: 0, wickets: 0, three: 0, five: 0, hatTricks: 0 },
  field: { catches: 0, runOuts: 0 },
});

export function computeLeaderboards(matches, filterTeamId) {
  const map = new Map();
  const get = (id) => { if (!map.has(id)) map.set(id, blank(id)); return map.get(id); };
  for (const { match, innings, sc } of collectInnings(matches)) {
    const battingTeamId = innings.battingTeamId;
    for (const r of sc.batting || []) {
      if (r.balls === 0 && !r.out && r.runs === 0) continue; // did not bat
      if (filterTeamId && battingTeamId && battingTeamId !== filterTeamId) continue;
      const p = get(r.id); p.matchIds.add(match.id);
      p.bat.inns += 1; p.bat.runs += r.runs; p.bat.balls += r.balls;
      p.bat.sixes += r.sixes; p.bat.fours += r.fours;
      if (r.out && r.dismissal !== "Retired Hurt") p.bat.outs += 1; else p.bat.notOut += 1;
      if (r.runs >= 100) p.bat.hundreds += 1; else if (r.runs >= 50) p.bat.fifties += 1; else if (r.runs >= 30) p.bat.thirties += 1;
    }
    const seq = new Map(); // bowlerId -> consecutive legal-ball wicket flags
    for (const d of sc.deliveries || []) {
      if (!d.legal) continue;
      if (!seq.has(d.bowlerId)) seq.set(d.bowlerId, []);
      seq.get(d.bowlerId).push(!!d.bowlerCredited);
    }
    for (const r of sc.bowling || []) {
      if (filterTeamId && battingTeamId && battingTeamId === filterTeamId) continue;
      const p = get(r.id); p.matchIds.add(match.id);
      p.bowl.balls += r.balls; p.bowl.runs += r.runs; p.bowl.wickets += r.wickets;
      if (r.wickets >= 5) p.bowl.five += 1; else if (r.wickets >= 3) p.bowl.three += 1;
      const s = seq.get(r.id) || [];
      let run = 0, ht = 0;
      for (const w of s) { run = w ? run + 1 : 0; if (run === 3) { ht += 1; run = 0; } }
      p.bowl.hatTricks += ht;
    }
    for (const d of sc.deliveries || []) {
      if (!d.isWicket) continue;
      if (filterTeamId && battingTeamId === filterTeamId) continue;
      if (d.dismissalType === "Caught" && d.fielderId) { const p = get(d.fielderId); p.field.catches += 1; p.matchIds.add(match.id); }
      if (d.dismissalType === "Run Out") for (const f of [d.fielderId, d.fielder2Id]) if (f) { const p = get(f); p.field.runOuts += 1; p.matchIds.add(match.id); }
    }
  }
  return [...map.values()].map((p) => ({
    id: p.id, matches: p.matchIds.size,
    bat: { ...p.bat, average: p.bat.outs ? p.bat.runs / p.bat.outs : p.bat.runs, strikeRate: p.bat.balls ? (p.bat.runs * 100) / p.bat.balls : 0 },
    bowl: { ...p.bowl, strikeRate: p.bowl.wickets ? p.bowl.balls / p.bowl.wickets : 0, average: p.bowl.wickets ? p.bowl.runs / p.bowl.wickets : 0 },
    field: p.field,
  }));
}

export const BAT_SORTS = [
  { key: "runs", label: "Highest runs", val: (r) => r.bat.runs },
  { key: "avg", label: "Highest Average", val: (r) => r.bat.average },
  { key: "sr", label: "Highest Strike Rate", val: (r) => r.bat.strikeRate },
  { key: "100", label: "Most 100s", val: (r) => r.bat.hundreds },
  { key: "50", label: "Most 50s", val: (r) => r.bat.fifties },
  { key: "6", label: "Most 6s", val: (r) => r.bat.sixes },
  { key: "4", label: "Most 4s", val: (r) => r.bat.fours },
];
export const BOWL_SORTS = [
  { key: "wk", label: "Highest wickets", val: (r) => r.bowl.wickets },
  { key: "sr", label: "Lowest Strike Rate", val: (r) => r.bowl.strikeRate, low: true },
  { key: "avg", label: "Lowest Average", val: (r) => r.bowl.average, low: true },
  { key: "3", label: "Most 3fers", val: (r) => r.bowl.three },
  { key: "5", label: "Most 5fers", val: (r) => r.bowl.five },
  { key: "ht", label: "Most hat-tricks", val: (r) => r.bowl.hatTricks },
];
export const FIELD_SORTS = [
  { key: "ct", label: "Highest catches", val: (r) => r.field.catches },
  { key: "ro", label: "Highest Runouts", val: (r) => r.field.runOuts },
];

// Rows for a tab, ordered by the chosen sort. Lowest-is-best sorts ignore players with no wickets.
export function rankRows(rows, tab, sortKey) {
  const sorts = tab === "bat" ? BAT_SORTS : tab === "bowl" ? BOWL_SORTS : FIELD_SORTS;
  const s = sorts.find((x) => x.key === sortKey) || sorts[0];
  const base = rows.filter((r) => (tab === "bat" ? r.bat.inns > 0 : tab === "bowl" ? r.bowl.balls > 0 : r.field.catches + r.field.runOuts > 0));
  const pool = s.low ? base.filter((r) => r.bowl.wickets > 0) : base;
  return pool.slice().sort((a, b) => (s.low ? s.val(a) - s.val(b) : s.val(b) - s.val(a)) || b.matches - a.matches);
}
