// ---------------------------------------------------------------------------
// Sync engine: keeps the phone's copy of players / teams / matches /
// tournaments in step with the shared cloud table ("docs").
//
// Rules:
//  * Every item is a JSON document with an "id". Each phone remembers a short
//    fingerprint of what it last synced (state._synced).
//  * An item whose fingerprint differs from _synced is "dirty" = changed on
//    this phone and not yet uploaded.
//  * Downloading never overwrites a dirty item (your unsaved edit wins, then
//    uploads); everything else is replaced by the cloud version.
//  * Deleting is a soft delete so every other phone learns about it.
// All the pure functions below are unit-tested without a network.
// ---------------------------------------------------------------------------

export const KINDS = ["players", "teams", "matches", "tournaments"];
export const emptySynced = () => ({ players: {}, teams: {}, matches: {}, tournaments: {} });
// Who created each item (the cloud row's owner): { players: {id: userId}, ... }.
// Kept beside the items (not inside them) so it is never uploaded.
export const emptyOwners = () => ({ players: {}, teams: {}, matches: {}, tournaments: {} });

// JSON with sorted keys, so the same data always gives the same text
// (the database may return keys in a different order).
export function stable(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}";
}

// 53-bit string hash (cyrb53) - tiny fingerprint instead of storing a full copy.
function hash53(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export function fingerprint(item) {
  const s = stable(item);
  return hash53(s) + "." + s.length;
}

const cloneSynced = (s) => {
  const out = emptySynced();
  for (const k of KINDS) out[k] = { ...((s && s[k]) || {}) };
  return out;
};
const cloneOwners = (s) => {
  const out = emptyOwners();
  for (const k of KINDS) out[k] = { ...((s && s[k]) || {}) };
  return out;
};

// What needs uploading: items that changed here, and items removed here.
export function diffState(state) {
  const synced = state._synced || emptySynced();
  const upserts = [];
  const deletes = [];
  for (const kind of KINDS) {
    const known = synced[kind] || {};
    const seen = new Set();
    for (const item of state[kind] || []) {
      if (!item || item.id === undefined || item.id === null) continue;
      const id = String(item.id);
      seen.add(id);
      const fp = fingerprint(item);
      if (known[id] !== fp) upserts.push({ kind, id, data: item, fp });
    }
    for (const id of Object.keys(known)) if (!seen.has(id)) deletes.push({ kind, id });
  }
  return { upserts, deletes };
}

export const hasChanges = (d) => d.upserts.length + d.deletes.length > 0;

// Merge rows downloaded from the cloud into local state. Pure.
// Returns the SAME state object when nothing changed (so screens don't re-render
// and no needless upload/download loop starts).
export function applyRemote(state, rows, { force = false } = {}) {
  const synced = cloneSynced(state._synced);
  const owners = cloneOwners(state._owners);
  let ownersTouched = false;
  const lists = {};
  const index = {};
  const removed = {};
  const changed = {};
  for (const kind of KINDS) {
    lists[kind] = (state[kind] || []).slice();
    index[kind] = new Map();
    lists[kind].forEach((x, i) => x && index[kind].set(String(x.id), i));
    removed[kind] = new Set();
    changed[kind] = false;
  }
  let since = state._since || null;
  let touched = false; // _synced changed

  const setFp = (kind, id, fp) => {
    if (synced[kind][id] !== fp) {
      synced[kind][id] = fp;
      touched = true;
    }
  };

  for (const row of rows || []) {
    if (!row || !KINDS.includes(row.kind)) continue;
    const kind = row.kind;
    const id = String(row.id);
    if (row.updated_at && (!since || row.updated_at > since)) since = row.updated_at;

    if (row.deleted) {
      if (owners[kind][id] !== undefined) {
        delete owners[kind][id];
        ownersTouched = true;
      }
    } else if (row.owner && owners[kind][id] !== row.owner) {
      owners[kind][id] = row.owner;
      ownersTouched = true;
    }

    const pos = index[kind].get(id);
    const here = pos !== undefined && !removed[kind].has(id);
    const local = here ? lists[kind][pos] : null;
    const knownFp = synced[kind][id];

    // Deleted here but not yet uploaded: keep that deletion pending.
    if (!local && knownFp !== undefined && !force) continue;

    const dirty = !!local && !force && fingerprint(local) !== knownFp;

    if (row.deleted) {
      if (dirty) continue; // you edited it after someone deleted it: keep your version, it re-uploads
      if (local) {
        removed[kind].add(id);
        changed[kind] = true;
      }
      if (synced[kind][id] !== undefined) {
        delete synced[kind][id];
        touched = true;
      }
      continue;
    }
    if (dirty) continue;

    const data = row.data;
    if (!data) continue;
    const fp = fingerprint(data);
    if (here) {
      if (fingerprint(local) !== fp) {
        lists[kind][pos] = data;
        changed[kind] = true;
      }
    } else {
      index[kind].set(id, lists[kind].length);
      removed[kind].delete(id);
      lists[kind].push(data);
      changed[kind] = true;
    }
    setFp(kind, id, fp);
  }

  const sinceChanged = since !== (state._since || null);
  if (!touched && !ownersTouched && !sinceChanged && !KINDS.some((k) => changed[k])) return state;

  const next = { ...state, _since: since };
  if (touched) next._synced = synced;
  if (ownersTouched) next._owners = owners;
  for (const kind of KINDS) {
    if (changed[kind]) next[kind] = removed[kind].size ? lists[kind].filter((x) => x && !removed[kind].has(String(x.id))) : lists[kind];
  }
  return next;
}

// After a successful upload / delete, remember what the cloud now has.
// `me` (the logged-in user's id) becomes the owner of items that were just
// created here, until the next download confirms it.
export function markSynced(state, pushed = [], deleted = [], me = null) {
  const synced = cloneSynced(state._synced);
  const owners = cloneOwners(state._owners);
  for (const p of pushed) {
    synced[p.kind][p.id] = p.fp;
    if (me && owners[p.kind][p.id] === undefined) owners[p.kind][p.id] = me;
  }
  for (const d of deleted) {
    delete synced[d.kind][d.id];
    delete owners[d.kind][d.id];
  }
  return { ...state, _synced: synced, _owners: owners };
}

// Add items that don't exist yet (used when importing data from this phone).
export function addMissing(state, incoming) {
  const next = { ...state };
  let added = 0;
  for (const kind of KINDS) {
    const have = new Set((state[kind] || []).map((x) => String(x.id)));
    const fresh = ((incoming && incoming[kind]) || []).filter((x) => x && x.id !== undefined && !have.has(String(x.id)));
    if (fresh.length) {
      next[kind] = [...(state[kind] || []), ...fresh];
      added += fresh.length;
    }
  }
  return { state: next, added };
}

// ---------------------------------------------------------------------------
// Network side. `rest(path, {method, body, headers})` -> {json}
// ---------------------------------------------------------------------------
const COLS = "kind,id,data,deleted,updated_at,owner";
const PAGE = 500;

// Problems that go away on their own (no internet, server busy, token refresh).
export const isTransient = (e) => !e || e.status === 0 || e.status === 401 || e.status === 408 || e.status === 429 || e.status >= 500;

export function createEngine({ rest }) {
  async function pull(since) {
    const rows = [];
    for (let offset = 0; ; offset += PAGE) {
      let q = `docs?select=${COLS}&order=updated_at.asc,kind.asc,id.asc&limit=${PAGE}&offset=${offset}`;
      q += since ? `&updated_at=gte.${encodeURIComponent(since)}` : "&deleted=eq.false";
      const r = await rest(q);
      const page = Array.isArray(r.json) ? r.json : [];
      rows.push(...page);
      if (page.length < PAGE) break;
    }
    return rows;
  }

  const toRow = (u) => ({ kind: u.kind, id: u.id, data: u.data, deleted: false });
  const upsert = (items) =>
    rest("docs?on_conflict=kind,id", {
      method: "POST",
      body: items.map(toRow),
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    });

  async function push({ upserts, deletes }) {
    const pushed = [];
    const deleted = [];
    const rejected = [];
    let error = null;

    outer: for (let i = 0; i < upserts.length; i += 20) {
      const chunk = upserts.slice(i, i + 20);
      try {
        await upsert(chunk);
        pushed.push(...chunk);
      } catch (e) {
        if (isTransient(e)) {
          error = e;
          break;
        }
        // The server refused something in this batch: find out which item(s).
        for (const u of chunk) {
          try {
            await upsert([u]);
            pushed.push(u);
          } catch (e2) {
            if (isTransient(e2)) {
              error = e2;
              break outer;
            }
            rejected.push({ kind: u.kind, id: u.id, reason: e2.message });
          }
        }
      }
    }

    if (!error) {
      for (const d of deletes) {
        try {
          const r = await rest(`docs?kind=eq.${d.kind}&id=eq.${encodeURIComponent(d.id)}&select=id`, {
            method: "PATCH",
            body: { deleted: true },
            headers: { Prefer: "return=representation" },
          });
          // Zero rows changed = the security rules said no (not your item).
          if (Array.isArray(r.json) && r.json.length === 0) rejected.push({ kind: d.kind, id: d.id, reason: "not allowed" });
          else deleted.push(d);
        } catch (e) {
          if (isTransient(e)) {
            error = e;
            break;
          }
          rejected.push({ kind: d.kind, id: d.id, reason: e.message });
        }
      }
    }
    return { pushed, deleted, rejected, error };
  }

  // Re-download specific items (after the server refused a change), so the
  // phone goes back to what the cloud really has.
  async function fetchItems(items) {
    const rows = [];
    for (const it of items) {
      const r = await rest(`docs?select=${COLS}&kind=eq.${it.kind}&id=eq.${encodeURIComponent(it.id)}`);
      const row = Array.isArray(r.json) && r.json[0];
      rows.push(row || { kind: it.kind, id: it.id, deleted: true });
    }
    return rows;
  }

  return { pull, push, fetchItems };
}

// One full pass: upload what changed here, then download what changed elsewhere.
// `apply(action)` must run the app reducer (REMOTE_ROWS / MARK_SYNCED actions).
// Returns { rejected } (items the server refused and that were reverted).
// Throws the network error if the upload could not finish (changes stay pending).
export async function syncOnce({ engine, getState, apply }) {
  let rejected = [];
  const d = diffState(getState());
  if (hasChanges(d)) {
    const r = await engine.push(d);
    apply({ type: "MARK_SYNCED", pushed: r.pushed, deleted: r.deleted });
    if (r.rejected.length) {
      // The server said no (e.g. editing someone else's item): go back to the real version.
      rejected = r.rejected;
      const rows = await engine.fetchItems(r.rejected);
      apply({ type: "REMOTE_ROWS", rows, force: true });
    }
    if (r.error) throw r.error;
  }
  const rows = await engine.pull(getState()._since);
  apply({ type: "REMOTE_ROWS", rows });
  return { rejected };
}
