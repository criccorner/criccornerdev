// Player career stats and analytics, computed from the match logs in this
// account's workspace. Pure functions: no storage, no React.
import { buildScorecard } from "../utils/scorecard";
import { squadIds } from "../utils/squads";

export const PHASE_LABEL = { powerplay: "Powerplay", middle: "Middle overs", death: "Death overs" };
const PHASES = ["powerplay", "middle", "death"];

// Phases scale with match length: first ~30% (T20-style) / 20% (longer) is the
// powerplay, the last 20% is the death, everything between is the middle.
export function phaseOf(overIndex, totalOvers) {
  const n = Math.max(totalOvers || 1, 1);
  const pp = Math.max(1, Math.ceil(n * (n <= 20 ? 0.3 : 0.2)));
  const death = Math.max(1, Math.ceil(n * 0.2));
  if (overIndex < pp) return "powerplay";
  if (overIndex >= n - death) return "death";
  return "middle";
}

// Completed matches (all innings) plus the finished 1st innings of live matches.
// An innings that is still being scored is left out so stats aren't half-baked.
export function collectInnings(matches) {
  const out = [];
  for (const m of matches || []) {
    if (!m || !m.innings1) continue;
    const parts = [];
    if (m.status === "completed") {
      parts.push([1, m.innings1]);
      if (m.innings2) parts.push([2, m.innings2]);
    } else if (m.status === "live" && m.currentInnings === 2) {
      parts.push([1, m.innings1]);
    }
    for (const [no, innings] of parts) out.push({ match: m, no, innings, sc: buildScorecard(innings) });
  }
  return out;
}

const blankPhase = () => ({ balls: 0, runs: 0, outs: 0, dots: 0, fours: 0, sixes: 0, wickets: 0, boundaries: 0 });
const per = (a, b) => (b ? a / b : 0);
const isRealOut = (row) => row.out && row.dismissal !== "Retired Hurt";

