// Who can see what, and who can change what.
//
// * Administrators see and change everything.
// * Everyone else sees only the matches, teams and tournaments they are part
//   of (plus the other teams / players / matches those refer to, so names
//   still show - read-only), and may change only what they created.
//   Two exceptions that mirror the server rules: a match's captains can change
//   that match, and a player can edit their own player entry.
//
// Pure functions - no React, no network.
import { playerMatchesUser } from "../auth/identity";
import { canChangeAnswer } from "../utils/attendance";

const KINDS = ["players", "teams", "matches", "tournaments"];
const sets = () => ({ players: new Set(), teams: new Set(), matches: new Set(), tournaments: new Set() });

export function computeAccess(raw, user) {
  if (!user || user.isAdmin) return { all: true, isAdmin: !!user, me: user ? user.id : null, mine: null, visible: null, captainMatches: new Set(), myPlayerIds: new Set() };

  const me = user.id;
  const owners = raw._owners || {};
  const synced = raw._synced || {};
  // Created by me = the cloud says so, or it is brand new here and not uploaded yet.
  const created = (kind, id) => (owners[kind] && owners[kind][id] === me) || !(synced[kind] && synced[kind][id] !== undefined);

  const players = raw.players || [];
  const teams = raw.teams || [];
  const matches = raw.matches || [];
  const tournaments = raw.tournaments || [];

  const myPlayerIds = new Set(players.filter((p) => playerMatchesUser(p, user)).map((p) => p.id));
  const mine = sets();
  const visible = sets();
  const captainMatches = new Set();

  for (const t of teams) {
    const member = (t.playerIds || []).some((id) => myPlayerIds.has(id));
    const invited = (t.joinRequests || []).some((r) => r.status === "pending" && myPlayerIds.has(r.playerId));
    if (created("teams", t.id) || member || invited || myPlayerIds.has(t.ownerId)) mine.teams.add(t.id);
  }

  for (const m of matches) {
    const cap = myPlayerIds.has(m.captainA) || myPlayerIds.has(m.captainB);
    if (cap) captainMatches.add(m.id);
    // Squads not picked yet (players still marking attendance): the match belongs to everyone in both teams.
    const hasSquads = Array.isArray(m.squadA) && Array.isArray(m.squadB) && (m.squadA.length > 0 || m.squadB.length > 0);
    const inSquad = hasSquads ? [...m.squadA, ...m.squadB].some((id) => myPlayerIds.has(id)) : mine.teams.has(m.teamAId) || mine.teams.has(m.teamBId);
    if (created("matches", m.id) || cap || inSquad) mine.matches.add(m.id);
  }

  for (const t of tournaments) {
    if (created("tournaments", t.id) || (t.teamIds || []).some((id) => mine.teams.has(id)) || (t.matchIds || []).some((id) => mine.matches.has(id))) mine.tournaments.add(t.id);
  }

  // The Players list: the ones this account added, plus their own player entry.
  for (const p of players) if (myPlayerIds.has(p.id) || created("players", p.id)) mine.players.add(p.id);

  // Visible = mine + what mine refers to (read-only context).
  for (const k of KINDS) for (const id of mine[k]) visible[k].add(id);
  // Everyone signed in can look at everything (the server lets them read it all): global search,
  // other tournaments and team pages need it. Viewing is read-only - only `mine` lists and
  // `canEditItem` decide what a person may change.
  for (const p of players) visible.players.add(p.id);
  for (const t of teams) visible.teams.add(t.id);
  for (const m of matches) visible.matches.add(m.id);
  for (const t of tournaments) visible.tournaments.add(t.id);

  return { all: false, isAdmin: false, me, mine, visible, captainMatches, myPlayerIds, created };
}

const pick = (list, set) => (list || []).filter((x) => x && (set.has(x.id) || set.has(String(x.id))));

// What the screens normally see: everything visible to this user.
export function scopeState(raw, access) {
  if (!access || access.all) return raw;
  const out = { ...raw };
  for (const k of KINDS) out[k] = pick(raw[k], access.visible[k]);
  return out;
}

// What the list screens show as "mine".
export function mineLists(raw, access) {
  const out = {};
  for (const k of KINDS) out[k] = !access || access.all ? raw[k] : pick(raw[k], access.mine[k]);
  return out;
}

