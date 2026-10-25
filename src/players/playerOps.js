// Player editing and the "fix duplicate contacts" clean-up. Pure functions:
// they take state in and return NEW state, never mutating what they're given.
import { cleanPhone, phoneKey, emailKey, nameKey, playerMatchesUser } from "../auth/identity";
import { ROLES } from "../auth/validators";

const ID_FIELDS = ["batsmanId", "bowlerId", "newBatsmanId", "fielderId"];

// ---------------------------------------------------------------------------
// Where is this player referenced?
// ---------------------------------------------------------------------------
export function playerUsage(playerId, { teams = [], matches = [] }) {
  const teamNames = teams
    .filter((t) => (t.playerIds || []).includes(playerId) || t.ownerId === playerId || (t.joinRequests || []).some((r) => r.playerId === playerId))
    .map((t) => t.name);
  let matchCount = 0;
  for (const m of matches) {
    let hit = false;
    for (const inn of [m.innings1, m.innings2]) {
      if (!inn) continue;
      if (inn.keeperId === playerId || inn.openers?.strikerId === playerId || inn.openers?.nonStrikerId === playerId) hit = true;
      if (Object.values(inn.bowlerChangesPerOver || {}).includes(playerId)) hit = true;
      for (const b of inn.balls || []) {
        if (ID_FIELDS.some((k) => b[k] === playerId)) {
          hit = true;
          break;
        }
      }
    }
    if (hit) matchCount += 1;
  }
  return { used: teamNames.length > 0 || matchCount > 0, teams: teamNames, matches: matchCount };
}

// ---------------------------------------------------------------------------
// Editing one player
// ---------------------------------------------------------------------------
export function validatePlayerEdit({ name, phone, email, role }, players, playerId) {
  const nm = (name || "").trim();
  if (!nm) return { ok: false, error: "Please enter the player's name." };
  if (nm.length > 60) return { ok: false, error: "Name must be 60 characters or fewer." };

  let ph = null;
  if ((phone || "").trim()) {
    ph = cleanPhone(phone);
    if (!ph) return { ok: false, error: "Enter a valid mobile number (8-15 digits), for example +61434916595." };
  }
  let em = null;
  if ((email || "").trim()) {
    em = emailKey(email);
    if (!em) return { ok: false, error: "Enter a valid email address." };
  }
  if (role && ![...ROLES, "Player"].includes(role)) return { ok: false, error: "Please choose a valid playing role." };

  const duplicate =
    players.find((p) => p.id !== playerId && ((ph && phoneKey(p.phone) === phoneKey(ph)) || (em && emailKey(p.email) === em))) || null;
  return { ok: true, values: { name: nm, phone: ph, email: em, role: role || "Player" }, duplicate };
}

export function applyPlayerEdit(players, playerId, values) {
  return players.map((p) => (p.id === playerId ? { ...p, ...values } : p));
}

// ---------------------------------------------------------------------------
// Merging a duplicate player into another (moves team spots + match history)
// ---------------------------------------------------------------------------
function battersIn(inn) {
  const s = new Set();
  if (!inn) return s;
  [inn.openers?.strikerId, inn.openers?.nonStrikerId].forEach((x) => x && s.add(x));
  for (const b of inn.balls || []) {
    if (b.batsmanId) s.add(b.batsmanId);
    if (b.newBatsmanId) s.add(b.newBatsmanId);
  }
  return s;
}

// Merging is unsafe if it would make one person bat twice in an innings, or play for both sides.
export function mergeConflict(fromId, toId, { teams = [], matches = [] }) {
  for (const m of matches) {
    for (const inn of [m.innings1, m.innings2]) {
      const b = battersIn(inn);
      if (b.has(fromId) && b.has(toId)) return true;
    }
    const a = teams.find((t) => t.id === m.teamAId);
    const bt = teams.find((t) => t.id === m.teamBId);
    const inA = (id) => (a?.playerIds || []).includes(id);
    const inB = (id) => (bt?.playerIds || []).includes(id);
    if ((inA(fromId) && inB(toId)) || (inB(fromId) && inA(toId))) return true;
  }
  return false;
}

function mapInnings(inn, from, to) {
  if (!inn) return inn;
  const r = (id) => (id === from ? to : id);
  return {
    ...inn,
    openers: { strikerId: r(inn.openers.strikerId), nonStrikerId: r(inn.openers.nonStrikerId) },
    keeperId: r(inn.keeperId === undefined ? null : inn.keeperId),
    bowlerChangesPerOver: Object.fromEntries(Object.entries(inn.bowlerChangesPerOver || {}).map(([k, v]) => [k, r(v)])),
    balls: (inn.balls || []).map((b) => {
      const o = { ...b };
      ID_FIELDS.forEach((k) => {
        if (k in o) o[k] = r(o[k]);
      });
      return o;
    }),
  };
}

