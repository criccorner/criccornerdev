// ---------------------------------------------------------------------------
// Cricket scoring engine
//
// The ball-by-ball log ("balls" array) is the single source of truth for an
// innings. Score, overs, batter/bowler stats, who is on strike and who is
// bowling are all DERIVED by replaying that log. Undo = drop the last entry.
//
// Because EVERY scorer action is an entry in one ordered log, Undo always
// reverses exactly the last thing the scorer did, in order:
//   - a delivery      { over, runs, extraType, isWicket, fielderId, ... }
//   - strike change   { type: "swap", reason }
//   - bowler picked / changed   { type: "bowler", bowlerId, kind }
//
// Known simplifications:
//  - A wicket is assumed to dismiss the striker (run-out of non-striker: TODO).
//  - Free-hit after a no-ball is not tracked.
// ---------------------------------------------------------------------------

export const EXTRA_TYPES = { WIDE: "wide", NO_BALL: "noball", BYE: "bye", LEG_BYE: "legbye" };

export const DISMISSAL_TYPES = ["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retired Hurt"];

export function createInnings({ battingTeamId, bowlingTeamId, strikerId, nonStrikerId, bowlerId, totalOvers, target = null, keeperId = null }) {
  return {
    battingTeamId,
    bowlingTeamId,
    totalOvers,
    target,
    openers: { strikerId, nonStrikerId },
    balls: [],
    // Opening bowler lives here. (Matches saved by older versions also keep
    // later overs here; they are still read correctly.)
    bowlerChangesPerOver: { 0: bowlerId },
    keeperId, // wicketkeeper for this innings (optional)
    complete: false,
  };
}

