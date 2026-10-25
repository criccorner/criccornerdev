// Tiny fetch wrapper: timeouts, JSON, and readable errors.
export class ApiError extends Error {
  constructor(status, body, message) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 = no network / timeout
    this.body = body;
    this.code = (body && (body.error_code || body.code)) || null;
  }
  get offline() {
    return this.status === 0;
  }
}

const isRaw = (b) => typeof b === "string" || (typeof Blob !== "undefined" && b instanceof Blob) || (typeof ArrayBuffer !== "undefined" && b instanceof ArrayBuffer);

export async function request(url, { method = "GET", headers = {}, body, timeoutMs = 20000 } = {}) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  const h = { ...headers };
  let payload;
  if (body !== undefined) {
    if (isRaw(body)) payload = body;
    else {
      payload = JSON.stringify(body);
      if (!h["Content-Type"]) h["Content-Type"] = "application/json";
    }
  }
  let res;
  try {
    res = await fetch(url, { method, headers: h, body: payload, signal: ctrl ? ctrl.signal : undefined });
  } catch (e) {
    throw new ApiError(0, null, e && e.name === "AbortError" ? "The request timed out. Check your internet connection." : "No internet connection.");
  } finally {
    if (timer) clearTimeout(timer);
  }
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (e) {
      json = null;
    }
  }
  if (!res.ok) {
    const msg = (json && (json.msg || json.message || json.error_description || json.error)) || `Request failed (${res.status}).`;
    throw new ApiError(res.status, json, String(msg));
  }
  return { status: res.status, json, headers: res.headers };
}
