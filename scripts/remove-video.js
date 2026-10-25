#!/usr/bin/env node
// One-time cleanup: removes the highlights-video TEST feature from a project that had v13 installed.
// Run from the PROJECT ROOT (Git Bash):   node scripts/remove-video.js
// Safe to run twice. Then run:  npm install   (and, if you keep an android folder, see the note at the end)
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const log = (m) => console.log("  " + m);
const rm = (p) => { const f = path.join(root, p); if (fs.existsSync(f)) { fs.rmSync(f, { recursive: true, force: true }); log("deleted " + p); } };

["src/video", "src/screens/dev", "scripts/cliptools", "scripts/install-cliptools.js", "README-V13.md"].forEach(rm);

// package.json: drop the three packages only the video test used (expo-file-system stays: the app uses it elsewhere)
const pj = path.join(root, "package.json");
if (fs.existsSync(pj)) {
  const j = JSON.parse(fs.readFileSync(pj, "utf8"));
  for (const n of ["expo-camera", "expo-sharing", "expo-media-library"]) {
    for (const k of ["dependencies", "devDependencies"]) if (j[k] && j[k][n]) { delete j[k][n]; log("package.json: removed " + n); }
  }
  fs.writeFileSync(pj, JSON.stringify(j, null, 2) + "\n");
}

// app.json: drop the camera / media-library plugins and any camera, mic, storage permissions
const aj = path.join(root, "app.json");
if (fs.existsSync(aj)) {
  const j = JSON.parse(fs.readFileSync(aj, "utf8"));
  const ex = j.expo || {};
  if (Array.isArray(ex.plugins)) {
    const before = ex.plugins.length;
    ex.plugins = ex.plugins.filter((p) => !/^expo-(camera|media-library|sharing)$/.test(Array.isArray(p) ? p[0] : p));
    if (ex.plugins.length !== before) log("app.json: removed camera / media-library plugins");
  }
  const bad = /(CAMERA|RECORD_AUDIO|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE|READ_MEDIA_VIDEO|READ_MEDIA_IMAGES|READ_MEDIA_AUDIO|ACCESS_MEDIA_LOCATION)$/;
  if (ex.android && Array.isArray(ex.android.permissions)) {
    const before = ex.android.permissions.length;
    ex.android.permissions = ex.android.permissions.filter((p) => !bad.test(p));
    if (ex.android.permissions.length !== before) log("app.json: removed camera / mic / storage permissions");
  }
  if (ex.ios && ex.ios.infoPlist) for (const k of ["NSCameraUsageDescription", "NSMicrophoneUsageDescription", "NSPhotoLibraryAddUsageDescription", "NSPhotoLibraryUsageDescription"]) {
    if (k in ex.ios.infoPlist) { delete ex.ios.infoPlist[k]; log("app.json: removed " + k); }
  }
  fs.writeFileSync(aj, JSON.stringify(j, null, 2) + "\n");
}

// Native android folder (only if you have one): remove the module and the permissions it added
const javaRoot = path.join(root, "android", "app", "src", "main", "java");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
if (fs.existsSync(javaRoot)) {
  for (const f of walk(javaRoot)) {
    const b = path.basename(f);
    if (b === "ClipToolsModule.kt" || b === "ClipToolsPackage.kt") { fs.rmSync(f); log("deleted " + path.relative(root, f)); }
    else if (/^MainApplication\.(kt|java)$/.test(b)) {
      const s = fs.readFileSync(f, "utf8");
      const t = s
        .replace(/return\s+PackageList\(this\)\.packages\.toMutableList\(\)\.apply \{ add\(ClipToolsPackage\(\)\) \} \/\/ criccorner-cliptools/, "return PackageList(this).packages")
        .split("\n").filter((l) => !/criccorner-cliptools/.test(l)).join("\n");
      if (t !== s) { fs.writeFileSync(f, t); log("unregistered ClipTools in " + b); }
    }
  }
}
const mf = path.join(root, "android", "app", "src", "main", "AndroidManifest.xml");
if (fs.existsSync(mf)) {
  const s = fs.readFileSync(mf, "utf8");
  const t = s.split("\n").filter((l) => !/<uses-permission[^>]*(android\.permission\.(CAMERA|RECORD_AUDIO|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE|READ_MEDIA_VIDEO|READ_MEDIA_IMAGES|READ_MEDIA_AUDIO|ACCESS_MEDIA_LOCATION))/.test(l)).join("\n");
  if (t !== s) { fs.writeFileSync(mf, t); log("AndroidManifest.xml: removed camera / mic / storage permissions"); }
}
console.log("\nDone. Now run: npm install");
console.log("Tip: if you regenerate android (npx expo prebuild --platform android --clean) you do not need the android part of this script.");
