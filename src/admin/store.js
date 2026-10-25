import { rest } from "../cloud/api";
import { friendlyError, profileToUser } from "../auth/db";
import { ROLES } from "../auth/validators";

export const FEEDBACK_TYPES = ["Issue", "Suggestion"];
export const STATUSES = ["Open", "In Progress", "Resolved", "Rejected"];

const fail = (error) => ({ ok: false, error });
const NOT_ADMIN = "Administrator access required.";
const NOT_ALLOWED = "Not allowed. Only an administrator can do this.";
const first = (r) => (Array.isArray(r.json) ? r.json[0] : null);
const ms = (iso) => (iso ? Date.parse(iso) : null);
const REP = { Prefer: "return=representation" };

// Server rules (see supabase/schema.sql) are the real protection. The checks
// below only give friendly messages before asking the server.

async function myProfile(userId) {
  const r = await rest(`profiles?select=*&id=eq.${encodeURIComponent(userId)}`);
  return first(r);
}

const mapFeedback = (f) => ({
  id: f.id,
  userId: f.user_id,
  userName: f.user_name,
  userContact: f.user_contact,
  type: f.type,
  detail: f.detail,
  status: f.status,
  reply: f.reply,
  repliedBy: f.replied_by,
  repliedAt: ms(f.replied_at),
  createdAt: ms(f.created_at),
  updatedAt: ms(f.updated_at),
});

// ---------- Player: submit and view own feedback ----------

export async function submitFeedback(userId, { type, detail }) {
  if (!FEEDBACK_TYPES.includes(type)) return fail("Please choose Issue or Suggestion.");
  const text = (detail || "").trim();
  if (text.length < 10) return fail("Please enter at least 10 characters of detail.");
  if (text.length > 1000) return fail("Please keep the detail under 1000 characters.");
  try {
    const me = await myProfile(userId);
    if (!me || me.blocked) return fail("Please log in again.");
    await rest("feedback", {
      method: "POST",
      body: { user_id: userId, user_name: me.name, user_contact: me.phone ? `${me.email} / ${me.phone}` : me.email, type, detail: text },
      headers: { Prefer: "return=minimal" },
    });
    return { ok: true };
  } catch (e) {
    return fail(friendlyError(e));
  }
}

export async function listMyFeedback(userId) {
  try {
    const r = await rest(`feedback?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`);
    return (r.json || []).map(mapFeedback);
  } catch (e) {
    return [];
  }
}

// ---------- Admin: feedback ----------

export async function listAllFeedback(adminId) {
  try {
    const me = await myProfile(adminId);
    if (!me || !me.is_admin || me.blocked) return fail(NOT_ADMIN);
    const r = await rest("feedback?select=*&order=created_at.desc");
    return { ok: true, items: (r.json || []).map(mapFeedback) };
  } catch (e) {
    return fail(friendlyError(e));
  }
}

export async function updateFeedback(adminId, feedbackId, { status, reply }) {
  if (!STATUSES.includes(status)) return fail("Please choose a valid status.");
  const text = (reply || "").trim();
  if (text.length > 1000) return fail("Please keep the reply under 1000 characters.");
  try {
    const me = await myProfile(adminId);
    if (!me || !me.is_admin || me.blocked) return fail(NOT_ADMIN);
    const cur = first(await rest(`feedback?select=*&id=eq.${encodeURIComponent(feedbackId)}`));
    if (!cur) return fail("This item no longer exists.");
    const now = new Date().toISOString();
    const patch = { status, updated_at: now };
    if (text && text !== cur.reply) {
      patch.reply = text;
      patch.replied_by = me.name;
      patch.replied_at = now;
    }
    const r = await rest(`feedback?id=eq.${encodeURIComponent(feedbackId)}`, { method: "PATCH", body: patch, headers: REP });
    if (!first(r)) return fail(NOT_ALLOWED);
    return { ok: true };
  } catch (e) {
    return fail(friendlyError(e));
  }
}

// ---------- Admin: users ----------

export async function listUsers(adminId) {
  try {
    const me = await myProfile(adminId);
    if (!me || !me.is_admin || me.blocked) return fail(NOT_ADMIN);
    const r = await rest("profiles?select=*&order=created_at.desc");
    return { ok: true, users: (r.json || []).map(profileToUser) };
  } catch (e) {
    return fail(friendlyError(e));
  }
}

async function patchProfile(userId, patch) {
  const r = await rest(`profiles?id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: patch, headers: REP });
  return first(r) ? { ok: true } : fail(NOT_ALLOWED);
}

export async function updateUser(adminId, userId, { name, role }) {
  if (!name || !name.trim()) return fail("Name can't be empty.");
  if (!ROLES.includes(role)) return fail("Please choose a valid playing role.");
  try {
    return await patchProfile(userId, { name: name.trim(), role });
  } catch (e) {
    return fail(friendlyError(e));
  }
}

export async function setAdmin(adminId, userId, makeAdmin) {
  try {
    const target = await myProfile(userId);
    if (!target) return fail("User not found.");
    if (makeAdmin) {
      if (target.blocked) return fail("Unblock this player before making them an administrator.");
    } else {
      if (target.is_primary) return fail("The primary administrator can't be removed.");
      if (adminId === userId) return fail("You can't remove your own administrator access.");
    }
    return await patchProfile(userId, { is_admin: !!makeAdmin });
  } catch (e) {
    return fail(friendlyError(e));
  }
}

export async function setBlocked(adminId, userId, blocked) {
  try {
    const target = await myProfile(userId);
    if (!target) return fail("User not found.");
    if (blocked) {
      if (adminId === userId) return fail("You can't block yourself.");
      if (target.is_primary) return fail("The primary administrator can't be blocked.");
    }
    return await patchProfile(userId, { blocked: !!blocked, blocked_at: blocked ? new Date().toISOString() : null });
  } catch (e) {
    return fail(friendlyError(e));
  }
}
