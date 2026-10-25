// Round / stage labels for tournament matches added by hand ("Other matches").
export const STAGE_OPTIONS = ["League match", "Quarter Final", "Semi Final", "Final", "3rd place play-off", "Eliminator", "Qualifier"];
export const OTHER = "Other";

// Higher = later in the tournament (used to sort).
const RANK = { "league match": 0, qualifier: 1, eliminator: 1, "quarter final": 2, "semi final": 3, "3rd place play-off": 4, final: 5 };

export const cleanStage = (s) => {
  const t = String(s || "").replace(/\s+/g, " ").trim().slice(0, 30);
  return t && t.toLowerCase() !== "league match" ? t : null; // a plain league match needs no label
};

export const stageRank = (s) => {
  const k = String(s || "").trim().toLowerCase();
  return k in RANK ? RANK[k] : s ? 1.5 : 0;
};

export const isPresetStage = (s) => STAGE_OPTIONS.includes(s);

// Matches on a tournament screen: by date, then by how late the stage is.
export const sortTournamentMatches = (list) =>
  [...list].sort((a, b) => String(a.date).localeCompare(String(b.date)) || stageRank(a.stage) - stageRank(b.stage));

// The label to show on a match. Plain league fixtures need none, so "League" is hidden.
export const stageTag = (match) => {
  const s = match && match.stage ? String(match.stage).trim() : "";
  return s && s.toLowerCase() !== "league" ? s : null;
};
