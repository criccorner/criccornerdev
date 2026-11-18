// Player-to-player chat (see supabase/v32_chat.sql). Messages are only ever visible to the two people in them.
import { rest } from "../cloud/api";

const enc = encodeURIComponent;
const rowOf = (r) => ({ id: r.id, from: r.sender, to: r.recipient, body: r.body, readAt: r.read_at, at: Date.parse(r.created_at) });

// The account to message for a player or a team (its owner). Resolves to a user id, or null if they can't be messaged.
export async function resolveTarget(kind, id) {
  const r = await rest("rpc/chat_target", { method: "POST", body: { p_kind: kind, p_id: String(id) } });
  return typeof r.json === "string" && r.json ? r.json : null;
}

export async function people(ids) {
  const list = [...new Set(ids)].filter(Boolean);
  if (!list.length) return {};
  const r = await rest("rpc/chat_people", { method: "POST", body: { ids: list } });
  const out = {};
  for (const p of Array.isArray(r.json) ? r.json : []) out[p.id] = { name: p.name || "Player", photoUrl: p.photo_url || null };
  return out;
}

export async function fetchMine(me) {
  const r = await rest(`chat_messages?select=*&or=(sender.eq.${enc(me)},recipient.eq.${enc(me)})&order=created_at.desc&limit=400`);
  return (Array.isArray(r.json) ? r.json : []).map(rowOf);
}

export async function fetchThread(me, other) {
  const r = await rest(`chat_messages?select=*&or=(and(sender.eq.${enc(me)},recipient.eq.${enc(other)}),and(sender.eq.${enc(other)},recipient.eq.${enc(me)}))&order=created_at.asc&limit=300`);
  return (Array.isArray(r.json) ? r.json : []).map(rowOf);
}

export async function sendMessage(to, body) {
  const text = String(body || "").trim();
  if (!text) throw new Error("Type a message first.");
  if (text.length > 1000) throw new Error("Messages can be up to 1000 characters.");
  await rest("chat_messages", { method: "POST", body: { recipient: to, body: text }, headers: { Prefer: "return=minimal" } });
}

export async function markRead(me, other) {
  await rest(`chat_messages?recipient=eq.${enc(me)}&sender=eq.${enc(other)}&read_at=is.null`, { method: "PATCH", body: { read_at: new Date().toISOString() }, headers: { Prefer: "return=minimal" } });
}

// [{ otherId, last, unread }] newest conversation first.
export function conversations(messages, me) {
  const m = new Map();
  for (const x of messages) {
    const other = x.from === me ? x.to : x.from;
    let c = m.get(other);
    if (!c) { c = { otherId: other, last: x, unread: 0 }; m.set(other, c); }
    if (x.at > c.last.at) c.last = x;
    if (x.to === me && !x.readAt) c.unread += 1;
  }
  return [...m.values()].sort((a, b) => b.last.at - a.last.at);
}
export const unreadTotal = (messages, me) => messages.filter((x) => x.to === me && !x.readAt).length;
