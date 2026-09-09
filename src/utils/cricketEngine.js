// ---------------------------------------------------------------------------
// Cricket scoring engine
//
// The ball-by-ball log ("balls" array) is the single source of truth for an
// innings. Score, overs, batsman/bowler stats, and who's on strike are all
// DERIVED from that log by replaying it. This makes "Undo" trivial (drop the
// last ball and recompute) and keeps state consistent.
//
// Known simplifications (fine for a starter app, flag for production):
//  - A wicket is always assumed to dismiss the striker. Run-outs of the
//    non-striker need a small UI addition (pick which end) - see README.
//  - No automatic enforcement of "a bowler can't bowl two overs in a row".
//  - Free-hit (after a no-ball) tracking is not implemented.
// ---------------------------------------------------------------------------

export const EXTRA_TYPES = {
  WIDE: "wide",
  NO_BALL: "noball",
  BYE: "bye",
  LEG_BYE: "legbye",
};

export const DISMISSAL_TYPES = [
  "Bowled",
  "Caught",
  "LBW",
  "Run Out",
  "Stumped",
  "Hit Wicket",
  "Retired Hurt",
];

export function createInnings({ battingTeamId, bowlingTeamId, strikerId, nonStrikerId, bowlerId, totalOvers, target = null }) {
  return {
    battingTeamId,
    bowlingTeamId,
    totalOvers,
    target,
    openers: { strikerId, nonStrikerId },
    balls: [],
    bowlerChangesPerOver: { 0: bowlerId },
    complete: false,
  };
}

function isLegalDelivery(ball) {
  return ball.extraType !== EXTRA_TYPES.WIDE && ball.extraType !== EXTRA_TYPES.NO_BALL;
}

function totalRunsForBall(ball) {
  const base = ball.runs || 0;
  if (ball.extraType === EXTRA_TYPES.WIDE || ball.extraType === EXTRA_TYPES.NO_BALL) {
    return base + 1;
  }
  return base;
}

export function computeInningsSummary(innings) {
  const { balls, openers } = innings;

  let totalRuns = 0;
  let wickets = 0;
  let legalBallCount = 0;
  const extrasBreakdown = { wide: 0, noball: 0, bye: 0, legbye: 0 };

  const batsmenStats = {};
  const bowlerStats = {};

  let striker = openers.strikerId;
  let nonStriker = openers.nonStrikerId;

  const ensureBatsman = (id) => {
    if (!batsmenStats[id]) batsmenStats[id] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: null };
  };
  const ensureBowler = (id) => {
    if (!bowlerStats[id]) bowlerStats[id] = { balls: 0, runs: 0, wickets: 0 };
  };
  ensureBatsman(striker);
  ensureBatsman(nonStriker);

  let ballsInCurrentOver = 0;
  let currentOverIndex = 0;

  for (const ball of balls) {
    ensureBatsman(ball.batsmanId || striker);
    ensureBowler(ball.bowlerId);

    const runsTotal = totalRunsForBall(ball);
    totalRuns += runsTotal;
    bowlerStats[ball.bowlerId].runs += runsTotal;

    if (ball.extraType) {
      extrasBreakdown[ball.extraType] += (ball.runs || 0) + (ball.extraType === EXTRA_TYPES.WIDE || ball.extraType === EXTRA_TYPES.NO_BALL ? 1 : 0);
    }

    const batBoundaryEligible = !ball.extraType || ball.extraType === EXTRA_TYPES.NO_BALL;
    if (batBoundaryEligible) {
      const batsmanId = ball.batsmanId || striker;
      ensureBatsman(batsmanId);
      batsmenStats[batsmanId].runs += ball.runs || 0;
      if (ball.runs === 4) batsmenStats[batsmanId].fours += 1;
      if (ball.runs === 6) batsmenStats[batsmanId].sixes += 1;
    }

    const legal = isLegalDelivery(ball);
    if (legal) {
      legalBallCount += 1;
      ballsInCurrentOver += 1;
      bowlerStats[ball.bowlerId].balls += 1;
      const batsmanId = ball.batsmanId || striker;
      ensureBatsman(batsmanId);
      batsmenStats[batsmanId].balls += 1;
    }

    if (ball.isWicket) {
      wickets += 1;
      if (ball.dismissalType !== "Run Out") bowlerStats[ball.bowlerId].wickets += 1;
      const outBatsman = striker;
      ensureBatsman(outBatsman);
      batsmenStats[outBatsman].out = true;
      batsmenStats[outBatsman].howOut = ball.dismissalType || "Out";
      if (ball.newBatsmanId) {
        striker = ball.newBatsmanId;
        ensureBatsman(striker);
      }
    } else {
      const rotatingRuns = ball.extraType && ball.extraType !== EXTRA_TYPES.NO_BALL
        ? (ball.extraType === EXTRA_TYPES.BYE || ball.extraType === EXTRA_TYPES.LEG_BYE ? ball.runs : 0)
        : ball.runs;
      if (rotatingRuns % 2 === 1) {
        [striker, nonStriker] = [nonStriker, striker];
      }
    }

    if (legal && ballsInCurrentOver === 6) {
      [striker, nonStriker] = [nonStriker, striker];
      ballsInCurrentOver = 0;
      currentOverIndex += 1;
    }
  }

  const oversDisplay = `${Math.floor(legalBallCount / 6)}.${legalBallCount % 6}`;
  const currentBowlerId = innings.bowlerChangesPerOver[currentOverIndex] ?? Object.values(innings.bowlerChangesPerOver).slice(-1)[0];

  return {
    totalRuns,
    wickets,
    legalBallCount,
    oversDisplay,
    oversNumeric: legalBallCount / 6,
    extrasBreakdown,
    totalExtras: Object.values(extrasBreakdown).reduce((a, b) => a + b, 0),
    batsmenStats,
    bowlerStats,
    striker,
    nonStriker,
    currentOverIndex,
    ballsInCurrentOver,
    currentBowlerId,
    isInningsOver:
      wickets >= 10 ||
      legalBallCount >= innings.totalOvers * 6 ||
      (innings.target != null && totalRuns >= innings.target),
  };
}

export function recordBall(innings, ballInput) {
  const summary = computeInningsSummary(innings);
  const ball = {
    over: summary.currentOverIndex,
    ballInOver: summary.ballsInCurrentOver,
    runs: ballInput.runs || 0,
    extraType: ballInput.extraType || null,
    isWicket: !!ballInput.isWicket,
    dismissalType: ballInput.dismissalType || null,
    newBatsmanId: ballInput.newBatsmanId || null,
    bowlerId: ballInput.bowlerId || summary.currentBowlerId,
    batsmanId: ballInput.batsmanId || summary.striker,
  };
  return { ...innings, balls: [...innings.balls, ball] };
}

export function undoLastBall(innings) {
  if (innings.balls.length === 0) return innings;
  return { ...innings, balls: innings.balls.slice(0, -1) };
}

export function setBowlerForOver(innings, overIndex, bowlerId) {
  return { ...innings, bowlerChangesPerOver: { ...innings.bowlerChangesPerOver, [overIndex]: bowlerId } };
}

export function formatOvers(oversDisplay) {
  return oversDisplay;
}
