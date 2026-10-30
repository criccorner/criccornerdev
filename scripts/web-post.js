// After `npx expo export -p web`: makes the site installable on an iPhone / Android home screen,
// and lets GitHub Pages open any address by serving the app for unknown paths.
//   node scripts/web-post.js <repo-name>
const fs = require("fs");
const path = require("path");
const repo = process.argv[2] || "";
const base = repo && !/\.github\.io$/i.test(repo) ? "/" + repo : "";
const dist = "dist";
const html = path.join(dist, "index.html");
if (!fs.existsSync(html)) { console.error("dist/index.html not found - run the export first"); process.exit(1); }

const copy = (from, to) => { try { fs.copyFileSync(from, path.join(dist, to)); return true; } catch (e) { return false; } };
const hasIcon = copy("assets/icon.png", "app-icon.png");
copy("assets/favicon.png", "favicon-app.png");

const manifest = {
  name: "CricCorner",
  short_name: "CricCorner",
  description: "Cricket scoring for teams, matches and tournaments",
  start_url: base + "/",
  scope: base + "/",
  display: "standalone",
  background_color: "#01365C",
  theme_color: "#01365C",
  icons: hasIcon ? [{ src: base + "/app-icon.png", sizes: "512x512", type: "image/png", purpose: "any" }] : [],
};
fs.writeFileSync(path.join(dist, "manifest.webmanifest"), JSON.stringify(manifest, null, 2));

let s = fs.readFileSync(html, "utf8");
const tags = [
  `<link rel="manifest" href="${base}/manifest.webmanifest">`,
  hasIcon ? `<link rel="apple-touch-icon" href="${base}/app-icon.png">` : "",
  `<meta name="apple-mobile-web-app-capable" content="yes">`,
  `<meta name="mobile-web-app-capable" content="yes">`,
  `<meta name="apple-mobile-web-app-title" content="CricCorner">`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="default">`,
  `<meta name="theme-color" content="#01365C">`,
].filter(Boolean).join("\n    ");
if (!/rel="manifest"/.test(s)) s = s.replace("</head>", `    ${tags}\n  </head>`);
// let the app draw under the iPhone's notch / home bar
s = s.replace(/<meta name="viewport" content="([^"]*)"/, (m, c) => (/viewport-fit/.test(c) ? m : `<meta name="viewport" content="${c}, viewport-fit=cover"`));
fs.writeFileSync(html, s);
fs.copyFileSync(html, path.join(dist, "404.html")); // GitHub Pages serves this for unknown paths
fs.writeFileSync(path.join(dist, ".nojekyll"), "");
console.log("web site ready in dist/ (base '" + base + "')");
