import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { newId } from "../utils/id";
import { overlap } from "../utils/squads";
import { useAuth } from "../auth/AuthContext";
import { rest } from "../cloud/api";
import { createEngine, syncOnce, diffState, hasChanges, applyRemote, markSynced, addMissing, emptySynced, emptyOwners, fingerprint } from "../cloud/sync";
import { computeAccess, scopeState, mineLists, canEditItem, guardAction } from "../access/scope";
import { canDeleteMatch, captainSides } from "../utils/squads";
import { playerMatchesUser } from "../auth/identity";
import { saveCache, loadCache } from "../cloud/cacheStore";

// ---------------------------------------------------------------------------
// App data layer. Players, teams, matches and tournaments are SHARED through
// the cloud database (Supabase): every logged-in player sees the same data.
//
//  * Screens still read it with useAppState() and change it with
//    dispatch({type: ...}) exactly as before - nothing else in the app changed.
//  * Changes are saved on the phone straight away (so the app works offline),
//    uploaded to the cloud a moment later, and other phones pick them up
//    within a few seconds (live scores refresh about every 5 seconds).
// ---------------------------------------------------------------------------

const POLL_MS = 5000;
const ACCOUNT_CHECK_MS = 60000;
const FLUSH_DELAY_MS = 500;
const CACHE_DELAY_MS = 1500;

const initialState = {
  hydrated: false,
  players: [],       // { id, name, phone, email, role }
  teams: [],         // { id, name, ownerId, playerIds: [], joinRequests: [{ id, playerId, status }] }
  matches: [],       // { id, name, teamAId, teamBId, overs, date, venue, tournamentId, status, ..., innings1, innings2, currentInnings }
  tournaments: [],   // { id, name, startDate, endDate, sponsors: [{id,name}], matchIds: [] }
  _synced: emptySynced(), // fingerprints of what the cloud has (internal)
  _since: null,           // newest cloud change we have seen (internal)
  _owners: emptyOwners(), // who created each item (internal)
};

