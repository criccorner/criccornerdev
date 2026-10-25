// Match awards, team records and the team's Cricket Hall of Fame.
// Pure functions over the saved ball-by-ball data. Nothing is stored: these are
// worked out each time, so they stay right after a captain correction.
import { buildScorecard } from "../utils/scorecard";
import { squadIds } from "../utils/squads";

// ---- points (used for "Player of the match" and "MVP") ----
export const POINTS = { run: 1, wicket: 20, maiden: 10, catch: 10, stumping: 15, runOut: 10 };
export const POINTS_TEXT = "1 per run, 20 per wicket, 10 per maiden, 10 per catch, 15 per stumping, 10 per run-out";

const blank = () => ({
  batted: false, runs: 0, balls: 0, fours: 0, sixes: 0, out: false,
  bowled: false, bBalls: 0, bRuns: 0, wickets: 0, maidens: 0,
  catches: 0, stumpings: 0, runOuts: 0,
});

export const fieldingOf = (l) => l.catches + l.stumpings + l.runOuts;
export const pointsOf = (l) =>
  l.runs * POINTS.run + l.wickets * POINTS.wicket + l.maidens * POINTS.maiden +
  l.catches * POINTS.catch + l.stumpings * POINTS.stumping + l.runOuts * POINTS.runOut;

const oversText = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;
const isRealOut = (row) => row.out && row.dismissal !== "Retired Hurt";

// One line per player for ONE match (both innings): { batting, bowling, fielding } flattened in `blank()`.
export function matchLines(match) {
  const lines = new Map();
  const get = (id) => {
    if (!lines.has(id)) lines.set(id, blank());
    return lines.get(id);
  };
  for (const inn of [match && match.innings1, match && match.innings2]) {
    if (!inn) continue;
    const sc = buildScorecard(inn);
    for (const r of sc.batting) {
      const l = get(r.id);
      l.batted = true;
      l.runs += r.runs;
      l.balls += r.balls;
      l.fours += r.fours;
      l.sixes += r.sixes;
      if (isRealOut(r)) l.out = true;
      if (isRealOut(r) && r.fielderId) {
        const f = get(r.fielderId);
        if (r.dismissal === "Caught") f.catches += 1;
        else if (r.dismissal === "Stumped") f.stumpings += 1;
        else if (r.dismissal === "Run Out") f.runOuts += 1;
      }
    }
    for (const b of sc.bowling) {
      const l = get(b.id);
      l.bowled = true;
      l.bBalls += b.balls;
      l.bRuns += b.runs;
      l.wickets += b.wickets;
      l.maidens += b.maidens;
    }
  }
  return lines;
}

const econ = (l) => (l.bBalls ? l.bRuns / (l.bBalls / 6) : Infinity);
const strike = (l) => (l.balls ? (l.runs * 100) / l.balls : 0);
const pick = (entries, better) => entries.reduce((best, e) => (!best || better(e, best) ? e : best), null);

// Text for a player's line in a match, e.g. "56 (32) · 5×4 · 2×6".
export function battingText(l) {
  const parts = [`${l.runs} (${l.balls})`];
  if (l.fours) parts.push(`${l.fours}×4`);
  if (l.sixes) parts.push(`${l.sixes}×6`);
  return parts.join(" · ");
}
export const bowlingText = (l) => `${l.wickets}/${l.bRuns} (${oversText(l.bBalls)} ov)`;
export function fieldingText(l) {
  const parts = [];
  if (l.catches) parts.push(`${l.catches} catch${l.catches === 1 ? "" : "es"}`);
  if (l.stumpings) parts.push(`${l.stumpings} stumping${l.stumpings === 1 ? "" : "s"}`);
  if (l.runOuts) parts.push(`${l.runOuts} run-out${l.runOuts === 1 ? "" : "s"}`);
  return parts.join(", ");
}
function allRoundText(l) {
  const parts = [];
  if (l.batted && (l.runs || l.balls)) parts.push(battingText(l));
  if (l.bowled && l.bBalls) parts.push(bowlingText(l));
  const f = fieldingText(l);
  if (f) parts.push(f);
  return parts.join(" · ");
}

