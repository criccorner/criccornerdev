// ---------------------------------------------------------------------------
// Team invite links.
//
// INVITE_WEB_BASE: the web address of the small page in the "invite-page" folder
//   (host index.html anywhere that serves web pages: GitHub Pages, Netlify,
//   Supabase Storage...). Example: "https://yourname.github.io/criccorner-join/"
//   The shared link then looks like  <that address>?t=<team>&c=<code>
//   and opens CricCorner if it is installed, or shows how to get it.
//   Leave it empty to share the app link (criccorner://...) instead; that only
//   works for people who already have the app.
//
// APP_DOWNLOAD_URL: where people can download the app (optional). It is added to the
//   invite message as "No app yet?".
// ---------------------------------------------------------------------------
export const INVITE_WEB_BASE = "https://criccornerdevdb.github.io/criccornerdev/";
export const APP_DOWNLOAD_URL = "";