export function computePlayerStats({ matches, teams, playerId }) {
  const list = collectInnings(matches);
  const teamName = (id) => (teams || []).find((t) => t.id === id)?.name || "Opponent";
  const matchIds = new Set();

  const batInns = [];
  const bowlInns = [];
  const bat = { balls: 0, runs: 0, dots: 0, ones: 0, twos: 0, threes: 0, fours: 0, sixes: 0, outs: 0 };
  const batPhase = { powerplay: blankPhase(), middle: blankPhase(), death: blankPhase() };
  const startSet = { startBalls: 0, startRuns: 0, laterBalls: 0, laterRuns: 0 };
  const bowl = { balls: 0, runs: 0, dots: 0, boundaries: 0, wides: 0, noBalls: 0, wickets: 0 };
  const bowlPhase = { powerplay: blankPhase(), middle: blankPhase(), death: blankPhase() };
  const wicketTypes = {};
  const field = { catches: 0, runOuts: 0, caughtAndBowled: 0 };
  const keep = { innings: 0, catches: 0, stumpings: 0, runOuts: 0, byes: 0 };

  list.forEach(({ match, no, innings, sc }, order) => {
    const total = innings.totalOvers;
    const inRoster = [match.teamAId, match.teamBId].some((id) => squadIds(match, teams, id).includes(playerId));
    const bRow = sc.batting.find((r) => r.id === playerId);
    const wRow = sc.bowling.find((r) => r.id === playerId);
    const isKeeper = innings.keeperId === playerId;
    if (inRoster || bRow || wRow || isKeeper || sc.deliveries.some((d) => d.fielderId === playerId)) matchIds.add(match.id);

    if (bRow) {
      batInns.push({
        matchId: match.id, order, date: match.date, no,
        runs: bRow.runs, balls: bRow.balls, fours: bRow.fours, sixes: bRow.sixes,
        out: isRealOut(bRow), dismissal: bRow.dismissal,
        position: sc.batting.indexOf(bRow) + 1,
        opponent: teamName(innings.bowlingTeamId),
      });
    }
    if (wRow) {
      bowlInns.push({
        matchId: match.id, order, date: match.date, no,
        balls: wRow.balls, runs: wRow.runs, wickets: wRow.wickets, maidens: wRow.maidens,
        wides: wRow.wides, noBalls: wRow.noBalls,
        opponent: teamName(innings.battingTeamId),
      });
    }

    let faced = 0; // legal balls this player has faced so far in this innings
    for (const d of sc.deliveries) {
      const phase = phaseOf(d.overIndex, total);

      if (d.batterId === playerId) {
        const faces = d.legal || d.extraType === "noball"; // a no-ball is a ball the batter faces
        if (faces) {
          faced += 1;
          bat.balls += 1; batPhase[phase].balls += 1;
          if (d.batRuns === 0) { bat.dots += 1; batPhase[phase].dots += 1; }
          if (d.batRuns === 1) bat.ones += 1;
          if (d.batRuns === 2) bat.twos += 1;
          if (d.batRuns === 3) bat.threes += 1;
          if (d.batRuns === 4) { bat.fours += 1; batPhase[phase].fours += 1; }
          if (d.batRuns === 6) { bat.sixes += 1; batPhase[phase].sixes += 1; }
        }
        bat.runs += d.batRuns; batPhase[phase].runs += d.batRuns;
        const early = faces ? faced <= 10 : faced < 10;
        if (early) { if (faces) startSet.startBalls += 1; startSet.startRuns += d.batRuns; }
        else { if (faces) startSet.laterBalls += 1; startSet.laterRuns += d.batRuns; }
      }
      if (d.outId === playerId && d.dismissalType !== "Retired Hurt") { bat.outs += 1; batPhase[phase].outs += 1; }

      if (d.bowlerId === playerId) {
        bowl.runs += d.chargedRuns; bowlPhase[phase].runs += d.chargedRuns;
        if (d.extraType === "wide") bowl.wides += 1;
        if (d.extraType === "noball") bowl.noBalls += 1;
        if (d.legal) {
          bowl.balls += 1; bowlPhase[phase].balls += 1;
          if (d.chargedRuns === 0) { bowl.dots += 1; bowlPhase[phase].dots += 1; }
          if (d.batRuns >= 4) { bowl.boundaries += 1; bowlPhase[phase].boundaries += 1; }
        }
        if (d.bowlerCredited) {
          bowl.wickets += 1; bowlPhase[phase].wickets += 1;
          wicketTypes[d.dismissalType] = (wicketTypes[d.dismissalType] || 0) + 1;
        }
      }

      if (d.isWicket && d.fielderId === playerId) {
        if (d.dismissalType === "Stumped") keep.stumpings += 1;
        else if (d.dismissalType === "Caught") {
          if (isKeeper) keep.catches += 1;
          else { field.catches += 1; if (d.bowlerId === playerId) field.caughtAndBowled += 1; }
        } else if (d.dismissalType === "Run Out") {
          if (isKeeper) keep.runOuts += 1; else field.runOuts += 1;
        }
      }
      if (isKeeper) keep.byes += d.byeRuns;
    }
    if (isKeeper) keep.innings += 1;
  });

  // ---------------- headline numbers ----------------
  const outs = batInns.filter((i) => i.out).length;
  const battingRuns = batInns.reduce((x, i) => x + i.runs, 0);
  const battingBalls = batInns.reduce((x, i) => x + i.balls, 0);
  let highest = null;
  batInns.forEach((i) => { if (!highest || i.runs > highest.runs || (i.runs === highest.runs && !i.out && highest.out)) highest = { runs: i.runs, notOut: !i.out }; });
  const battingSummary = {
    innings: batInns.length,
    notOuts: batInns.length - outs,
    runs: battingRuns,
    balls: battingBalls,
    highest,
    average: outs ? battingRuns / outs : null,
    strikeRate: per(battingRuns * 100, battingBalls),
    fifties: batInns.filter((i) => i.runs >= 50 && i.runs < 100).length,
    hundreds: batInns.filter((i) => i.runs >= 100).length,
    fours: batInns.reduce((x, i) => x + i.fours, 0),
    sixes: batInns.reduce((x, i) => x + i.sixes, 0),
    ducks: batInns.filter((i) => i.out && i.runs === 0).length,
  };

  const bBalls = bowlInns.reduce((x, i) => x + i.balls, 0);
  const bRuns = bowlInns.reduce((x, i) => x + i.runs, 0);
  const bWkts = bowlInns.reduce((x, i) => x + i.wickets, 0);
  let best = null;
  bowlInns.forEach((i) => { if (!best || i.wickets > best.wickets || (i.wickets === best.wickets && i.runs < best.runs)) best = { wickets: i.wickets, runs: i.runs }; });
  const bowlingSummary = {
    innings: bowlInns.length,
    balls: bBalls,
    overs: `${Math.floor(bBalls / 6)}.${bBalls % 6}`,
    maidens: bowlInns.reduce((x, i) => x + i.maidens, 0),
    runs: bRuns,
    wickets: bWkts,
    best,
    average: bWkts ? bRuns / bWkts : null,
    economy: bBalls ? bRuns / (bBalls / 6) : 0,
    strikeRate: bWkts ? bBalls / bWkts : null,
    threeW: bowlInns.filter((i) => i.wickets >= 3 && i.wickets < 5).length,
    fiveW: bowlInns.filter((i) => i.wickets >= 5).length,
    wides: bowlInns.reduce((x, i) => x + i.wides, 0),
    noBalls: bowlInns.reduce((x, i) => x + i.noBalls, 0),
  };

  const fieldingSummary = { ...field, total: field.catches + field.runOuts };
  const keepingSummary = { ...keep, total: keep.catches + keep.stumpings + keep.runOuts };

  // ---------------- analytics ----------------
  const phaseRows = (src, kind) =>
    PHASES.map((p) => {
      const x = src[p];
      return kind === "bat"
        ? { phase: p, label: PHASE_LABEL[p], balls: x.balls, runs: x.runs, outs: x.outs, strikeRate: per(x.runs * 100, x.balls), dotPct: per(x.dots * 100, x.balls), boundaryPct: per((x.fours + x.sixes) * 100, x.balls) }
        : { phase: p, label: PHASE_LABEL[p], balls: x.balls, runs: x.runs, wickets: x.wickets, economy: per(x.runs, x.balls / 6), dotPct: per(x.dots * 100, x.balls), boundaryPct: per(x.boundaries * 100, x.balls) };
    });

  const group = (rows, keyFn, labels) =>
    labels.map((label) => {
      const sel = rows.filter((r) => keyFn(r) === label);
      const runs = sel.reduce((x, r) => x + r.runs, 0);
      const balls = sel.reduce((x, r) => x + r.balls, 0);
      const o = sel.filter((r) => r.out).length;
      return { label, innings: sel.length, runs, balls, average: o ? runs / o : null, strikeRate: per(runs * 100, balls) };
    });

  const battingAnalytics = {
    balls: bat.balls,
    runs: bat.runs,
    strikeRate: per(bat.runs * 100, bat.balls),
    dotPct: per(bat.dots * 100, bat.balls),
    boundaryPct: per((bat.fours + bat.sixes) * 100, bat.balls),
    ballsPerBoundary: bat.fours + bat.sixes ? bat.balls / (bat.fours + bat.sixes) : null,
    rotationPct: per((bat.ones + bat.twos + bat.threes) * 100, bat.balls), // balls where the batters ran 1-3
    distribution: [
      { label: "Dot", value: bat.dots }, { label: "1", value: bat.ones }, { label: "2", value: bat.twos },
      { label: "3", value: bat.threes }, { label: "4", value: bat.fours }, { label: "6", value: bat.sixes },
    ],
    phases: phaseRows(batPhase, "bat"),
    start: {
      startBalls: startSet.startBalls, startStrikeRate: per(startSet.startRuns * 100, startSet.startBalls),
      laterBalls: startSet.laterBalls, laterStrikeRate: per(startSet.laterRuns * 100, startSet.laterBalls),
    },
    byInningsType: group(batInns, (r) => (r.no === 1 ? "Batting first" : "Chasing"), ["Batting first", "Chasing"]),
    byPosition: group(batInns, (r) => (r.position <= 2 ? "Openers (1-2)" : r.position <= 6 ? "Middle order (3-6)" : "Lower order (7+)"), ["Openers (1-2)", "Middle order (3-6)", "Lower order (7+)"]),
    dismissals: Object.entries(batInns.filter((i) => i.out).reduce((m, i) => ((m[i.dismissal || "Out"] = (m[i.dismissal || "Out"] || 0) + 1), m), {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    twentyPlus: batInns.filter((i) => i.runs >= 20).length,
    inningsCount: batInns.length,
  };

  const overs = bowl.balls / 6;
  const bowlingAnalytics = {
    balls: bowl.balls,
    runs: bowl.runs,
    economy: per(bowl.runs, overs),
    dotPct: per(bowl.dots * 100, bowl.balls),
    boundaryPct: per(bowl.boundaries * 100, bowl.balls),
    extrasPerOver: per(bowl.wides + bowl.noBalls, overs),
    wickets: bowl.wickets,
    wicketsPerInnings: per(bowl.wickets, bowlInns.length),
    phases: phaseRows(bowlPhase, "bowl"),
    wicketTypes: Object.entries(wicketTypes).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    byInningsType: ["Bowling first", "Defending"].map((label) => {
      const sel = bowlInns.filter((r) => (r.no === 1 ? "Bowling first" : "Defending") === label);
      const balls = sel.reduce((x, r) => x + r.balls, 0);
      const runs = sel.reduce((x, r) => x + r.runs, 0);
      return { label, innings: sel.length, balls, wickets: sel.reduce((x, r) => x + r.wickets, 0), economy: per(runs, balls / 6) };
    }),
    inningsCount: bowlInns.length,
  };

  const byOrder = (a, b) => (a.date === b.date ? a.order - b.order : String(a.date).localeCompare(String(b.date)));
  const stats = {
    hasData: matchIds.size > 0,
    matches: matchIds.size,
    batting: battingSummary,
    bowling: bowlingSummary,
    fielding: fieldingSummary,
    keeping: keepingSummary,
    form: {
      batting: [...batInns].sort(byOrder).slice(-5).reverse(),
      bowling: [...bowlInns].sort(byOrder).slice(-5).reverse(),
    },
    analytics: { batting: battingAnalytics, bowling: bowlingAnalytics },
  };
  stats.analytics.insights = buildInsights(stats);
  return stats;
}

// ---------------------------------------------------------------------------
// Rule-based insights. Each rule needs a minimum sample so a couple of balls
// can't produce a "strength". Numbers are always included so the reasoning is visible.
// ---------------------------------------------------------------------------
const f0 = (n) => Math.round(n).toString();
const f1 = (n) => n.toFixed(1);

export function buildInsights(stats) {
  const strengths = [];
  const weaknesses = [];
  const strongAreas = [];
  const b = stats.analytics.batting;
  const w = stats.analytics.bowling;
  const MIN_PHASE_BALLS = 12;
  const add = (list, area, title, detail, weight) => list.push({ area, title, detail, weight });

  // ----- batting -----
  if (b.balls >= 30) {
    b.phases.forEach((p) => {
      if (p.balls < MIN_PHASE_BALLS || !b.strikeRate) return;
      const r = p.strikeRate / b.strikeRate;
      if (r >= 1.2) add(strengths, "Batting", `Strong in the ${p.label.toLowerCase()}`, `Strike rate ${f0(p.strikeRate)} here vs ${f0(b.strikeRate)} overall (${p.balls} balls).`, r - 1);
      else if (r <= 0.8) add(weaknesses, "Batting", `Slower in the ${p.label.toLowerCase()}`, `Strike rate ${f0(p.strikeRate)} here vs ${f0(b.strikeRate)} overall (${p.balls} balls).`, 1 - r);
    });
    if (b.boundaryPct >= 20) add(strengths, "Batting", "Finds the boundary", `${f0(b.boundaryPct)}% of balls faced go for four or six.`, b.boundaryPct / 100);
    else if (b.boundaryPct <= 8) add(weaknesses, "Batting", "Few boundaries", `Only ${f0(b.boundaryPct)}% of balls faced go for four or six.`, (8 - b.boundaryPct) / 8);
    if (b.dotPct <= 35) add(strengths, "Batting", "Keeps the scoreboard moving", `Only ${f0(b.dotPct)}% of balls faced are dots.`, (35 - b.dotPct) / 35);
    else if (b.dotPct >= 50) add(weaknesses, "Batting", "Too many dot balls", `${f0(b.dotPct)}% of balls faced are dots. Look to rotate the strike with singles.`, (b.dotPct - 50) / 50);
  }
  const st = b.start;
  if (st.startBalls >= 20 && st.laterBalls >= 20 && st.laterStrikeRate > 0) {
    const r = st.startStrikeRate / st.laterStrikeRate;
    if (r <= 0.7) add(weaknesses, "Batting", "Slow starts", `Strike rate ${f0(st.startStrikeRate)} in the first 10 balls vs ${f0(st.laterStrikeRate)} after.`, 1 - r);
    else if (r >= 1.1) add(strengths, "Batting", "Quick starter", `Strike rate ${f0(st.startStrikeRate)} in the first 10 balls vs ${f0(st.laterStrikeRate)} after.`, r - 1);
  }
  const outsTotal = b.dismissals.reduce((x, d) => x + d.value, 0);
  if (outsTotal >= 4 && b.dismissals[0].value / outsTotal >= 0.5) {
    add(weaknesses, "Batting", `Most often out ${b.dismissals[0].label.toLowerCase()}`, `${b.dismissals[0].value} of ${outsTotal} dismissals.`, b.dismissals[0].value / outsTotal);
  }
  if (b.inningsCount >= 4) {
    const rate = (b.twentyPlus * 100) / b.inningsCount;
    if (rate >= 50) add(strengths, "Batting", "Consistent", `Scored 20+ in ${b.twentyPlus} of ${b.inningsCount} innings.`, rate / 100);
    else if (rate <= 20) add(weaknesses, "Batting", "Struggles to get going", `Scored 20+ in only ${b.twentyPlus} of ${b.inningsCount} innings.`, (20 - rate) / 20 + 0.1);
  }
  // strong areas (best situations)
  const bestPhase = b.phases.filter((p) => p.balls >= MIN_PHASE_BALLS).sort((x, y) => y.strikeRate - x.strikeRate)[0];
  if (bestPhase) strongAreas.push({ area: "Batting", label: bestPhase.label, detail: `Strike rate ${f0(bestPhase.strikeRate)}` });
  const bestPos = b.byPosition.filter((p) => p.innings >= 2 && p.balls > 0).sort((x, y) => y.strikeRate - x.strikeRate)[0];
  if (bestPos) strongAreas.push({ area: "Batting", label: bestPos.label, detail: `${bestPos.runs} runs, strike rate ${f0(bestPos.strikeRate)}` });
  const bestType = b.byInningsType.filter((p) => p.innings >= 2 && p.balls > 0).sort((x, y) => y.strikeRate - x.strikeRate)[0];
  if (bestType && b.byInningsType.filter((p) => p.innings >= 2).length > 1) strongAreas.push({ area: "Batting", label: bestType.label, detail: `Strike rate ${f0(bestType.strikeRate)}` });

  // ----- bowling -----
  if (w.balls >= 30) {
    w.phases.forEach((p) => {
      if (p.balls < MIN_PHASE_BALLS || !w.economy) return;
      const r = p.economy / w.economy;
      if (r <= 0.85) add(strengths, "Bowling", `Economical in the ${p.label.toLowerCase()}`, `Economy ${f1(p.economy)} here vs ${f1(w.economy)} overall (${p.balls} balls).`, 1 - r);
      else if (r >= 1.2) add(weaknesses, "Bowling", `Expensive in the ${p.label.toLowerCase()}`, `Economy ${f1(p.economy)} here vs ${f1(w.economy)} overall (${p.balls} balls).`, r - 1);
    });
    if (w.dotPct >= 45) add(strengths, "Bowling", "Builds pressure", `${f0(w.dotPct)}% of balls bowled are dots.`, w.dotPct / 100);
    else if (w.dotPct <= 30) add(weaknesses, "Bowling", "Few dot balls", `Only ${f0(w.dotPct)}% of balls bowled are dots.`, (30 - w.dotPct) / 30);
    if (w.boundaryPct >= 20) add(weaknesses, "Bowling", "Leaks boundaries", `${f0(w.boundaryPct)}% of balls bowled are hit for four or six.`, w.boundaryPct / 100);
    else if (w.boundaryPct <= 8) add(strengths, "Bowling", "Hard to hit for boundaries", `Only ${f0(w.boundaryPct)}% of balls bowled go for four or six.`, (8 - w.boundaryPct) / 8);
    if (w.extrasPerOver >= 1) add(weaknesses, "Bowling", "Too many wides and no-balls", `${f1(w.extrasPerOver)} wides + no-balls per over.`, w.extrasPerOver / 2);
    else if (w.extrasPerOver <= 0.3) add(strengths, "Bowling", "Disciplined line and length", `Only ${f1(w.extrasPerOver)} wides + no-balls per over.`, 0.3 - w.extrasPerOver + 0.1);
  }
  if (w.inningsCount >= 3 && w.wicketsPerInnings >= 1.5) add(strengths, "Bowling", "Wicket-taker", `${f1(w.wicketsPerInnings)} wickets per innings.`, w.wicketsPerInnings / 3);
  const bestBowlPhase = w.phases.filter((p) => p.balls >= MIN_PHASE_BALLS).sort((x, y) => x.economy - y.economy)[0];
  if (bestBowlPhase) strongAreas.push({ area: "Bowling", label: bestBowlPhase.label, detail: `Economy ${f1(bestBowlPhase.economy)}` });

  // ----- fielding / keeping -----
  if (stats.matches >= 3 && stats.fielding.total / stats.matches >= 1) add(strengths, "Fielding", "Active in the field", `${stats.fielding.total} catches and run-outs in ${stats.matches} matches.`, 0.3);
  if (stats.keeping.innings >= 2) {
    const byesPer = stats.keeping.byes / stats.keeping.innings;
    if (byesPer >= 6) add(weaknesses, "Wicketkeeping", "Byes conceded", `${f1(byesPer)} byes per innings behind the stumps.`, byesPer / 12);
    else if (byesPer <= 2) add(strengths, "Wicketkeeping", "Tidy keeping", `Only ${f1(byesPer)} byes per innings behind the stumps.`, 0.3);
  }

  const top = (l) => l.sort((x, y) => y.weight - x.weight).slice(0, 5);
  const inningsTotal = b.inningsCount + w.inningsCount;
  return {
    strengths: top(strengths),
    weaknesses: top(weaknesses),
    strongAreas,
    limited: inningsTotal < 3,
    note:
      inningsTotal === 0
        ? "No batting or bowling data yet."
        : inningsTotal < 3
        ? "Limited data: insights become more reliable after about 5 innings."
        : null,
  };
}
