// Hide most of a contact so a player can be recognised without being exposed.
export function maskPhone(phone) {
  const p = String(phone || "").replace(/[\s\-().]/g, "");
  if (p.length < 6) return p ? "••••" : "";
  return p.slice(0, 3) + "•".repeat(Math.max(2, p.length - 6)) + p.slice(-3);
}
export function maskEmail(email) {
  const e = String(email || "");
  const at = e.indexOf("@");
  if (at < 1) return e ? "••••" : "";
  return e.slice(0, 1) + "•••" + e.slice(at);
}
// What to show under a player's name: the real contact for the owner / admin /
// the player themselves, otherwise a masked one.
export function contactLine(player, revealed) {
  if (!player) return "";
  if (revealed) return player.phone || player.email || "";
  if (player.phone) return maskPhone(player.phone);
  if (player.email) return maskEmail(player.email);
  return "";
}
