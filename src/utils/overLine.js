// The balls of recent overs as short tokens, so the scorer can see how far back Undo has to go.
//   1  0  4  6  1W  2NB  Wd  3Wd  1B  2LB  W  2NB+W
// Runs are the runs that ball added to the score (extras and overthrows included).

export function ballToken(b) {
  const runs = b.runs || 0;
  const ot = b.overthrow || 0;
  const wicket = !!b.isWicket;
  let base;
  if (b.extraType === "wide") {
    const t = runs + 1 + ot;
    base = t === 1 ? "Wd" : `${t}Wd`;
  } else if (b.extraType === "noball") {
    const t = runs + 1 + ot;
    base = t === 1 ? "NB" : `${t}NB`;
  } else if (b.extraType === "bye") {
    base = `${runs + ot}B`;
  } else if (b.extraType === "legbye") {
    base = `${runs + ot}LB`;
  } else {
    base = String(runs + ot);
  }
  if (!wicket) return base;
  if (b.extraType) return `${base}+W`;
  return runs + ot ? `${base}W` : "W";
}

const isLegal = (b) => b.extraType !== "wide" && b.extraType !== "noball";

// [{ over (1-based), tokens: [...], bowlerId }] for the last `count` overs, oldest first.
// Only deliveries are listed (strike swaps and bowler picks are not balls).
export function recentOvers(innings, count = 3) {
  const out = [];
  let legal = 0;
  for (const b of (innings && innings.balls) || []) {
    if (b.type) continue;
    const over = Math.floor(legal / 6) + 1;
    let slot = out[out.length - 1];
    if (!slot || slot.over !== over) {
      slot = { over, tokens: [], bowlerId: b.bowlerId };
      out.push(slot);
    }
    slot.tokens.push(ballToken(b));
    if (isLegal(b)) legal += 1;
  }
  return out.slice(-count);
}
