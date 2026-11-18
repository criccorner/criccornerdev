// Cricket Marketplace listings - the `marketplace_listings` table (see supabase/marketplace.sql).
import { rest } from "../cloud/api";

export const CATEGORIES = ["Cricket Uniforms Store", "Cricket Gears Store", "Physio", "Fitness and Gym", "Clubs to Join", "Cricket Coaching", "Umpire", "Other"];
export const CATEGORY_ICON = { "Cricket Uniforms Store": "👕", "Cricket Gears Store": "🏏", Physio: "🩺", "Fitness and Gym": "💪", "Clubs to Join": "🤝", "Cricket Coaching": "🎓", Umpire: "🧑‍⚖️", Other: "🛍️" };

const COLS = "id,owner,owner_name,title,description,category,image_url,contact,address,city,status,reject_reason,reviewed_at,expires_at,created_at";
export const fromRow = (r) => ({
  id: r.id, owner: r.owner, ownerName: r.owner_name || "", title: r.title, description: r.description || "", category: r.category,
  imageUrl: r.image_url, contact: r.contact, address: r.address, city: r.city, status: r.status, rejectReason: r.reject_reason || "",
  reviewedAt: r.reviewed_at, expiresAt: r.expires_at || null, createdAt: r.created_at,
});
const toRow = (l, owner) => ({
  owner_name: l.ownerName || null, title: String(l.title || "").trim(), description: String(l.description || "").trim() || null,
  category: l.category, image_url: l.imageUrl, contact: String(l.contact || "").trim(), address: String(l.address || "").trim(), city: String(l.city || "").trim(),
  ...(owner ? { owner } : {}),
});
const list = async (query) => {
  const r = await rest(`marketplace_listings?select=${COLS}&${query}`);
  return (Array.isArray(r && r.json) ? r.json : []).map(fromRow);
};

// An approved listing is live until its expiry date; after that it is hidden and goes back to the admin's approval list.
export const isExpired = (l, now = Date.now()) => !!(l && l.status === "approved" && l.expiresAt && Date.parse(l.expiresAt) <= now);
export const isLive = (l, now = Date.now()) => !!(l && l.status === "approved" && !isExpired(l, now));
const nowIso = () => encodeURIComponent(new Date().toISOString());

export const fetchApproved = async () => (await list(`status=eq.approved&or=(expires_at.is.null,expires_at.gt.${nowIso()})&order=created_at.desc`)).filter((l) => isLive(l));
// Admin lists. "pending" also holds the approved listings whose expiry date has passed (they need to be approved again).
export async function fetchByStatus(status) {
  if (status === "pending") {
    return list(`or=(status.eq.pending,and(status.eq.approved,expires_at.lt.${nowIso()}))&order=created_at.asc`).then((r) => r.filter((l) => l.status === "pending" || isExpired(l)));
  }
  if (status === "approved") return (await list(`status=eq.approved&order=expires_at.asc.nullsfirst`)).filter((l) => isLive(l));
  return list(`status=eq.${encodeURIComponent(status)}&order=created_at.asc`);
}
export async function fetchMine(userId) {
  const rows = await list(`owner=eq.${encodeURIComponent(userId)}&limit=1`);
  return rows[0] || null;
}

// Checks what was typed. Returns an error message, or "" when it is fine.
export function validateListing(l) {
  if (!String(l.title || "").trim()) return "Please enter the name of your product or service.";
  if (!CATEGORIES.includes(l.category)) return "Please choose a category.";
  if (!l.imageUrl) return "Please add a picture.";
  const digits = String(l.contact || "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "Please enter a valid contact number.";
  if (!String(l.address || "").trim()) return "Please enter the address.";
  if (!String(l.city || "").trim()) return "Please enter the city.";
  return "";
}

// One listing per person: a new one is created only if they have none; otherwise their listing is updated (and goes back for approval).
export async function saveListing(l, userId, existingId) {
  const err = validateListing(l);
  if (err) throw new Error(err);
  if (existingId) await rest(`marketplace_listings?id=eq.${encodeURIComponent(existingId)}`, { method: "PATCH", body: toRow(l), headers: { Prefer: "return=minimal" } });
  else await rest("marketplace_listings", { method: "POST", body: toRow(l, userId), headers: { Prefer: "return=minimal" } });
  return fetchMine(userId);
}
export async function deleteListing(id) {
  await rest(`marketplace_listings?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}
// Approving needs an expiry date (end of that day, a future day). Pass expiresAt as "YYYY-MM-DD".
export function expiryFromDay(text, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || "").trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 0);
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3] || d.getTime() <= now.getTime()) return null;
  return d;
}
export async function reviewListing(id, status, reason, expiresAt) {
  if (status === "approved" && !(expiresAt instanceof Date)) throw new Error("Please choose an expiry date in the future.");
  await rest(`marketplace_listings?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status, reject_reason: status === "rejected" ? String(reason || "").trim() || null : null, expires_at: status === "approved" ? expiresAt.toISOString() : null },
    headers: { Prefer: "return=minimal" },
  });
}

// [{ category, items }] in the fixed category order; empty categories are left out.
export function groupByCategory(listings) {
  return CATEGORIES.map((category) => ({ category, items: (listings || []).filter((l) => l.category === category) })).filter((g) => g.items.length);
}
