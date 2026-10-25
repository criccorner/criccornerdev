import { baseUrl } from "../cloud/config";

// Sign in with Google / Apple through Supabase. The phone opens the provider's page in the
// browser; when the person finishes, Supabase sends the browser back to REDIRECT, which
// opens CricCorner again with the login tokens in the link.
export const OAUTH_REDIRECT = "criccorner://auth-callback";

// Turn a provider OFF here if you have not set it up in Supabase yet.
export const OAUTH_PROVIDERS = [
  { key: "google", label: "Continue with Google", icon: "G", enabled: true },
  { key: "apple", label: "Continue with Apple", icon: "", enabled: true },
];

export const oauthUrl = (provider) =>
  `${baseUrl()}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(OAUTH_REDIRECT)}`;

export const isOAuthCallback = (url) => typeof url === "string" && url.startsWith(OAUTH_REDIRECT);

// -> { access_token, refresh_token, expires_in } | { error } | null (not a login link)
export function parseOAuthCallback(url) {
  if (!isOAuthCallback(url)) return null;
  const rest = url.slice(OAUTH_REDIRECT.length);
  const hash = rest.includes("#") ? rest.slice(rest.indexOf("#") + 1) : "";
  const query = rest.includes("?") ? rest.slice(rest.indexOf("?") + 1).split("#")[0] : "";
  const params = {};
  for (const part of [query, hash]) {
    for (const kv of part.split("&")) {
      if (!kv) continue;
      const i = kv.indexOf("=");
      const k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i));
      const v = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " "));
      params[k] = v;
    }
  }
  if (params.error || params.error_description) return { error: params.error_description || params.error };
  if (!params.access_token || !params.refresh_token) return { error: "The sign-in did not finish. Please try again." };
  return { access_token: params.access_token, refresh_token: params.refresh_token, expires_in: Number(params.expires_in) || 3600 };
}
