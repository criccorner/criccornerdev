// Pure building blocks for tournament fixtures. No React, no storage.

export function isValidDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(s, n) {
  const d = new Date(s + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function nextPow2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function shuffled(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Round robin (circle method) ----------
// Returns rounds: [[{a, b}, ...], ...]. Every pair meets once per leg and no
// team plays twice in a round. With an odd number of teams one team rests each round.
export function roundRobin(teamIds, legs = 1) {
  const ids = [...teamIds];
  if (ids.length < 2) return [];
  if (ids.length % 2 === 1) ids.push(null);
  const n = ids.length;
  let arr = [...ids];
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a != null && b != null) round.push(r % 2 === 0 ? { a, b } : { a: b, b: a });
    }
    rounds.push(round);
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
  if (legs >= 2) rounds.push(...rounds.slice().map((round) => round.map((m) => ({ a: m.b, b: m.a }))));
  return rounds;
}

// ---------- Groups ----------
// Snake seeding keeps groups balanced: with 8 teams in 2 groups -> A:1,4,5,8  B:2,3,6,7
export function splitIntoGroups(teamIds, groupCount) {
  const groups = Array.from({ length: groupCount }, () => []);
  teamIds.forEach((id, i) => {
    const row = Math.floor(i / groupCount);
    const col = i % groupCount;
    groups[row % 2 === 0 ? col : groupCount - 1 - col].push(id);
  });
  return groups.map((ids, i) => ({ name: `Group ${String.fromCharCode(65 + i)}`, teamIds: ids }));
}

// ---------- Knockout ----------
// Seed order for a power-of-two bracket, so strong seeds meet as late as possible:
// 8 -> [1, 8, 4, 5, 2, 7, 3, 6]
export function bracketOrder(size) {
  let order = [1];
  while (order.length < size) {
    const m = order.length * 2 + 1;
    order = order.flatMap((s) => [s, m - s]);
  }
  return order;
}

export function roundName(size) {
  if (size === 2) return "Final";
  if (size === 4) return "Semi-finals";
  if (size === 8) return "Quarter-finals";
  return `Round of ${size}`;
}

// First knockout round for any number of teams (>= 2). Top seeds get byes when
// the field isn't a power of two. Entries are in bracket order:
//   { type: "match", a, b }  or  { type: "bye", teamId }
export function knockoutFirstRound(seededTeamIds) {
  const n = seededTeamIds.length;
  if (n < 2) return null;
  const size = nextPow2(n);
  const slots = bracketOrder(size).map((seed) => (seed <= n ? seededTeamIds[seed - 1] : null));
  const entries = [];
  for (let i = 0; i < size; i += 2) {
    const a = slots[i];
    const b = slots[i + 1];
    entries.push(a && b ? { type: "match", a, b } : { type: "bye", teamId: a || b });
  }
  return { size, entries };
}

// Later rounds: adjacent participants (in bracket order) meet. Count must be a power of two.
export function knockoutNextRound(participants) {
  const entries = [];
  for (let i = 0; i + 1 < participants.length; i += 2) entries.push({ type: "match", a: participants[i], b: participants[i + 1] });
  return { size: participants.length, entries };
}

// Swap opponents so two teams from the same group don't meet in the first round, where possible.
export function avoidSameGroup(entries, groupOf) {
  const out = entries.map((e) => ({ ...e }));
  for (let i = 0; i < out.length; i++) {
    const e = out[i];
    if (e.type !== "match" || groupOf(e.a) !== groupOf(e.b)) continue;
    for (let j = 0; j < out.length; j++) {
      const o = out[j];
      if (j === i || o.type !== "match") continue;
      if (groupOf(e.a) !== groupOf(o.b) && groupOf(o.a) !== groupOf(e.b)) {
        const tmp = e.b;
        e.b = o.b;
        o.b = tmp;
        break;
      }
    }
  }
  return out;
}

// ---------- Scheduling ----------
// Spreads fixtures over days: at most `perDay` per day, never the same team twice
// in a day, and `stepDays` between match days (1 = daily, 7 = weekly).
export function scheduleFixtures(fixtures, { startDate, perDay = 1, stepDays = 1 }) {
  const remaining = [...fixtures];
  const out = [];
  let day = startDate;
  while (remaining.length) {
    const used = new Set();
    const today = [];
    for (let i = 0; i < remaining.length && today.length < perDay; ) {
      const f = remaining[i];
      if (!used.has(f.a) && !used.has(f.b)) {
        today.push(f);
        used.add(f.a);
        used.add(f.b);
        remaining.splice(i, 1);
      } else i++;
    }
    today.forEach((f) => out.push({ ...f, date: day }));
    day = addDays(day, stepDays);
  }
  return out;
}

// ---------- Validation ----------
export const FORMAT_TYPES = ["roundrobin", "knockout", "groups"];

export function validateFormat(format, teamIds) {
  if (!format || !FORMAT_TYPES.includes(format.type)) return "Please choose a format.";
  const n = (teamIds || []).length;
  if (n < 2) return "Select at least 2 teams.";
  if (!Number.isInteger(format.overs) || format.overs < 1 || format.overs > 50) return "Overs must be a whole number from 1 to 50.";
  if (!isValidDate(format.startDate)) return "Enter the start date as YYYY-MM-DD.";
  if (!Number.isInteger(format.perDay) || format.perDay < 1 || format.perDay > 6) return "Matches per day must be 1 to 6.";
  if (!Number.isInteger(format.stepDays) || format.stepDays < 1 || format.stepDays > 30) return "Days between match days must be 1 to 30.";
  if (format.type !== "knockout" && ![1, 2].includes(format.legs)) return "Choose single or double round robin.";
  if (format.type === "groups") {
    if (!Number.isInteger(format.groupCount) || format.groupCount < 2) return "Use at least 2 groups.";
    if (n < format.groupCount * 2) return `${format.groupCount} groups need at least ${format.groupCount * 2} teams.`;
    const smallest = Math.floor(n / format.groupCount);
    if (!Number.isInteger(format.advance) || format.advance < 1 || format.advance > smallest) return `Teams advancing per group must be 1 to ${smallest}.`;
    if (format.groupCount * format.advance < 2) return "At least 2 teams must advance to the knockout.";
  }
  return null;
}
