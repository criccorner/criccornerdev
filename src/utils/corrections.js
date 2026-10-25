// Corrections a captain can make to a match, during play or after it ends.
// Everything here is a pure function: it takes the match (or an innings) and
// returns either { changes } / { innings } or { error }. Nothing is saved here.
//
// Rules enforced
//  1. Replace a player: the new player must not already be in the match (so no
//     one plays for both sides), and takes the old player's every role - squad
//     place, captain, keeper, batting, bowling, catches.
//  2. Change how a batter was out: the type must be possible for that delivery
//     (nobody is bowled, caught or LBW off a wide, and only a run out is
//     possible off a no-ball), a catch or stumping needs a fielder, a stumping
//     must be by the wicketkeeper and not by the bowler, and fielders must be
//     on the bowling side.
//  3. Change who bowled an over: the bowler must be in the bowling squad and
//     cannot bowl two overs in a row (checked against the overs before and
//     after).
// Scores never change, so the result of a finished match stays correct.

import { DISMISSAL_TYPES } from "./cricketEngine";
import { buildScorecard } from "./scorecard";

const NO_FIELDER = ["Bowled", "LBW", "Hit Wicket", "Retired Hurt"];
const OFF_WIDE = ["Stumped", "Run Out", "Hit Wicket", "Retired Hurt"];
const OFF_NO_BALL = ["Run Out", "Retired Hurt"];

const swap = (id, from, to) => (id === from ? to : id);

// ---------------------------------------------------------------------------
// 1. Replace a player across the whole match
// ---------------------------------------------------------------------------

function replaceInInnings(inn, from, to) {
  if (!inn) return inn;
  const per = {};
  Object.keys(inn.bowlerChangesPerOver || {}).forEach((k) => { per[k] = swap(inn.bowlerChangesPerOver[k], from, to); });
  return {
    ...inn,
    openers: { strikerId: swap(inn.openers.strikerId, from, to), nonStrikerId: swap(inn.openers.nonStrikerId, from, to) },
    keeperId: swap(inn.keeperId, from, to) || null,
    bowlerChangesPerOver: per,
    balls: (inn.balls || []).map((b) => {
      if (b.type === "swap") return b;
      if (b.type === "bowler") return { ...b, bowlerId: swap(b.bowlerId, from, to) };
      return {
        ...b,
        batsmanId: swap(b.batsmanId, from, to),
        bowlerId: swap(b.bowlerId, from, to),
        fielderId: swap(b.fielderId, from, to),
        newBatsmanId: swap(b.newBatsmanId, from, to),
      };
    }),
  };
}

// Everyone who has a part in the match: squads, batters, bowlers, fielders.
export function playersInMatch(match) {
  const ids = new Set([...(match.squadA || []), ...(match.squadB || [])]);
  [match.captainA, match.captainB, match.keeperA, match.keeperB].forEach((x) => x && ids.add(x));
  [match.innings1, match.innings2].forEach((inn) => {
    if (!inn) return;
    [inn.openers.strikerId, inn.openers.nonStrikerId, inn.keeperId].forEach((x) => x && ids.add(x));
    Object.values(inn.bowlerChangesPerOver || {}).forEach((x) => x && ids.add(x));
    (inn.balls || []).forEach((b) => [b.batsmanId, b.bowlerId, b.fielderId, b.newBatsmanId].forEach((x) => x && ids.add(x)));
  });
  return ids;
}

// Which side ("A" or "B") the player is on. Uses the saved squads, else the team.
export function sideOfPlayer(match, playerId, teams) {
  if (Array.isArray(match.squadA) && match.squadA.includes(playerId)) return "A";
  if (Array.isArray(match.squadB) && match.squadB.includes(playerId)) return "B";
  const t = (id) => (teams || []).find((x) => x.id === id);
  if (!Array.isArray(match.squadA) && (t(match.teamAId)?.playerIds || []).includes(playerId)) return "A";
  if (!Array.isArray(match.squadB) && (t(match.teamBId)?.playerIds || []).includes(playerId)) return "B";
  return null;
}

// Players who could stand in for someone on `side`: not already in the match.
export function replacementCandidates(match, candidates) {
  const used = playersInMatch(match);
  return (candidates || []).filter((p) => !used.has(p.id));
}