// Awards for one finished match. Each award: { playerId, text, points? } or null.
// Player of the match: most points. Batter: most runs (fewer balls wins a tie).
// Bowler: most wickets (fewer runs wins a tie); with no wickets, the most economical bowler.
// Fielder: most catches + stumpings + run-outs.
export function matchAwards(match, teams) {
  if (!match || match.status !== "completed" || !match.innings1) return null;
  if (/^(no result|abandon)/i.test(match.result || "")) return null;
  const lines = matchLines(match);
  const entries = [...lines.entries()].map(([id, l]) => ({ id, l, pts: pointsOf(l) }));
  if (!entries.length) return null;

  // winner side helps break ties for player of the match
  const winnerIds = new Set();
  if (match.innings2) {
    const t1 = buildScorecard(match.innings1).total;
    const t2 = buildScorecard(match.innings2).total;
    const winTeam = t1 === t2 ? null : t2 > t1 ? match.innings2.battingTeamId : match.innings1.battingTeamId;
    if (winTeam) squadIds(match, teams, winTeam).forEach((id) => winnerIds.add(id));
  }

  const pom = pick(entries.filter((e) => e.pts > 0), (a, b) => a.pts > b.pts || (a.pts === b.pts && winnerIds.has(a.id) && !winnerIds.has(b.id)));
  const bat = pick(entries.filter((e) => e.l.runs > 0), (a, b) => a.l.runs > b.l.runs || (a.l.runs === b.l.runs && a.l.balls < b.l.balls));
  let bowl = pick(entries.filter((e) => e.l.wickets > 0), (a, b) => a.l.wickets > b.l.wickets || (a.l.wickets === b.l.wickets && a.l.bRuns < b.l.bRuns));
  if (!bowl) bowl = pick(entries.filter((e) => e.l.bBalls >= 6), (a, b) => econ(a.l) < econ(b.l));
  const fld = pick(entries.filter((e) => fieldingOf(e.l) > 0), (a, b) => fieldingOf(a.l) > fieldingOf(b.l));

  return {
    player: pom && { playerId: pom.id, points: pom.pts, text: allRoundText(pom.l) },
    batter: bat && { playerId: bat.id, text: `${battingText(bat.l)} · SR ${strike(bat.l).toFixed(0)}` },
    bowler: bowl && { playerId: bowl.id, text: bowlingText(bowl.l) + (bowl.l.maidens ? ` · ${bowl.l.maidens} maiden${bowl.l.maidens === 1 ? "" : "s"}` : "") },
    fielder: fld && { playerId: fld.id, text: fieldingText(fld.l) },
  };
}

// ---------------------------------------------------------------------------
// Team record: matches, won, lost, tied, no result, win %
// ---------------------------------------------------------------------------
export function matchOutcomeFor(match, teamId) {
  if (!match || match.status !== "completed") return null;
  if (match.teamAId !== teamId && match.teamBId !== teamId) return null;
  if (/^(no result|abandon)/i.test(match.result || "") || !match.innings1 || !match.innings2) return "nr";
  const t1 = buildScorecard(match.innings1).total;
  const t2 = buildScorecard(match.innings2).total;
  if (t1 === t2) return "tied";
  const winner = t2 > t1 ? match.innings2.battingTeamId : match.innings1.battingTeamId;
  return winner === teamId ? "won" : "lost";
}

export function teamRecord(matches, teamId) {
  const r = { matches: 0, won: 0, lost: 0, tied: 0, noResult: 0, winPct: 0 };
  for (const m of matches || []) {
    const o = matchOutcomeFor(m, teamId);
    if (!o) continue;
    r.matches += 1;
    if (o === "won") r.won += 1;
    else if (o === "lost") r.lost += 1;
    else if (o === "tied") r.tied += 1;
    else r.noResult += 1;
  }
  const decided = r.won + r.lost + r.tied;
  r.winPct = decided ? (r.won * 100) / decided : 0;
  return r;
}

// ---------------------------------------------------------------------------
// Cricket Hall of Fame for one team
// ---------------------------------------------------------------------------
export const MIN_MATCHES_CONSISTENT = 3;
export const CONSISTENT_RUNS = 15;

