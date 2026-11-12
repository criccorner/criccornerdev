// Dates are kept as "YYYY-MM-DD" and times as 24-hour "HH:MM" (both optional for the time).
const p2 = (n) => String(n).padStart(2, "0");

export function isoDay(d) {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export function todayIso() {
  return isoDay(new Date());
}

export function isValidDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
  if (!m) return false;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3];
}

// "7:30 pm", "7.30PM", "19:30", "1930", "7pm" -> "19:30". Empty -> "" (no time). Anything else -> null.
export function parseTime(text) {
  const t = String(text || "").trim().toLowerCase().replace(/\./g, ":").replace(/\s+/g, "");
  if (!t) return "";
  const m = /^(\d{1,2})(?::?(\d{2}))?(am|pm|a|p)?$/.exec(t);
  if (!m) return null;
  let h = +m[1];
  const min = m[2] === undefined ? 0 : +m[2];
  const ap = m[3] ? m[3][0] : null;
  if (min > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    if (ap === "p" && h < 12) h += 12;
    if (ap === "a" && h === 12) h = 0;
  } else if (h > 23) return null;
  return `${p2(h)}:${p2(min)}`;
}

// "19:30" -> "7:30 PM"
export function formatTime(hhmm) {
  const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || ""));
  if (!m) return "";
  const h = +m[1];
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

// Weeks of a month for a calendar grid: rows of 7 cells, each null or a day number (weeks start on Monday).
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

// "Wed Nov 11 2026 · 7:30 PM"
export function matchWhen(m) {
  if (!m) return "";
  const d = m.date ? new Date(m.date) : null;
  const day = d && !isNaN(d.getTime()) ? d.toDateString() : "";
  const t = formatTime(m.time);
  return [day, t].filter(Boolean).join(" · ");
}

// A match between the same two teams (either way round) on the same date and time that has not finished is a duplicate.
export function findDuplicateMatch(matches, { teamAId, teamBId, date, time, ignoreId }) {
  return (
    (matches || []).find(
      (m) =>
        m.id !== ignoreId &&
        m.status !== "completed" &&
        String(m.date || "").slice(0, 10) === date &&
        (m.time || "") === (time || "") &&
        ((m.teamAId === teamAId && m.teamBId === teamBId) || (m.teamAId === teamBId && m.teamBId === teamAId))
    ) || null
  );
}
