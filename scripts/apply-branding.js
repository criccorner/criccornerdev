#!/usr/bin/env node
// Points app.json at the CricCorner logo files in ./assets. Run from the PROJECT ROOT (Git Bash):
//     node scripts/apply-branding.js
// Then regenerate the native project so the new icon reaches the build:
//     npx expo prebuild --platform android --clean && node scripts/harden-android.js
// Safe to run twice. It only edits app.json (keeps everything else).
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const aj = path.join(root, "app.json");
if (!fs.existsSync(aj)) { console.error("Cannot find app.json. Run this from the project root."); process.exit(1); }
for (const f of ["icon.png", "adaptive-icon.png", "adaptive-icon-background.png", "splash-icon.png", "favicon.png"]) {
  if (!fs.existsSync(path.join(root, "assets", f))) { console.error("Missing assets/" + f + ". Unzip the branding zip into the project first."); process.exit(1); }
}
const j = JSON.parse(fs.readFileSync(aj, "utf8"));
const ex = (j.expo = j.expo || {});
const NAVY = "#01365C";
ex.icon = "./assets/icon.png";
ex.splash = { ...(ex.splash || {}), image: "./assets/splash-icon.png", resizeMode: "contain", backgroundColor: NAVY };
ex.android = ex.android || {};
ex.android.adaptiveIcon = { ...(ex.android.adaptiveIcon || {}), foregroundImage: "./assets/adaptive-icon.png", backgroundImage: "./assets/adaptive-icon-background.png", backgroundColor: NAVY };
ex.web = { ...(ex.web || {}), favicon: "./assets/favicon.png" };
fs.writeFileSync(aj, JSON.stringify(j, null, 2) + "\n");
console.log("app.json updated: icon, splash (navy background), Android adaptive icon, web favicon.");
const plug = (ex.plugins || []).find((p) => (Array.isArray(p) ? p[0] : p) === "expo-splash-screen");
if (plug) console.log("Note: app.json also lists the expo-splash-screen plugin. If the splash looks old after the rebuild, send me that plugin entry.");
console.log("Next: npx expo prebuild --platform android --clean && node scripts/harden-android.js");
