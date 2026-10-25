export const ROLES = ["Batter", "Bowler", "All-rounder", "Wicketkeeper Batsman"];

// Returns { type: "email" | "phone", value } (normalised) or null if invalid.
// (Kept for older code; sign-in now uses email only, see parseEmail.)
export function parseIdentifier(raw) {
  const v = (raw || "").trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { type: "email", value: v.toLowerCase() };
  const p = v.replace(/[\s\-()]/g, "");
  if (/^\+?\d{8,15}$/.test(p)) return { type: "phone", value: p };
  return null;
}

// Email address -> lower-case text, or null if it isn't a valid email.
export function parseEmail(raw) {
  const v = (raw || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? v : null;
}

// Optional mobile number: returns "" if empty, a cleaned number, or null if invalid.
export function parsePhoneOptional(raw) {
  const v = (raw || "").trim();
  if (!v) return "";
  const p = v.replace(/[\s\-().]/g, "");
  return /^\+?\d{8,15}$/.test(p) ? p : null;
}

export function validatePassword(pw) {
  if (!pw || pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password needs letters and at least one number.";
  return null;
}
