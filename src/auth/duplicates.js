// Asks the server, before sign-up, whether an email or mobile number already has a CricCorner account.
// Works without being logged in (the server function only answers yes/no for the exact values asked).
// If the check itself cannot be done (no internet, function not installed yet) we return "unknown" and let
// sign-up carry on: the server still refuses real duplicates.
import { baseUrl, anonKey } from "../cloud/config";
import { request } from "../cloud/http";

export async function checkAccountExists(email, phone) {
  try {
    const key = anonKey();
    const headers = { apikey: key };
    if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
    const r = await request(`${baseUrl()}/rest/v1/rpc/account_exists`, {
      method: "POST",
      body: { p_email: email || "", p_phone: phone || "" },
      headers,
    });
    const j = r && r.json ? r.json : null;
    if (!j || typeof j !== "object") return { email: false, phone: false, unknown: true };
    return { email: !!j.email, phone: !!j.phone, unknown: false };
  } catch (e) {
    return { email: false, phone: false, unknown: true };
  }
}
