// Linking a logged-in account to a player entry by mobile number / email.
// Comparison ignores spaces, dashes and brackets, and treats Australian local
// format (0434 916 595) as the same number as +61 434 916 595.

export function cleanPhone(raw) {
  if (raw === null || raw === undefined) return null;
  const p = String(raw).replace(/[\s\-().]/g, "");
  return /^\+?\d{8,15}$/.test(p) ? p : null;
}

// A canonical key: two numbers are "the same" when their keys are equal.
export function phoneKey(raw) {
  const p = cleanPhone(raw);
  if (!p) return null;
  let d = p.replace(/^\+/, "");
  if (d.startsWith("0061")) d = d.slice(2); // 0061 434... -> 61434...
  else if (/^0\d{9}$/.test(d)) d = "61" + d.slice(1); // AU local format
  return d;
}

export function emailKey(raw) {
  if (raw === null || raw === undefined) return null;
  const e = String(raw).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

export const nameKey = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// A player entry belongs to an account when its mobile number OR email matches.
// (Accounts log in with email and may also have a mobile number on their profile.)
export function playerMatchesUser(player, user) {
  if (!player || !user) return false;
  const phones = [];
  const emails = [];
  if (user.type === "phone") phones.push(user.identifier);
  else if (user.identifier) emails.push(user.identifier);
  if (user.phone) phones.push(user.phone);
  if (user.email) emails.push(user.email);
  const pp = phoneKey(player.phone);
  const pe = emailKey(player.email);
  return (!!pp && phones.some((x) => phoneKey(x) === pp)) || (!!pe && emails.some((x) => emailKey(x) === pe));
}

// The single contact the "Fix duplicate contacts" tool works on: the account's
// mobile number if it has one, otherwise its email.
export function contactOf(user) {
  if (!user) return null;
  const base = { id: user.id, name: user.name };
  if (user.phone) return { ...base, type: "phone", identifier: user.phone, email: user.email || null };
  return { ...base, type: "email", identifier: user.email || user.identifier };
}

// If several players match (duplicates), prefer one that is actually in use.
export function findMyPlayer(players, user, isUsed) {
  const mine = (players || []).filter((p) => playerMatchesUser(p, user));
  if (mine.length <= 1 || !isUsed) return mine[0] || null;
  return mine.find((p) => isUsed(p.id)) || mine[0];
}