export const HALL_CATEGORIES = [
  { key: "run_machine", icon: "🏏", title: "Run Machine", blurb: "Highest run-scorer" },
  { key: "wicket_hunter", icon: "🎯", title: "Wicket Hunter", blurb: "Leading wicket-taker" },
  { key: "mvp", icon: "⚡", title: "MVP", blurb: "Most valuable player" },
  { key: "all_rounder", icon: "💪", title: "Best All-Rounder", blurb: "Top batting and bowling contribution" },
  { key: "safe_hands", icon: "🧤", title: "Safe Hands", blurb: "Best fielder" },
  { key: "most_sixes", icon: "🔥", title: "Most Sixes", blurb: "Maximum sixes" },
  { key: "consistent", icon: "📈", title: "Most Consistent", blurb: "Best performance across matches" },
];

export function hallOfFame(matches, teams, teamId, top = 3) {
  const total = new Map();
  let played = 0;
  for (const m of matches || []) {
    if (!m || m.status !== "completed" || !m.innings1) continue;
    if (m.teamAId !== teamId && m.teamBId !== teamId) continue;
    if (/^(no result|abandon)/i.test(m.result || "")) continue;
    played += 1;
    const mine = new Set(squadIds(m, teams, teamId));
    for (const [id, l] of matchLines(m)) {
      if (!mine.has(id)) continue;
      if (!total.has(id)) total.set(id, { id, matches: 0, contributed: 0, ...blank(), maxScore: 0 });
      const t = total.get(id);
      t.matches += 1;
      for (const k of ["runs", "balls", "fours", "sixes", "bBalls", "bRuns", "wickets", "maidens", "catches", "stumpings", "runOuts"]) t[k] += l[k];
      if (l.batted) t.batted = true;
      if (l.bowled) t.bowled = true;
      if (l.runs >= CONSISTENT_RUNS || l.wickets >= 1 || fieldingOf(l) >= 1) t.contributed += 1;
      t.maxScore = Math.max(t.maxScore, l.runs);
    }
  }
  const all = [...total.values()].map((t) => ({ ...t, pts: pointsOf(t) }));
  const rank = (list, cmp) => list.sort(cmp).slice(0, top);

  const out = {
    played,
    run_machine: rank(all.filter((t) => t.runs > 0), (a, b) => b.runs - a.runs || strike(b) - strike(a)).map((t) => ({
      playerId: t.id, value: `${t.runs} runs`, detail: `SR ${strike(t).toFixed(0)}${t.sixes + t.fours ? ` · ${t.fours}×4 ${t.sixes}×6` : ""}`,
    })),
    wicket_hunter: rank(all.filter((t) => t.wickets > 0), (a, b) => b.wickets - a.wickets || econ(a) - econ(b)).map((t) => ({
      playerId: t.id, value: `${t.wickets} wicket${t.wickets === 1 ? "" : "s"}`, detail: `Economy ${econ(t).toFixed(1)}`,
    })),
    mvp: rank(all.filter((t) => t.pts > 0), (a, b) => b.pts - a.pts).map((t) => ({
      playerId: t.id, value: `${t.pts} pts`, detail: `${t.matches} match${t.matches === 1 ? "" : "es"}`,
    })),
    all_rounder: rank(
      all.filter((t) => t.runs > 0 && t.wickets > 0),
      (a, b) => b.runs + 25 * b.wickets - (a.runs + 25 * a.wickets)
    ).map((t) => ({ playerId: t.id, value: `${t.runs} runs · ${t.wickets} wkts`, detail: `${t.matches} match${t.matches === 1 ? "" : "es"}` })),
    safe_hands: rank(all.filter((t) => fieldingOf(t) > 0), (a, b) => fieldingOf(b) - fieldingOf(a) || b.catches - a.catches).map((t) => ({
      playerId: t.id, value: `${fieldingOf(t)} dismissal${fieldingOf(t) === 1 ? "" : "s"}`, detail: fieldingText(t),
    })),
    most_sixes: rank(all.filter((t) => t.sixes > 0), (a, b) => b.sixes - a.sixes || b.runs - a.runs).map((t) => ({
      playerId: t.id, value: `${t.sixes} six${t.sixes === 1 ? "" : "es"}`, detail: `${t.runs} runs`,
    })),
    consistent: rank(
      all.filter((t) => t.matches >= MIN_MATCHES_CONSISTENT),
      (a, b) => b.contributed / b.matches - a.contributed / a.matches || b.pts - a.pts
    ).map((t) => ({ playerId: t.id, value: `${t.contributed} of ${t.matches} matches`, detail: `${Math.round((t.contributed * 100) / t.matches)}% made an impact` })),
  };
  return out;
}