export function replacePlayer(match, fromId, toId, teams) {
  if (!match || !fromId || !toId) return { error: "Choose the player to replace and the player who takes over." };
  if (fromId === toId) return { error: "Choose a different player." };
  const side = sideOfPlayer(match, fromId, teams);
  if (!side) return { error: "That player is not in this match." };
  if (playersInMatch(match).has(toId)) {
    return { error: "That player is already in this match. A player cannot play for both teams or twice for one team." };
  }
  const changes = {};
  ["squadA", "squadB"].forEach((k) => { if (Array.isArray(match[k])) changes[k] = match[k].map((id) => swap(id, fromId, toId)); });
  ["captainA", "captainB", "keeperA", "keeperB"].forEach((k) => { if (match[k] === fromId) changes[k] = toId; });
  if (match.innings1) changes.innings1 = replaceInInnings(match.innings1, fromId, toId);
  if (match.innings2) changes.innings2 = replaceInInnings(match.innings2, fromId, toId);
  return { changes, side };
}

// ---------------------------------------------------------------------------
// 2. Wickets: how a batter was out, and who took the catch / stumping
// ---------------------------------------------------------------------------

// Every wicket of an innings with the position of its delivery in innings.balls.
export function wicketsOf(innings) {
  if (!innings) return [];
  const sc = buildScorecard(innings);
  const out = [];
  let d = 0;
  (innings.balls || []).forEach((b, index) => {
    if (b.type) return;
    const del = sc.deliveries[d++];
    if (b.isWicket) {
      out.push({
        index,
        outId: del.outId,
        bowlerId: b.bowlerId,
        type: b.dismissalType || null,
        fielderId: b.fielderId || null,
        extraType: b.extraType || null,
        over: del.overIndex,
        overs: `${Math.floor(del.legalBefore / 6)}.${(del.legalBefore % 6) + (del.legal ? 1 : 0)}`,
      });
    }
  });
  return out;
}

// Dismissal types that are possible for this delivery.
export function allowedDismissals(ball) {
  if (ball && ball.extraType === "wide") return DISMISSAL_TYPES.filter((d) => OFF_WIDE.includes(d));
  if (ball && ball.extraType === "noball") return DISMISSAL_TYPES.filter((d) => OFF_NO_BALL.includes(d));
  return DISMISSAL_TYPES.slice();
}

export const needsFielder = (type) => type === "Caught" || type === "Stumped";
export const canHaveFielder = (type) => needsFielder(type) || type === "Run Out";

// ctx: { bowlingIds: [ids of the fielding squad], keeperId }
export function validateDismissal(ball, type, fielderId, ctx) {
  if (!ball || !ball.isWicket) return "That delivery is not a wicket.";
  if (!DISMISSAL_TYPES.includes(type)) return "Choose how the batter was out.";
  if (!allowedDismissals(ball).includes(type)) {
    return ball.extraType === "wide"
      ? `A batter cannot be out ${type} off a wide.`
      : `A batter cannot be out ${type} off a no-ball. Only a run out is possible.`;
  }
  const f = canHaveFielder(type) ? fielderId || null : null;
  if (needsFielder(type) && !f) return type === "Caught" ? "Choose who took the catch." : "Choose who stumped the batter.";
  if (f && !(ctx.bowlingIds || []).includes(f)) return "The fielder must be in the bowling team's squad.";
  if (type === "Stumped") {
    if (f === ball.bowlerId) return "A bowler cannot stump the batter off his own bowling.";
    if (ctx.keeperId && f !== ctx.keeperId) return "Only the wicketkeeper can stump a batter.";
  }
  return null;
}

export function changeDismissal(innings, index, type, fielderId, ctx) {
  const ball = innings && innings.balls[index];
  const err = validateDismissal(ball, type, fielderId, ctx);
  if (err) return { error: err };
  const f = canHaveFielder(type) ? fielderId || null : null;
  const balls = innings.balls.slice();
  balls[index] = { ...ball, dismissalType: type, fielderId: f };
  return { innings: { ...innings, balls } };
}

// ---------------------------------------------------------------------------
// 3. Who bowled which over
// ---------------------------------------------------------------------------

// Replays the log to give each over its entries (deliveries and bowler picks).
function overIndexByEntry(innings) {
  let legal = 0;
  return (innings.balls || []).map((b) => {
    const over = Math.floor(legal / 6);
    if (!b.type && b.extraType !== "wide" && b.extraType !== "noball") legal += 1;
    return over;
  });
}

