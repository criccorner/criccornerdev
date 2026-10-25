// Highlight links (Instagram / Facebook) a captain can attach to a match.

const HOSTS = [
  "instagram.com", "www.instagram.com", "m.instagram.com", "instagr.am",
  "facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.com", "www.fb.com", "fb.watch",
];

export const HIGHLIGHT_KINDS = [
  { key: "batting", label: "🏏 Batting" },
  { key: "bowling", label: "🎯 Bowling" },
  { key: "fielding", label: "🧤 Fielding" },
  { key: "moment", label: "✨ Special moment" },
  { key: "other", label: "Highlights" },
];
export const MAX_HIGHLIGHTS_PER_TEAM = 10;

export function platformOf(url) {
  const m = /^https:\/\/([^/?#]+)/i.exec(url || "");
  const host = m ? m[1].toLowerCase() : "";
  if (/instagram\.com$|instagr\.am$/.test(host)) return "instagram";
  if (/facebook\.com$|fb\.com$|fb\.watch$/.test(host)) return "facebook";
  return null;
}

// Returns { url, platform } or { error }.
export function checkHighlightUrl(input) {
  let u = (input || "").trim();
  if (!u) return { error: "Paste an Instagram or Facebook link." };
  if (/\s/.test(u)) return { error: "That doesn't look like a single link." };
  if (u.length > 400) return { error: "That link is too long." };
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) u = `https://${u}`;
  if (/^http:\/\//i.test(u)) u = u.replace(/^http:/i, "https:");
  if (!/^https:\/\//i.test(u)) return { error: "Only https links are allowed." };
  const host = (/^https:\/\/([^/?#]+)/i.exec(u) || [])[1] || "";
  if (!HOSTS.includes(host.toLowerCase())) return { error: "Only Instagram or Facebook links can be added." };
  return { url: u, platform: platformOf(u) };
}
