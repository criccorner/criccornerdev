// Builds a full scorecard (batting, bowling, extras, fall of wickets, strike
// changes) AND a delivery-by-delivery record (used by the player stats and
// analytics) by replaying an innings' log. Pure function: no state, no storage.
// Uses the same rules as cricketEngine.js so both always agree.

export function oversText(legalBalls) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

export function buildScorecard(innings) {
  if (!innings) return null;
  const balls = innings.balls || [];
  let striker = innings.openers.strikerId;
  let nonStriker = innings.openers.nonStrikerId;

  let total = 0;
  let wickets = 0;
  let legal = 0;
  let overIdx = 0; // completed overs so far
  const extras = { wide: 0, noball: 0, bye: 0, legbye: 0 };
  const fow = [];
  const strikeChanges = [];
  const deliveries = [];

  const batMap = new Map();
  const batOrder = [];
  const bowlMap = new Map();
  const bowlOrder = [];

  const bat = (id) => {
    if (!batMap.has(id)) {
      batMap.set(id, { id, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: null, bowlerId: null, fielderId: null });
      batOrder.push(id);
    }
    return batMap.get(id);
  };
  const bowl = (id) => {
    if (!bowlMap.has(id)) {
      bowlMap.set(id, { id, balls: 0, runs: 0, wickets: 0, maidens: 0, wides: 0, noBalls: 0 });
      bowlOrder.push(id);
    }
    return bowlMap.get(id);
  };

  bat(striker);
  bat(nonStriker);
  let over = null; // the over currently being bowled

  for (const ball of balls) {
    if (ball.type === "swap") {
      strikeChanges.push({ overs: oversText(legal), reason: ball.reason || null, fromId: striker, toId: nonStriker });
      [striker, nonStriker] = [nonStriker, striker];
      continue;
    }
    if (ball.type === "bowler") continue; // bowler choices don't change the score

    const wide = ball.extraType === "wide";
    const noBall = ball.extraType === "noball";
    const bye = ball.extraType === "bye";
    const legBye = ball.extraType === "legbye";
    const isLegal = !wide && !noBall;
    const runs = ball.runs || 0;
    const nbType = noBall ? ball.noBallRunType || "bat" : null;
    const ot = ball.overthrow || 0;
    const otType = ot ? ball.overthrowType || "bat" : null;
    const otBat = !wide && otType === "bat" ? ot : 0;
    const otBye = !wide && otType === "bye" ? ot : 0;
    const otLegBye = !wide && otType === "legbye" ? ot : 0;
    const teamRuns = runs + (wide || noBall ? 1 : 0) + ot;
    total += teamRuns;

    const toBat = !ball.extraType || (noBall && nbType === "bat");
    const toBye = bye || (noBall && nbType === "bye");
    const toLegBye = legBye || (noBall && nbType === "legbye");

    if (wide) extras.wide += teamRuns;
    if (noBall) extras.noball += 1;
    if (toBye) extras.bye += runs;
    if (toLegBye) extras.legbye += runs;
    extras.bye += otBye;
    extras.legbye += otLegBye;

    const bowler = bowl(ball.bowlerId);
    const charged = teamRuns - (toBye || toLegBye ? runs : 0) - otBye - otLegBye;
    bowler.runs += charged;
    if (wide) bowler.wides += 1;
    if (noBall) bowler.noBalls += 1;
    if (!over) over = { bowlerId: ball.bowlerId, runs: 0, legal: 0 };
    over.runs += charged;
    if (over.bowlerId !== ball.bowlerId) over.mixed = true;

    const facingId = ball.batsmanId || striker;
    const row = bat(facingId);
    if (toBat) {
      row.runs += runs;
      if (runs === 4) row.fours += 1;
      if (runs === 6) row.sixes += 1;
    }
    row.runs += otBat;
    const legalBefore = legal;
    if (isLegal) {
      legal += 1;
      bowler.balls += 1;
      row.balls += 1;
      over.legal += 1;
    } else if (noBall) {
      row.balls += 1; // the batter faces a no-ball; it is not a legal delivery for the over or the bowler
    }

    const bowlerCredited = !!ball.isWicket && ball.dismissalType !== "Run Out" && ball.dismissalType !== "Retired Hurt";
    deliveries.push({
      overIndex: overIdx,
      legalBefore,
      batterId: facingId,
      bowlerId: ball.bowlerId,
      batRuns: (toBat ? runs : 0) + otBat,
      shot: ball.shot || null,
      zone: ball.zone || null,
      overthrow: ot,
      overthrowType: otType,
      wicketBall: !!ball.isWicket,
      teamRuns,
      extraType: ball.extraType || null,
      noBallRunType: nbType,
      legal: isLegal,
      isWicket: !!ball.isWicket,
      dismissalType: ball.dismissalType || null,
      outId: ball.isWicket ? striker : null,
      fielderId: ball.isWicket ? ball.fielderId || null : null,
      bowlerCredited,
      byeRuns: (toBye ? runs : 0) + otBye,
      chargedRuns: charged, // runs charged to the bowler (no byes / leg-byes)
    });

    if (ball.isWicket) {
      wickets += 1;
      const outRow = bat(striker);
      outRow.out = true;
      outRow.dismissal = ball.dismissalType || "Out";
      outRow.fielderId = ball.fielderId || null;
      if (bowlerCredited) {
        bowler.wickets += 1;
        outRow.bowlerId = ball.bowlerId;
      }
      fow.push({ wicket: wickets, runs: total, batsmanId: striker, overs: oversText(legal) });
      if (ball.newBatsmanId) {
        striker = ball.newBatsmanId;
        bat(striker);
      }
    } else if ((runs + ot) % 2 === 1) {
      [striker, nonStriker] = [nonStriker, striker];
    }

    if (isLegal && over.legal === 6) {
      if (over.runs === 0 && !over.mixed) bowl(over.bowlerId).maidens += 1;
      over = null;
      overIdx += 1;
      [striker, nonStriker] = [nonStriker, striker];
    }
  }

  const batting = batOrder.map((id) => {
    const r = batMap.get(id);
    return { ...r, strikeRate: r.balls ? (r.runs * 100) / r.balls : 0 };
  });
  const bowling = bowlOrder.map((id) => {
    const r = bowlMap.get(id);
    return { ...r, overs: oversText(r.balls), economy: r.balls ? r.runs / (r.balls / 6) : 0 };
  });

  const ballsLeft = Math.max((innings.totalOvers || 0) * 6 - legal, 0);
  const needed = innings.target != null ? Math.max(innings.target - total, 0) : null;

  return {
    total,
    wickets,
    legalBalls: legal,
    overs: oversText(legal),
    runRate: legal ? total / (legal / 6) : 0,
    requiredRate: needed != null && ballsLeft > 0 ? (needed * 6) / ballsLeft : null,
    needed,
    ballsLeft,
    extras,
    extrasTotal: extras.wide + extras.noball + extras.bye + extras.legbye,
    batting,
    bowling,
    fow,
    strikeChanges,
    deliveries,
    striker,
    nonStriker,
  };
}

// Text under a batter's name, e.g. "b Ravi", "c Asha b Ravi", "run out (Asha)", "not out".
export function dismissalText(row, nameOf, isAtCrease) {
  if (!row.out) return isAtCrease ? "batting" : "not out";
  const bowler = row.bowlerId ? nameOf(row.bowlerId) : null;
  const fielder = row.fielderId ? nameOf(row.fielderId) : null;
  const b = bowler ? ` b ${bowler}` : "";
  switch (row.dismissal) {
    case "Bowled": return `b ${bowler || "?"}`;
    case "LBW": return `lbw${b}`;
    case "Caught":
      if (row.fielderId && row.fielderId === row.bowlerId) return `c & b ${bowler}`;
      return fielder ? `c ${fielder}${b}` : `caught${b}`;
    case "Stumped": return fielder ? `st ${fielder}${b}` : `st${b}`;
    case "Hit Wicket": return `hit wicket${b}`;
    case "Run Out": return fielder ? `run out (${fielder})` : "run out";
    case "Retired Hurt": return "retired hurt";
    default: return "out";
  }
}
