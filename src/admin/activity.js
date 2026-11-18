import { rest } from "../cloud/api";
import { friendlyError } from "../auth/db";

// Short, readable text for each thing a person can do. Anything not listed here is not logged.
const DESCRIBE = {
  ADD_PLAYER: (a) => `Added player ${(a.payload && a.payload.name) || ""}`,
  JOIN_PLAYER_BY_CONTACT: () => "Joined as a player",
  ADD_TEAM: (a) => `Created team ${(a.payload && a.payload.name) || ""}`,
  UPDATE_TEAM: () => "Edited a team",
  SET_TEAM_LOOKING: () => "Changed what the team is looking for",
  ADD_PLAYER_TO_TEAM: () => "Added a player to a team",
  REMOVE_PLAYER_FROM_TEAM: () => "Removed a player from a team",
  SCHEDULE_MATCH: () => "Scheduled a match",
  CLONE_MATCH: () => "Copied a match",
  UPDATE_MATCH: () => "Updated a match",
  DELETE_MATCH: () => "Deleted a match",
  CREATE_TOURNAMENT: (a) => `Created tournament ${(a.payload && a.payload.name) || ""}`,
  UPDATE_TOURNAMENT: () => "Edited a tournament",
};

const recent = new Map(); // stop the same action being logged again within a few seconds
const pending = [];

export function describeAction(action) {
  const f = action && DESCRIBE[action.type];
  return f ? { action: action.type.toLowerCase(), detail: f(action).trim() } : null;
}

// Fire and forget: logging must never slow the app down or show an error.
export function logActivity(user, action, detail) {
  if (!user || !user.id || !action) return;
  const key = `${user.id}|${action}|${detail || ""}`;
  const now = Date.now();
  if (recent.get(key) && now - recent.get(key) < 5000) return;
  recent.set(key, now);
  const row = { user_id: user.id, user_name: user.name || null, phone: user.phone || null, email: user.email || null, action, detail: detail || null };
  Promise.resolve()
    .then(() => rest("activity_log", { method: "POST", body: row, headers: { Prefer: "return=minimal" } }))
    .catch(() => {
      if (pending.length < 50) pending.push(row);
    });
}

// Day start / end in the phone's own time zone, from a "YYYY-MM-DD" text.
export function parseDay(text, endOfDay) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((text || "").trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
}

export function dayText(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Administrator only (the database enforces this too). Returns every entry between the two days plus the number of different people.
export async function searchActivity(fromText, toText) {
  const from = parseDay(fromText, false);
  const to = parseDay(toText, true);
  if (!from || !to) return { ok: false, error: "Enter both dates as YYYY-MM-DD, for example 2026-11-09." };
  if (from > to) return { ok: false, error: "The From date must be on or before the To date." };
  try {
    const rows = [];
    const PAGE = 1000;
    for (let off = 0; off < 20000; off += PAGE) {
      const r = await rest(
        `activity_log?select=*&created_at=gte.${encodeURIComponent(from.toISOString())}&created_at=lte.${encodeURIComponent(to.toISOString())}&order=created_at.desc&limit=${PAGE}&offset=${off}`
      );
      const page = Array.isArray(r.json) ? r.json : [];
      rows.push(...page);
      if (page.length < PAGE) break;
    }
    const items = rows.map((x) => ({ id: x.id, userId: x.user_id, name: x.user_name || "(no name)", phone: x.phone || "", email: x.email || "", action: x.action, detail: x.detail || x.action, at: Date.parse(x.created_at) }));
    const users = new Set(items.map((i) => i.userId));
    const logins = new Set(items.filter((i) => i.action === "login").map((i) => i.userId));
    return { ok: true, items, totalUsers: users.size, loggedInUsers: logins.size };
  } catch (e) {
    return { ok: false, error: /relation|activity_log|404/i.test(String(e && e.message)) ? "The activity log isn't set up yet. Run activity_log.sql in Supabase." : friendlyError(e) };
  }
}

// Every kind of activity falls in one of three groups for the admin's filters and totals.
export const KINDS = [["all", "All"], ["login", "Logins"], ["visit", "App & screen visits"], ["action", "Actions"]];
export const kindOf = (action) => (action === "login" ? "login" : action === "screen_view" || action === "app_visit" ? "visit" : "action");

// One row per person: how much they used the app in the period (engagement).
export function summarizeUsers(items) {
  const m = new Map();
  for (const i of items) {
    let u = m.get(i.userId);
    if (!u) { u = { userId: i.userId, name: i.name, phone: i.phone, email: i.email, events: 0, logins: 0, visits: 0, actions: 0, screens: new Set(), days: new Set(), last: 0 }; m.set(i.userId, u); }
    u.events += 1;
    const k = kindOf(i.action);
    if (k === "login") u.logins += 1; else if (k === "visit") u.visits += 1; else u.actions += 1;
    if (i.action === "screen_view") u.screens.add(i.detail);
    u.days.add(new Date(i.at).toDateString());
    if (i.at > u.last) u.last = i.at;
  }
  return [...m.values()].map((u) => ({ ...u, screens: u.screens.size, activeDays: u.days.size })).sort((a, b) => b.events - a.events);
}

// Which screens / features are used most (from screen visits).
export function topScreens(items, limit = 8) {
  const c = new Map();
  for (const i of items) if (i.action === "screen_view") c.set(i.detail, (c.get(i.detail) || 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

const SCREEN_NAMES = {
  Home: "Home", MatchesList: "Matches", Matches: "Matches", Players: "Players", PlayersList: "Players", Teams: "Teams", TeamsList: "Teams", Tournaments: "Tournaments",
  Profile: "Profile", ProfileHome: "Profile", LiveScoring: "Live scoring", Scorecard: "Scorecard", ScheduleMatch: "Schedule match", Find: "Find", FindTeams: "Find: available teams",
  FindGrounds: "Find: grounds", FindPlayers: "Find: a player", FindTeamToJoin: "Find: a team to join", Marketplace: "Marketplace", MarketplaceBrowse: "Marketplace: browse",
  MarketplaceSell: "Marketplace: sell", ChatList: "Messages", Chat: "Chat", Help: "Help", Theme: "Theme", Notifications: "Notifications", EditProfile: "Edit profile",
  AdminHome: "Admin panel", MyStats: "My stats", TeamDetail: "Team details", TournamentDetail: "Tournament details", Feedback: "Report an issue",
};
export const screenLabel = (name) => SCREEN_NAMES[name] || String(name || "").replace(/([a-z])([A-Z])/g, "$1 $2");

const lastShown = new Map();
// Records that the person opened a screen (once per screen per 30 seconds) - feeds the admin's engagement view.
export function trackScreen(user, routeName) {
  if (!user || !routeName) return;
  const now = Date.now();
  if (lastShown.get(routeName) && now - lastShown.get(routeName) < 30000) return;
  lastShown.set(routeName, now);
  logActivity(user, "screen_view", screenLabel(routeName));
}
let lastVisit = 0;
export function trackAppVisit(user) {
  const now = Date.now();
  if (now - lastVisit < 10 * 60 * 1000) return; // a new visit = back in the app after 10+ minutes
  lastVisit = now;
  logActivity(user, "app_visit", "Opened the app");
}
