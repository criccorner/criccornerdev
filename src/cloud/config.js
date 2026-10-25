// ---------------------------------------------------------------------------
// Paste the two values from your Supabase project:
//   Dashboard -> Project Settings -> API
//     Project URL      -> SUPABASE_URL        (looks like https://abcdxyz.supabase.co)
//     anon / public key -> SUPABASE_ANON_KEY  (a long text starting with "eyJ";
//                          if you only see a "Publishable key" (sb_publishable_...), use that)
// The anon key is MEANT to be inside the app. Your data is protected by the
// security rules in supabase/schema.sql, not by hiding this key.
// NEVER paste the "service_role" key here.
// ---------------------------------------------------------------------------
export const SUPABASE_URL = "https://aszuhrowdhgcudxibjpu.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Bp_W-lflDveU4oFZFSijBQ_1jD4C62k";

export function cloudConfigured() {
  return /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(SUPABASE_URL.trim()) && SUPABASE_ANON_KEY.trim().length > 20 && !/PASTE_/.test(SUPABASE_ANON_KEY);
}

export const baseUrl = () => SUPABASE_URL.trim().replace(/\/$/, "");
export const anonKey = () => SUPABASE_ANON_KEY.trim();
