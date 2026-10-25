// Tournament state transitions. Each function takes the current state
// ({ matches, tournaments }) and returns { ok, error } or { ok, next } where
// `next` is a partial state ({ matches, tournaments }) to apply in ONE update,
// so a tournament and its fixtures can never be left half-created.
import { scheduleFixtures, addDays, validateFormat } from "./fixtures";
import { planFirstStage, planNextStage, tournamentProgress } from "./plan";

const fail = (error) => ({ ok: false, error });

// Same shape the SCHEDULE_MATCH reducer produces, plus tournament info.
function makeMatch(draft, tournament, date) {
  return {
    id: draft.id,
    status: "scheduled",
    tossWinnerTeamId: null,
    tossDecision: null,
    battingFirstTeamId: null,
    innings1: null,
    innings2: null,
    currentInnings: 1,
    result: null,
    name: null,
    teamAId: draft.teamAId,
    teamBId: draft.teamBId,
    overs: tournament.format.overs,
    venue: tournament.format.venue || null,
    date,
    tournamentId: tournament.id,
    stage: draft.stage,
    round: draft.round || null,
    groupName: draft.groupName || null,
  };
}

function scheduleDrafts(drafts, tournament, startDate) {
  const f = tournament.format;
  const fixtures = drafts.map((d) => ({ a: d.teamAId, b: d.teamBId, d }));
  return scheduleFixtures(fixtures, { startDate, perDay: f.perDay, stepDays: f.stepDays }).map((x) => makeMatch(x.d, tournament, x.date));
}

const replaceTournament = (state, t) => state.tournaments.map((x) => (x.id === t.id ? t : x));
const generatedIds = (t) => new Set((t.stages || []).flatMap((s) => s.matchIds || []));

// Create the first stage of fixtures from the tournament's format.
export function createFixtures(state, tournamentId, { idGen, rng = Math.random }) {
  const t = state.tournaments.find((x) => x.id === tournamentId);
  if (!t) return fail("Tournament not found.");
  if (!t.format) return fail("Set a format first.");
  if ((t.stages || []).length) return fail("Fixtures have already been generated.");
  const err = validateFormat(t.format, t.teamIds);
  if (err) return fail(err);

  const plan = planFirstStage(t, { idGen, rng });
  const matches = scheduleDrafts(plan.drafts, t, t.format.startDate);
  const updated = { ...t, stages: plan.stages, matchIds: [...t.matchIds, ...matches.map((m) => m.id)] };
  return { ok: true, count: matches.length, next: { matches: [...state.matches, ...matches], tournaments: replaceTournament(state, updated) } };
}

// Generate the next round (knockout) or the knockout stage (after groups).
export function advanceTournament(state, tournamentId, { idGen }) {
  const t = state.tournaments.find((x) => x.id === tournamentId);
  if (!t) return fail("Tournament not found.");
  const plan = planNextStage(t, state.matches, { idGen });
  if (!plan.ok) return plan;

  // next match day = the day after the latest scheduled match of this tournament
  const dates = state.matches.filter((m) => m.tournamentId === t.id && m.date).map((m) => m.date).sort();
  const start = dates.length ? addDays(dates[dates.length - 1], t.format.stepDays) : t.format.startDate;
  const matches = scheduleDrafts(plan.drafts, t, start);
  const updated = { ...t, stages: [...t.stages, ...plan.stages], matchIds: [...t.matchIds, ...matches.map((m) => m.id)] };
  return { ok: true, count: matches.length, next: { matches: [...state.matches, ...matches], tournaments: replaceTournament(state, updated) } };
}

// Can the generated fixtures still be thrown away and rebuilt? Only before any has started.
export function canRegenerate(state, tournamentId) {
  const t = state.tournaments.find((x) => x.id === tournamentId);
  if (!t || !(t.stages || []).length) return false;
  const ids = generatedIds(t);
  return state.matches.filter((m) => ids.has(m.id)).every((m) => m.status === "scheduled");
}

// Set (or change) the format + teams. Rebuilds fixtures if none of them has started.
export function setTournamentFormat(state, tournamentId, format, teamIds, { idGen, rng = Math.random }) {
  const t = state.tournaments.find((x) => x.id === tournamentId);
  if (!t) return fail("Tournament not found.");
  const err = validateFormat(format, teamIds);
  if (err) return fail(err);

  let matches = state.matches;
  let base = t;
  if ((t.stages || []).length) {
    if (!canRegenerate(state, tournamentId)) return fail("Matches have already started, so the format can't be changed.");
    const drop = generatedIds(t);
    matches = matches.filter((m) => !drop.has(m.id));
    base = { ...t, matchIds: t.matchIds.filter((id) => !drop.has(id)), stages: [] };
  }
  const prepared = { ...base, format, teamIds, stages: [] };
  const tmpState = { matches, tournaments: state.tournaments.map((x) => (x.id === t.id ? prepared : x)) };
  return createFixtures(tmpState, tournamentId, { idGen, rng });
}

// Settle a tied knockout match (e.g. after a super over).
export function setMatchWinner(state, matchId, teamId) {
  const m = state.matches.find((x) => x.id === matchId);
  if (!m) return fail("Match not found.");
  if (m.status !== "completed") return fail("The match isn't finished yet.");
  if (teamId !== m.teamAId && teamId !== m.teamBId) return fail("Pick one of the two teams.");
  return { ok: true, next: { matches: state.matches.map((x) => (x.id === matchId ? { ...x, winnerOverride: teamId } : x)) } };
}

export { tournamentProgress };