// What this account created itself (for the Home counts). Same rule as "created" above.
export function createdLists(raw, user) {
  const out = {};
  for (const k of KINDS) out[k] = [];
  if (!user) return out;
  const owners = raw._owners || {};
  const synced = raw._synced || {};
  for (const k of KINDS) {
    out[k] = (raw[k] || []).filter((x) => (owners[k] && owners[k][x.id] === user.id) || !(synced[k] && synced[k][x.id] !== undefined));
  }
  return out;
}

// Lists for the "Other" tabs: everything that is not in `mine`.
export function otherLists(raw, access) {
  const out = {};
  for (const k of KINDS) out[k] = !access || access.all ? [] : (raw[k] || []).filter((x) => !access.mine[k].has(x.id));
  return out;
}

// May this account change this item?
export function canEditItem(raw, access, user, kind, id) {
  if (!access) return false;
  if (access.all) return true;
  if (access.created(kind, id)) return true;
  if (kind === "matches" && access.captainMatches.has(id)) return true;
  if (kind === "players") {
    const p = (raw.players || []).find((x) => x.id === id);
    return !!p && playerMatchesUser(p, user);
  }
  return false;
}

// The invited player of a pending join request may answer it.
export function isInvitee(raw, access, teamId, requestId) {
  if (!access || access.all) return true;
  const t = (raw.teams || []).find((x) => x.id === teamId);
  const r = t && (t.joinRequests || []).find((x) => x.id === requestId);
  return !!r && access.myPlayerIds.has(r.playerId);
}

// Safety net for changes coming from screens. Returns the (possibly corrected)
// action, or null when it must be ignored. Screens already hide the controls a
// player may not use; this stops anything that slips through.
export function guardAction(raw, access, user, action, { fingerprint, canDeleteMatch, playerMatchesUser: matches }) {
  if (!access || access.all) return action;
  const can = (kind, id) => canEditItem(raw, access, user, kind, id);
  const p = action.payload || {};
  switch (action.type) {
    case "ADD_PLAYER_TO_TEAM":
    case "REMOVE_PLAYER_FROM_TEAM":
    case "REQUEST_PLAYER_JOIN":
    case "SET_TEAM_INVITE":
    case "SET_TEAM_LOGO":
    case "UPDATE_TEAM":
      return can("teams", p.teamId) ? action : null;
    case "SET_AVAILABILITY": {
      if (!can("players", p.playerId)) return null;
      // Once a captain has confirmed the XI, a player in it cannot pull out himself; the captain changes the XI.
      const m = (raw.matches || []).find((x) => x.id === p.matchId);
      if (m && !can("matches", m.id) && !canChangeAnswer(m, p.playerId, p.status, false)) return null;
      return action;
    }
    case "RESPOND_JOIN_REQUEST":
      return can("teams", p.teamId) || isInvitee(raw, access, p.teamId, p.requestId) ? action : null;
    case "UPDATE_MATCH":
      return can("matches", p.matchId) ? action : null;
    case "DELETE_MATCH": {
      const m = (raw.matches || []).find((x) => x.id === p.matchId);
      // a captain may delete; so may the person who scheduled it (or an admin) while it has not started
      return m && (canDeleteMatch(m, raw.players, user, matches) || (m.status === "scheduled" && can("matches", p.matchId))) ? action : null;
    }
    case "ATTACH_MATCH_TO_TOURNAMENT":
    case "UPDATE_TOURNAMENT":
    case "UPDATE_SPONSOR":
    case "REMOVE_SPONSOR":
    case "ADD_SPONSOR_TO_TOURNAMENT":
      return can("tournaments", p.tournamentId) ? action : null;
    case "HYDRATE": {
      if (!action.payload) return action;
      const payload = { ...action.payload };
      for (const kind of KINDS) {
        if (!Array.isArray(payload[kind])) continue;
        const cur = raw[kind] || [];
        const curById = new Map(cur.map((x) => [String(x.id), x]));
        const nextIds = new Set();
        const out = [];
        for (const it of payload[kind]) {
          const id = String(it.id);
          nextIds.add(id);
          const old = curById.get(id);
          if (old && it !== old && fingerprint(it) !== fingerprint(old) && !can(kind, id)) out.push(old);
          else out.push(it);
        }
        // Items missing from the list: really removed only if they were visible and are the user's to remove.
        for (const old of cur) {
          const id = String(old.id);
          if (!nextIds.has(id) && (!access.visible[kind].has(id) || !can(kind, id))) out.push(old);
        }
        payload[kind] = out;
      }
      return { ...action, payload };
    }
    default:
      return action;
  }
}
