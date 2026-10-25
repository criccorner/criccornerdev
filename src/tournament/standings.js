// Match results, points table and net run rate. Pure functions.
import { computeInningsSummary } from "../utils/cricketEngine";

export const POINTS = { win: 2, tie: 1, loss: 0 };

// ICC rule: a team that is all out is treated as having faced its full quota of overs.
function oversFaced(innings) {
  const s = computeInningsSummary(innings);
  return s.wickets >= 10 ? innings.totalOvers : s.legalBallCount / 6;
}

export function matchOutcome(match) {
  if (!match || match.status !== "completed" || !match.innings1 || !match.innings2) return { done: false };
  const s1 = computeInningsSummary(match.innings1);
  const s2 = computeInningsSummary(match.innings2);
  const t1 = match.innings1.battingTeamId;
  const t2 = match.innings2.battingTeamId;
  let winnerId = null;
  if (s1.totalRuns > s2.totalRuns) winnerId = t1;
  else if (s2.totalRuns > s1.totalRuns) winnerId = t2;
  return {
    done: true,
    tie: winnerId === null,
    winnerId,
    // For knockouts, a tie can be settled manually (e.g. after a super over).
    decidedWinnerId: winnerId || match.winnerOverride || null,
    t1, t2,
    r1: s1.totalRuns, r2: s2.totalRuns,
    o1: oversFaced(match.innings1), o2: oversFaced(match.innings2),
  };
}

// Points table for the given teams from the given matches (only matches between those teams count).
export function computeStandings(teamIds, matches) {
  const rows = new Map(teamIds.map((id) => [id, { teamId: id, played: 0, won: 0, lost: 0, tied: 0, points: 0, runsFor: 0, oversFor: 0, runsAgainst: 0, oversAgainst: 0, nrr: 0 }]));
  for (const m of matches) {
    const o = matchOutcome(m);
    if (!o.done || !rows.has(o.t1) || !rows.has(o.t2)) continue;
    const a = rows.get(o.t1);
    const b = rows.get(o.t2);
    a.played += 1; b.played += 1;
    a.runsFor += o.r1; a.oversFor += o.o1; a.runsAgainst += o.r2; a.oversAgainst += o.o2;
    b.runsFor += o.r2; b.oversFor += o.o2; b.runsAgainst += o.r1; b.oversAgainst += o.o1;
    if (o.tie) {
      a.tied += 1; b.tied += 1; a.points += POINTS.tie; b.points += POINTS.tie;
    } else {
      const w = o.winnerId === o.t1 ? a : b;
      const l = w === a ? b : a;
      w.won += 1; w.points += POINTS.win;
      l.lost += 1; l.points += POINTS.loss;
    }
  }
  const out = [...rows.values()].map((r) => ({
    ...r,
    nrr: (r.oversFor ? r.runsFor / r.oversFor : 0) - (r.oversAgainst ? r.runsAgainst / r.oversAgainst : 0),
  }));
  out.sort((x, y) => y.points - x.points || y.nrr - x.nrr || y.won - x.won || String(x.teamId).localeCompare(String(y.teamId)));
  return out;
}