export function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, hydrated: true };

    // ---- cloud sync actions (see src/cloud/sync.js) ----
    case "REMOTE_ROWS":
      return { ...applyRemote(state, action.rows, { force: !!action.force }), hydrated: true };

    case "MARK_SYNCED":
      return markSynced(state, action.pushed, action.deleted, action.me);

    case "IMPORT_DOCS":
      return addMissing(state, action.payload).state;

    case "ADD_PLAYER": {
      const player = { id: newId("player"), role: "Player", ...action.payload };
      return { ...state, players: [...state.players, player] };
    }

    case "SET_AVAILABILITY": {
      // A player's answer for one match, kept on his own player entry.
      const { playerId, matchId, status } = action.payload;
      if (!state.players.some((p) => p.id === playerId)) return state;
      return {
        ...state,
        players: state.players.map((p) => {
          if (p.id !== playerId) return p;
          const cur = { ...(p.availability || {}) };
          if (!status) delete cur[matchId];
          else cur[matchId] = { status, at: new Date().toISOString() };
          const { availability, ...rest } = p;
          return Object.keys(cur).length ? { ...rest, availability: cur } : rest;
        }),
      };
    }

    case "JOIN_PLAYER_BY_CONTACT": {
      const { name, phone, email } = action.payload;
      const existing = state.players.find(
        (p) => (phone && p.phone === phone) || (email && p.email === email)
      );
      if (existing) return state;
      const player = { id: newId("player"), name, phone: phone || null, email: email || null, role: "Player" };
      return { ...state, players: [...state.players, player] };
    }

    case "ADD_TEAM": {
      const team = { id: newId("team"), playerIds: [], joinRequests: [], ...action.payload };
      return { ...state, teams: [...state.teams, team] };
    }

    case "SET_TEAM_INVITE": {
      // The secret code in the team's invite link. A new code makes old links stop working.
      const { teamId, code } = action.payload;
      if (!state.teams.some((t) => t.id === teamId)) return state;
      return { ...state, teams: state.teams.map((t) => (t.id === teamId ? { ...t, inviteCode: code } : t)) };
    }

    case "SET_TEAM_LOGO": {
      const { teamId, logoUrl } = action.payload;
      if (!state.teams.some((t) => t.id === teamId)) return state;
      return { ...state, teams: state.teams.map((t) => (t.id === teamId ? { ...t, logoUrl: logoUrl || null } : t)) };
    }

    case "REMOVE_PLAYER_FROM_TEAM": {
      // Takes the player out of the team. Matches that have not started lose
      // them from the squad too (and their captain / keeper role). Live and
      // finished matches keep their saved squads untouched.
      const { teamId, playerId } = action.payload;
      const team = state.teams.find((t) => t.id === teamId);
      if (!team || !team.playerIds.includes(playerId) || team.ownerId === playerId) return state;
      const strip = (m) => {
        if (m.status !== "scheduled") return m;
        let next = m;
        const side = (teamKey, sq, cap, kp) => {
          if (m[teamKey] !== teamId || !Array.isArray(m[sq]) || !m[sq].includes(playerId)) return;
          next = { ...next, [sq]: m[sq].filter((id) => id !== playerId) };
          if (m[cap] === playerId) next[cap] = null;
          if (m[kp] === playerId) next[kp] = null;
        };
        side("teamAId", "squadA", "captainA", "keeperA");
        side("teamBId", "squadB", "captainB", "keeperB");
        return next;
      };
      return {
        ...state,
        teams: state.teams.map((t) => (t.id === teamId ? { ...t, playerIds: t.playerIds.filter((id) => id !== playerId) } : t)),
        matches: state.matches.map(strip),
      };
    }

    case "ADD_PLAYER_TO_TEAM": {
      const { teamId, playerId } = action.payload;
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === teamId && !t.playerIds.includes(playerId)
            ? { ...t, playerIds: [...t.playerIds, playerId] }
            : t
        ),
      };
    }

    case "REQUEST_PLAYER_JOIN": {
      const { teamId, playerId } = action.payload;
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === teamId
            ? { ...t, joinRequests: [...t.joinRequests, { id: newId("req"), playerId, status: "pending" }] }
            : t
        ),
      };
    }

    case "RESPOND_JOIN_REQUEST": {
      const { teamId, requestId, accept } = action.payload;
      return {
        ...state,
        teams: state.teams.map((t) => {
          if (t.id !== teamId) return t;
          const request = t.joinRequests.find((r) => r.id === requestId);
          if (!request) return t;
          const updatedRequests = t.joinRequests.map((r) =>
            r.id === requestId ? { ...r, status: accept ? "accepted" : "declined" } : r
          );
          const playerIds =
            accept && !t.playerIds.includes(request.playerId)
              ? [...t.playerIds, request.playerId]
              : t.playerIds;
          return { ...t, joinRequests: updatedRequests, playerIds };
        }),
      };
    }

    case "SCHEDULE_MATCH": {
      // safety net: a player can never be in both squads
      if (overlap(action.payload.squadA, action.payload.squadB).length) return state;
      const match = {
        id: newId("match"),
        status: "scheduled",
        tossWinnerTeamId: null,
        tossDecision: null,
        battingFirstTeamId: null,
        innings1: null,
        innings2: null,
        currentInnings: 1,
        result: null,
        ...action.payload,
      };
      return { ...state, matches: [...state.matches, match] };
    }

    case "UPDATE_MATCH": {
      const { matchId, changes } = action.payload;
      return {
        ...state,
        matches: state.matches.map((m) => (m.id === matchId ? { ...m, ...changes } : m)),
      };
    }

    case "DELETE_MATCH": {
      // Removes the match (and with it every ball, score and stat that came
      // from it) and takes it out of any tournament. Other phones are told
      // through the normal sync.
      const { matchId } = action.payload;
      if (!state.matches.some((m) => m.id === matchId)) return state;
      return {
        ...state,
        matches: state.matches.filter((m) => m.id !== matchId),
        tournaments: state.tournaments.map((t) =>
          t.matchIds && t.matchIds.includes(matchId) ? { ...t, matchIds: t.matchIds.filter((id) => id !== matchId) } : t
        ),
      };
    }

    case "CREATE_TOURNAMENT": {
      const tournament = { id: newId("tourn"), sponsors: [], matchIds: [], ...action.payload };
      return { ...state, tournaments: [...state.tournaments, tournament] };
    }

    case "ADD_SPONSOR_TO_TOURNAMENT": {
      const { tournamentId, sponsor } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map((t) =>
          t.id === tournamentId
            ? { ...t, sponsors: [...t.sponsors, { id: newId("sponsor"), ...sponsor }] }
            : t
        ),
      };
    }

    case "ATTACH_MATCH_TO_TOURNAMENT": {
      const { tournamentId, matchId } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map((t) =>
          t.id === tournamentId && !t.matchIds.includes(matchId)
            ? { ...t, matchIds: [...t.matchIds, matchId] }
            : t
        ),
      };
    }

    default:
      return state;
  }
}