export function mergePlayerInto(state, fromId, toId) {
  const uniq = (arr) => [...new Set(arr)];
  const teams = (state.teams || []).map((t) => ({
    ...t,
    playerIds: uniq((t.playerIds || []).map((id) => (id === fromId ? toId : id))),
    ownerId: t.ownerId === fromId ? toId : t.ownerId,
    joinRequests: (t.joinRequests || []).map((r) => (r.playerId === fromId ? { ...r, playerId: toId } : r)),
  }));
  const matches = (state.matches || []).map((m) => ({ ...m, innings1: mapInnings(m.innings1, fromId, toId), innings2: mapInnings(m.innings2, fromId, toId) }));
  const players = state.players.filter((p) => p.id !== fromId);
  return { players, teams, matches };
}

// ---------------------------------------------------------------------------
// "Fix duplicate contacts": several players share the logged-in account's number
// ---------------------------------------------------------------------------
function slug(name) {
  const s = String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  return s || "player";
}

export function makeDummyEmail(name, taken) {
  const base = slug(name);
  let email = `${base}@example.com`;
  let n = 2;
  while (taken.has(email)) email = `${base}${n++}@example.com`;
  taken.add(email);
  return email;
}

export function planContactCleanup({ players, teams, matches, user, keepId, choices = {} }) {
  const ctx = { teams, matches };
  const holders = players.filter((p) => playerMatchesUser(p, user));
  if (!holders.length) return { holders: [], keepId: null };

  const info = holders.map((p, index) => ({ p, index, usage: playerUsage(p.id, ctx), sameName: nameKey(p.name) === nameKey(user.name) }));
  // default "me": same name as the account and in use first, then in use, then same name, then the first entry
  const score = (x) => (x.sameName ? 2 : 0) + (x.usage.used ? 1 : 0);
  const best = [...info].sort((a, b) => score(b) - score(a) || a.index - b.index)[0];
  const keep = info.find((x) => x.p.id === keepId) || best;

  const taken = new Set(players.map((p) => emailKey(p.email)).filter(Boolean));
  const rows = info.map((x) => {
    const matchedBy = user.type === "phone" ? "phone" : "email";
    const row = {
      id: x.p.id,
      name: x.p.name,
      phone: x.p.phone || null,
      email: x.p.email || null,
      matchedBy,
      usage: x.usage,
      sameName: x.sameName,
      conflict: false,
      dummyEmail: null,
      action: "keep",
      effective: "keep",
    };
    if (x.p.id === keep.p.id) return row;

    const sameNameAsKept = nameKey(x.p.name) === nameKey(keep.p.name);
    row.action = choices[x.p.id] || (sameNameAsKept ? "remove" : "dummy");
    if (row.action === "remove") {
      if (!x.usage.used) row.effective = "delete";
      else if (!mergeConflict(x.p.id, keep.p.id, ctx)) row.effective = "merge";
      else {
        row.conflict = true; // can't merge safely: keep the entry but free up the number
        row.effective = "dummy";
      }
    } else row.effective = "dummy";

    if (row.effective === "dummy") {
      const remainingEmail = matchedBy === "email" ? null : emailKey(x.p.email);
      if (!remainingEmail) row.dummyEmail = makeDummyEmail(x.p.name, taken);
    }
    return row;
  });
  return { holders: rows, keepId: keep.p.id };
}

export function applyContactCleanup(state, plan, user) {
  let working = { players: state.players, teams: state.teams, matches: state.matches };
  const summary = { kept: null, deleted: [], merged: [], dummied: [] };

  for (const row of plan.holders) {
    if (row.effective === "merge") {
      working = { ...working, ...mergePlayerInto(working, row.id, plan.keepId) };
      summary.merged.push(row.name);
    } else if (row.effective === "delete") {
      working = { ...working, players: working.players.filter((p) => p.id !== row.id) };
      summary.deleted.push(row.name);
    } else if (row.effective === "dummy") {
      working = {
        ...working,
        players: working.players.map((p) => {
          if (p.id !== row.id) return p;
          const next = { ...p };
          if (user.type === "phone") next.phone = null;
          else next.email = null;
          if (row.dummyEmail) next.email = row.dummyEmail;
          return next;
        }),
      };
      summary.dummied.push({ name: row.name, email: row.dummyEmail || row.email });
    }
  }
  // the player that stays gets the account's number written exactly
  working = {
    ...working,
    players: working.players.map((p) => {
      if (p.id !== plan.keepId) return p;
      summary.kept = p.name;
      // the kept entry gets the account's number written exactly, plus the login email (so it is fully linked)
      if (user.type === "phone") return { ...p, phone: user.identifier, ...(user.email ? { email: user.email } : {}) };
      return { ...p, email: user.identifier };
    }),
  };
  return { next: working, summary };
}