function isLegalDelivery(ball) {
  return ball.extraType !== EXTRA_TYPES.WIDE && ball.extraType !== EXTRA_TYPES.NO_BALL;
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
  let currentBowler = innings.bowlerChangesPerOver[0] ?? null;
  let bowlerAssigned = currentBowler != null; // has someone been chosen for THIS over?

  for (const ball of balls) {
    if (ball.type === "swap") {
      [striker, nonStriker] = [nonStriker, striker];
      continue;
    }
    if (ball.type === "bowler") {
      currentBowler = ball.bowlerId;
      bowlerAssigned = true;
      continue;
    }

    ensureBatsman(ball.batsmanId || striker);
    ensureBowler(ball.bowlerId);

    const runs = ball.runs || 0;
    const isWide = ball.extraType === EXTRA_TYPES.WIDE;
    const isNoBall = ball.extraType === EXTRA_TYPES.NO_BALL;
    const isBye = ball.extraType === EXTRA_TYPES.BYE;
    const isLegBye = ball.extraType === EXTRA_TYPES.LEG_BYE;
    // A no-ball carries a 1-run penalty PLUS runs off the bat (default), byes or leg-byes.
    const nbType = isNoBall ? ball.noBallRunType || "bat" : null;
    // Overthrows: extra runs after a misfield/throw. They follow the delivery's
    // crediting: off the bat, byes or leg-byes. (On a wide they are wides.)
    const ot = ball.overthrow || 0;
    const otType = ot ? ball.overthrowType || "bat" : null;
    const otBat = !isWide && otType === "bat" ? ot : 0;
    const otBye = !isWide && otType === "bye" ? ot : 0;
    const otLegBye = !isWide && otType === "legbye" ? ot : 0;
    const runsTotal = runs + (isWide || isNoBall ? 1 : 0) + ot;
    totalRuns += runsTotal;

    const toBat = !ball.extraType || (isNoBall && nbType === "bat");
    const toBye = isBye || (isNoBall && nbType === "bye");
    const toLegBye = isLegBye || (isNoBall && nbType === "legbye");

    if (isWide) extrasBreakdown.wide += runsTotal;
    if (isNoBall) extrasBreakdown.noball += 1;
    if (toBye) extrasBreakdown.bye += runs;
    if (toLegBye) extrasBreakdown.legbye += runs;
    extrasBreakdown.bye += otBye;
    extrasBreakdown.legbye += otLegBye;

    // Byes and leg-byes are never charged to the bowler.
    bowlerStats[ball.bowlerId].runs += runsTotal - (toBye || toLegBye ? runs : 0) - otBye - otLegBye;

    if (toBat || otBat) {
      const id = ball.batsmanId || striker;
      ensureBatsman(id);
      if (toBat) {
        batsmenStats[id].runs += runs;
        if (runs === 4) batsmenStats[id].fours += 1;
        if (runs === 6) batsmenStats[id].sixes += 1;
      }
      batsmenStats[id].runs += otBat;
    }

    const legal = isLegalDelivery(ball);
    if (legal) {
      legalBallCount += 1;
      ballsInCurrentOver += 1;
      bowlerStats[ball.bowlerId].balls += 1;
      const id = ball.batsmanId || striker;
      ensureBatsman(id);
      batsmenStats[id].balls += 1;
    } else if (isNoBall) {
      // A no-ball is a ball the batter faces (it is not a legal delivery for the over or the bowler).
      const id = ball.batsmanId || striker;
      ensureBatsman(id);
      batsmenStats[id].balls += 1;
    }

    if (ball.isWicket) {
      wickets += 1;
      if (ball.dismissalType !== "Run Out") bowlerStats[ball.bowlerId].wickets += 1;
      ensureBatsman(striker);
      batsmenStats[striker].out = true;
      batsmenStats[striker].howOut = ball.dismissalType || "Out";
      if (ball.newBatsmanId) {
        striker = ball.newBatsmanId;
        ensureBatsman(striker);
      }
    } else if ((runs + ot) % 2 === 1) {
      [striker, nonStriker] = [nonStriker, striker];
    }

    if (legal && ballsInCurrentOver === 6) {
      [striker, nonStriker] = [nonStriker, striker];
      ballsInCurrentOver = 0;
      currentOverIndex += 1;
      // New over: a bowler must be chosen (unless an older saved match already has one).
      const preset = innings.bowlerChangesPerOver[currentOverIndex];
      if (preset != null) {
        currentBowler = preset;
        bowlerAssigned = true;
      } else {
        bowlerAssigned = false;
      }
    }
  }

  return {
    totalRuns,
    wickets,
    legalBallCount,
    oversDisplay: `${Math.floor(legalBallCount / 6)}.${legalBallCount % 6}`,
    oversNumeric: legalBallCount / 6,
    extrasBreakdown,
    totalExtras: Object.values(extrasBreakdown).reduce((a, b) => a + b, 0),
    batsmenStats,
    bowlerStats,
    striker,
    nonStriker,
    currentOverIndex,
    ballsInCurrentOver,
    currentBowlerId: currentBowler,
    bowlerAssigned,
    isInningsOver:
      wickets >= 10 || legalBallCount >= innings.totalOvers * 6 || (innings.target != null && totalRuns >= innings.target),
  };
}

export function recordBall(innings, ballInput) {
  const summary = computeInningsSummary(innings);
  const ball = {
    over: summary.currentOverIndex,
    ballInOver: summary.ballsInCurrentOver,
    runs: ballInput.runs || 0,
    extraType: ballInput.extraType || null,
    noBallRunType: ballInput.extraType === EXTRA_TYPES.NO_BALL ? ballInput.noBallRunType || "bat" : null,
    isWicket: !!ballInput.isWicket,
    dismissalType: ballInput.dismissalType || null,
    fielderId: ballInput.isWicket ? ballInput.fielderId || null : null, // who took the catch / stumping / run-out
    newBatsmanId: ballInput.newBatsmanId || null,
    bowlerId: ballInput.bowlerId || summary.currentBowlerId,
    batsmanId: ballInput.batsmanId || summary.striker,
    // When the scorer tapped it (ms). Kept for future features.
    at: Number.isFinite(ballInput.at) ? ballInput.at : Date.now(),
  };
  // Optional extras: overthrow runs, the shot played and where the ball went.
  if (ballInput.overthrow > 0) {
    ball.overthrow = Math.min(Math.floor(ballInput.overthrow), 6);
    ball.overthrowType = ["bat", "bye", "legbye"].includes(ballInput.overthrowType) ? ballInput.overthrowType : "bat";
  }
  if (ballInput.shot) ball.shot = ballInput.shot;
  if (ballInput.zone) ball.zone = ballInput.zone;
  return { ...innings, balls: [...innings.balls, ball] };
}