const AppStateContext = createContext(null);
const AllStateContext = createContext(null);
const AccessContext = createContext(null);
const AppDispatchContext = createContext(null);
const SyncContext = createContext(null);

export function AppProvider({ children }) {
  const { user, refreshUser } = useAuth();
  const uid = user ? user.id : null;

  // The newest state lives in a ref so background sync always sees the latest
  // data (a plain React state can be a render behind).
  const stateRef = useRef(initialState);
  const [state, setState] = useState(initialState);
  const [sync, setSync] = useState({ status: "starting", ready: false, lastSync: null, error: null, notice: null, pending: 0 });

  const alive = useRef(true);
  const busy = useRef(false);
  const queued = useRef(false);
  const hadCache = useRef(false);
  const engine = useMemo(() => createEngine({ rest }), []);

  const patchSync = useCallback((p) => {
    if (alive.current) setSync((s) => ({ ...s, ...p }));
  }, []);

  // Internal: used by sync and by loading the saved copy. Not restricted.
  const dispatch = useCallback((action) => {
    const next = reducer(stateRef.current, action);
    stateRef.current = next;
    setState(next);
  }, []);

  // Who this account is and what it may see / change (see src/access/scope.js).
  const userRef = useRef(user);
  userRef.current = user;
  const userKey = user ? [user.id, user.isAdmin, user.phone, user.email, user.identifier].join("|") : "";
  const access = useMemo(
    () => computeAccess(state, userRef.current),
    [state.players, state.teams, state.matches, state.tournaments, state._owners, state._synced, userKey]
  );
  const accessRef = useRef(access);
  accessRef.current = access;

  // Used by the screens. Changes the account may not make are ignored.
  const dispatchPublic = useCallback(
    (action) => {
      const checked = guardAction(stateRef.current, accessRef.current, userRef.current, action, { fingerprint, canDeleteMatch, playerMatchesUser });
      if (!checked) {
        patchSync({ notice: "You can only change what you created. Ask its owner or an admin." });
        return;
      }
      dispatch(checked);
    },
    [dispatch, patchSync]
  );

  // One upload+download pass at a time (never overlapping, so a slow download
  // can't bring back something you just deleted).
  const cycle = useCallback(async () => {
    if (busy.current) {
      queued.current = true;
      return;
    }
    busy.current = true;
    try {
      do {
        queued.current = false;
        if (hasChanges(diffState(stateRef.current))) patchSync({ status: "syncing" });
        const { rejected } = await syncOnce({ engine, getState: () => stateRef.current, apply: (a) => dispatch(a.type === "MARK_SYNCED" ? { ...a, me: uid } : a) });
        if (rejected.length) patchSync({ notice: "Some changes were not saved because only the owner (or an admin) can change that item." });
        patchSync({ status: "online", ready: true, lastSync: Date.now(), error: null });
      } while (queued.current);
    } catch (e) {
      if (e && e.status === 401) {
        patchSync({ status: "error", error: "Please log in again." });
        refreshUser();
      } else if (e && e.status === 403) {
        patchSync({ status: "error", error: "Access denied." });
        refreshUser(); // blocked players are signed out here
      } else if (e && e.offline) {
        patchSync({
          status: "offline",
          error: "No internet. Changes are saved on this phone and will upload when you're back online.",
          ...(hadCache.current ? { ready: true } : {}),
        });
      } else {
        patchSync({ status: "error", error: (e && e.message) || "Sync failed." });
      }
    } finally {
      busy.current = false;
    }
  }, [engine, dispatch, patchSync, refreshUser, uid]);

  // Start: show the saved copy immediately, then sync with the cloud.
  useEffect(() => {
    alive.current = true;
    (async () => {
      const cached = uid ? await loadCache(uid) : null;
      if (!alive.current) return;
      if (cached) {
        hadCache.current = true;
        dispatch({ type: "HYDRATE", payload: cached });
        patchSync({ ready: true });
      } else {
        dispatch({ type: "HYDRATE", payload: {} });
      }
      cycle();
    })();
    return () => {
      alive.current = false;
    };
  }, [uid]);

  // Upload soon after anything changes.
  useEffect(() => {
    if (!state.hydrated) return;
    const t = setTimeout(cycle, FLUSH_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.players, state.teams, state.matches, state.tournaments]);

  // Keep a copy on the phone for offline use.
  useEffect(() => {
    if (!state.hydrated || !uid) return;
    const t = setTimeout(() => saveCache(uid, stateRef.current), CACHE_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.players, state.teams, state.matches, state.tournaments, state._synced]);

  // Count of changes waiting to upload (for the status bar).
  useEffect(() => {
    if (!state.hydrated) return;
    const d = diffState(stateRef.current);
    patchSync({ pending: d.upserts.length + d.deletes.length });
  }, [state.players, state.teams, state.matches, state.tournaments, state._synced]);

  // Pick up other people's changes (live scores) while the app is open.
  useEffect(() => {
    let timer = null;
    let accountTimer = null;
    const start = () => {
      if (!timer) timer = setInterval(cycle, POLL_MS);
      // quietly re-check the account (e.g. an admin blocked this player)
      if (!accountTimer) accountTimer = setInterval(refreshUser, ACCOUNT_CHECK_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      if (accountTimer) clearInterval(accountTimer);
      timer = null;
      accountTimer = null;
    };
    if (AppState.currentState === "active") start();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        cycle();
        start();
      } else stop();
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [cycle, refreshUser]);

  const syncValue = useMemo(() => ({ ...sync, syncNow: cycle, dismissNotice: () => patchSync({ notice: null }) }), [sync, cycle, patchSync]);

  const scoped = useMemo(() => scopeState(state, access), [state, access]);
  const accessValue = useMemo(
    () => ({
      isAdmin: access.all,
      mine: mineLists(state, access),
      canEdit: (kind, id) => canEditItem(state, access, userRef.current, kind, id),
      canDeleteMatch: (match) => canDeleteMatch(match, state.players, userRef.current, playerMatchesUser),
      // Captains correct their own side; the person who created (and scores) the match may correct both; admins too.
      correctionSides: (match) => {
        const sides = captainSides(match, state.players, userRef.current, playerMatchesUser);
        if (sides.length < 2 && match && access && access.created && access.created("matches", match.id)) return ["A", "B"];
        return sides;
      },
    }),
    [state, access]
  );

  return (
    <AllStateContext.Provider value={state}>
      <AppStateContext.Provider value={scoped}>
        <AccessContext.Provider value={accessValue}>
          <AppDispatchContext.Provider value={dispatchPublic}>
            <SyncContext.Provider value={syncValue}>{children}</SyncContext.Provider>
          </AppDispatchContext.Provider>
        </AccessContext.Provider>
      </AppStateContext.Provider>
    </AllStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}

// Everything, unfiltered. Only for code that must see all players (searching,
// duplicate checks, importing). Never use it to LIST things for a player.
export function useAllState() {
  const ctx = useContext(AllStateContext);
  if (!ctx) throw new Error("useAllState must be used within AppProvider");
  return ctx;
}

// { isAdmin, mine: {players,teams,matches,tournaments}, canEdit(kind,id), canDeleteMatch(match) }
export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AppProvider");
  return ctx;
}

export function useAppDispatch() {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error("useAppDispatch must be used within AppProvider");
  return ctx;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within AppProvider");
  return ctx;
}
