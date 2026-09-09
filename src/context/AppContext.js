import React, { createContext, useContext, useEffect, useReducer } from "react";
import { loadState, saveState } from "../storage/storage";
import { newId } from "../utils/id";

// This context is an in-memory + on-device (AsyncStorage) data layer,
// intentionally shaped like a small REST API so swapping it for real
// network calls later is mostly a find-and-replace job. See README.md,
// "Connecting a real backend", for auth, SMS/email invites, push
// notifications for join requests, and real-time match sync.

const initialState = {
  hydrated: false,
  players: [],
  teams: [],
  matches: [],
  tournaments: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, hydrated: true };

    case "ADD_PLAYER": {
      const player = { id: newId("player"), role: "Player", ...action.payload };
      return { ...state, players: [...state.players, player] };
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
const AppDispatchContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const saved = await loadState();
      if (saved) dispatch({ type: "HYDRATE", payload: saved });
      else dispatch({ type: "HYDRATE", payload: {} });
    })();
  }, []);

  useEffect(() => {
    if (state.hydrated) saveState(state);
  }, [state]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}

export function useAppDispatch() {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error("useAppDispatch must be used within AppProvider");
  return ctx;
}