// [{ over, bowlerIds: [...in order], bowlerId (who started it), balls, split }]
export function oversOf(innings) {
  if (!innings) return [];
  const idx = overIndexByEntry(innings);
  const map = new Map();
  const slot = (over) => {
    if (!map.has(over)) map.set(over, { over, bowlerIds: [], balls: 0 });
    return map.get(over);
  };
  const push = (o, id) => { if (id && !o.bowlerIds.includes(id)) o.bowlerIds.push(id); };
  const opening = innings.bowlerChangesPerOver && innings.bowlerChangesPerOver[0];
  if (opening) push(slot(0), opening);
  innings.balls.forEach((b, i) => {
    if (b.type === "swap") return;
    const o = slot(idx[i]);
    push(o, b.bowlerId);
    if (!b.type && b.extraType !== "wide" && b.extraType !== "noball") o.balls += 1;
  });
  return [...map.values()]
    .sort((a, b) => a.over - b.over)
    .map((o) => ({ ...o, bowlerId: o.bowlerIds[0] || null, split: o.bowlerIds.length > 1 }));
}

export function validateOverBowler(innings, over, bowlerId, ctx) {
  const overs = oversOf(innings);
  const target = overs.find((o) => o.over === over);
  if (!target) return "That over has not been bowled.";
  if (!bowlerId) return "Choose the bowler.";
  if (!(ctx.bowlingIds || []).includes(bowlerId)) return "The bowler must be in the bowling team's squad.";
  if ((ctx.bowlingIds || []).length > 1) {
    const before = overs.find((o) => o.over === over - 1);
    const after = overs.find((o) => o.over === over + 1);
    if (before && before.bowlerIds.includes(bowlerId)) return `A bowler cannot bowl two overs in a row (he bowled over ${over}, the over before).`;
    if (after && after.bowlerIds.includes(bowlerId)) return `A bowler cannot bowl two overs in a row (he bowled over ${over + 2}, the over after).`;
  }
  // A stumping off his own bowling is impossible.
  const idx = overIndexByEntry(innings);
  for (let i = 0; i < innings.balls.length; i++) {
    const b = innings.balls[i];
    if (idx[i] === over && !b.type && b.isWicket && b.dismissalType === "Stumped" && b.fielderId === bowlerId) {
      return "He stumped a batter in that over, so he cannot be the bowler of that over.";
    }
  }
  return null;
}

export function changeOverBowler(innings, over, bowlerId, ctx) {
  const err = validateOverBowler(innings, over, bowlerId, ctx);
  if (err) return { error: err };
  const idx = overIndexByEntry(innings);
  const balls = innings.balls.map((b, i) => (idx[i] === over && b.type !== "swap" ? { ...b, bowlerId } : b));
  const per = { ...(innings.bowlerChangesPerOver || {}) };
  if (over === 0 || per[over] != null) per[over] = bowlerId;
  return { innings: { ...innings, balls, bowlerChangesPerOver: per } };
}

// Everyone who bowled in the innings, with how many overs they were in.
export function bowlersUsed(innings) {
  const count = new Map();
  oversOf(innings).forEach((o) => o.bowlerIds.forEach((id) => count.set(id, (count.get(id) || 0) + 1)));
  return [...count.entries()].map(([id, overs]) => ({ id, overs }));
}

// Replace a bowler by another player of the bowling squad in EVERY delivery he bowled.
// Fixes "I picked the wrong bowler". The new bowler may be someone who has not bowled yet.
export function replaceBowler(innings, fromId, toId, ctx) {
  if (!innings || !fromId || !toId) return { error: "Choose the bowler to replace and who takes over." };
  if (fromId === toId) return { error: "Choose a different player." };
  if (!(ctx.bowlingIds || []).includes(toId)) return { error: "The new bowler must be in the bowling team's squad." };
  if (!bowlersUsed(innings).some((b) => b.id === fromId)) return { error: "That player did not bowl in this innings." };
  const per = {};
  Object.keys(innings.bowlerChangesPerOver || {}).forEach((k) => { per[k] = swap(innings.bowlerChangesPerOver[k], fromId, toId); });
  const next = {
    ...innings,
    bowlerChangesPerOver: per,
    balls: (innings.balls || []).map((b) => {
      if (b.type === "swap") return b;
      return { ...b, bowlerId: swap(b.bowlerId, fromId, toId) };
    }),
  };
  const overs = oversOf(next);
  if ((ctx.bowlingIds || []).length > 1) {
    for (const o of overs) {
      const after = overs.find((x) => x.over === o.over + 1);
      if (after && o.bowlerIds.includes(toId) && after.bowlerIds.includes(toId)) {
        return { error: `That would make him bowl overs ${o.over + 1} and ${o.over + 2} in a row. Change one of those overs first, or choose someone else.` };
      }
    }
  }
  for (const b of next.balls) {
    if (!b.type && b.isWicket && b.dismissalType === "Stumped" && b.fielderId && b.fielderId === b.bowlerId) {
      return { error: "He stumped a batter off those deliveries, so he cannot be the bowler of them." };
    }
  }
  return { innings: next };
}