// Undo the last entry, whatever it was: a delivery, a strike change, or a
// bowler selection/change. (Older saved matches that stored later overs'
// bowlers in bowlerChangesPerOver are trimmed so they stay consistent.)
export function undoLastBall(innings) {
  if (innings.balls.length === 0) return innings;
  const trimmed = { ...innings, balls: innings.balls.slice(0, -1) };
  const { currentOverIndex } = computeInningsSummary(trimmed);
  const kept = {};
  Object.keys(trimmed.bowlerChangesPerOver).forEach((k) => {
    if (Number(k) <= currentOverIndex) kept[k] = trimmed.bowlerChangesPerOver[k];
  });
  return { ...trimmed, bowlerChangesPerOver: kept };
}

// Choose the bowler for the over just starting ("start"), or swap the bowler
// part-way through ("change"). Balls already bowled keep their own bowler.
export function setBowler(innings, bowlerId) {
  const kind = needsNewBowler(innings) ? "start" : "change";
  return { ...innings, balls: [...innings.balls, { type: "bowler", bowlerId, kind }] };
}

// Manually swap striker and non-striker. The reason is optional.
export function swapStrike(innings, reason) {
  const text = typeof reason === "string" ? reason.trim().slice(0, 120) : "";
  return { ...innings, balls: [...innings.balls, { type: "swap", reason: text || null }] };
}

export function setKeeper(innings, keeperId) {
  return { ...innings, keeperId: keeperId || null };
}

// True when an over has just finished and nobody has been picked for the next one.
export function needsNewBowler(innings) {
  const s = computeInningsSummary(innings);
  return !s.isInningsOver && s.legalBallCount > 0 && s.ballsInCurrentOver === 0 && !s.bowlerAssigned;
}

// Who bowled the last ball of the previous over (they can't bowl the next one).
export function previousOverBowlerId(innings) {
  const { currentOverIndex } = computeInningsSummary(innings);
  if (currentOverIndex === 0) return null;
  for (let i = innings.balls.length - 1; i >= 0; i--) {
    const b = innings.balls[i];
    if (!b.type && b.over === currentOverIndex - 1) return b.bowlerId;
  }
  return null;
}

// Which bowlers can be picked right now, and why not.
export function bowlerOptions(innings, rosterIds) {
  const prev = previousOverBowlerId(innings);
  const out = {};
  rosterIds.forEach((id) => {
    const blocked = rosterIds.length > 1 && id === prev; // a lone bowler is never blocked
    out[id] = { blocked, why: blocked ? "bowled last over" : null };
  });
  return out;
}

// Short text for what an Undo removed, e.g. "4 runs", "bowler change (Ravi)".
export function describeEntry(e, nameOf) {
  if (!e) return "";
  if (e.type === "swap") return e.reason ? `strike change (${e.reason})` : "strike change";
  if (e.type === "bowler") {
    const who = nameOf ? ` (${nameOf(e.bowlerId)})` : "";
    return `${e.kind === "start" ? "bowler selection" : "bowler change"}${who}`;
  }
  if (e.isWicket) return "wicket";
  if (e.overthrow) {
    const how = e.overthrowType === "bye" ? "byes" : e.overthrowType === "legbye" ? "leg byes" : "off the bat";
    return `${(e.runs || 0) + e.overthrow} runs with ${e.overthrow} overthrow (${how})`;
  }
  const r = e.runs || 0;
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  switch (e.extraType) {
    case EXTRA_TYPES.WIDE:
      return r ? `wide + ${r} (${r + 1} runs)` : "wide";
    case EXTRA_TYPES.NO_BALL: {
      const kind = e.noBallRunType || "bat";
      if (!r) return "no ball";
      if (kind === "bye") return `no ball + ${plural(r, "bye")}`;
      if (kind === "legbye") return `no ball + ${plural(r, "leg bye")}`;
      return `no ball + ${r} off the bat`;
    }
    case EXTRA_TYPES.BYE: return plural(r, "bye");
    case EXTRA_TYPES.LEG_BYE: return plural(r, "leg bye");
    default: return r === 0 ? "dot ball" : plural(r, "run");
  }
}

export function formatOvers(oversDisplay) {
  return oversDisplay;
}
