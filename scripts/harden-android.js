#!/usr/bin/env node
// Hardens the Android release build of CricCorner. Run from the PROJECT ROOT, after
// `npx expo prebuild --platform android` and before `./gradlew assembleRelease`:
//
//     node scripts/harden-android.js
//
// It (1) turns on code shrinking / obfuscation (R8) and resource shrinking, (2) signs the
// release with YOUR keystore instead of the public debug key, (3) stops Android backups
// from copying the app's data out. Safe to run again. It only edits files inside ./android.
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const gradleProps = path.join(root, "android", "gradle.properties");
const appGradle = path.join(root, "android", "app", "build.gradle");
const manifest = path.join(root, "android", "app", "src", "main", "AndroidManifest.xml");
const MARK = "// criccorner-hardening";
const notes = [];
const warn = (m) => notes.push("  ! " + m);
const done = (m) => notes.push("  + " + m);

for (const f of [gradleProps, appGradle, manifest]) {
  if (!fs.existsSync(f)) {
    console.error(`Cannot find ${path.relative(root, f)}.\nRun this from the project root after "npx expo prebuild --platform android".`);
    process.exit(1);
  }
}

// 1. gradle.properties ------------------------------------------------------------
let props = fs.readFileSync(gradleProps, "utf8");
const setProp = (key, value) => {
  const re = new RegExp(`^\\s*#?\\s*${key.replace(/\./g, "\\.")}\\s*=.*$`, "m");
  if (re.test(props)) props = props.replace(re, `${key}=${value}`);
  else props = props.replace(/\s*$/, `\n${key}=${value}\n`);
};
setProp("android.enableProguardInReleaseBuilds", "true");
setProp("android.enableShrinkResourcesInReleaseBuilds", "true");
if (!/CRICCORNER_KEYSTORE_FILE/.test(props)) {
  props += `
# Release signing: keep the real passwords OUT of git. Put them in ~/.gradle/gradle.properties instead,
# or leave these lines and fill them in on your own computer only.
# CRICCORNER_KEYSTORE_FILE=C:/Users/you/keys/criccorner-release.jks
# CRICCORNER_KEYSTORE_PASSWORD=
# CRICCORNER_KEY_ALIAS=criccorner
# CRICCORNER_KEY_PASSWORD=
`;
}
fs.writeFileSync(gradleProps, props);
done("R8 code shrinking/obfuscation and resource shrinking switched on (android/gradle.properties)");

// 2. app/build.gradle: release signing ---------------------------------------------
let g = fs.readFileSync(appGradle, "utf8");
if (g.includes(MARK)) {
  done("release signing already set up");
} else {
  const sc = /signingConfigs\s*\{[\s\S]*?\n\s{4}\}\n/; // the signingConfigs block (4-space indent in the Expo template)
  const releaseCfg = `    signingConfigs {
        release { ${MARK}
            if (project.hasProperty('CRICCORNER_KEYSTORE_FILE')) {
                storeFile file(CRICCORNER_KEYSTORE_FILE)
                storePassword CRICCORNER_KEYSTORE_PASSWORD
                keyAlias CRICCORNER_KEY_ALIAS
                keyPassword CRICCORNER_KEY_PASSWORD
            }
        }
`;
  if (/signingConfigs\s*\{/.test(g)) {
    g = g.replace(/signingConfigs\s*\{\n/, releaseCfg);
    // inside buildTypes -> release, use the release key when it is configured
    const bt = g.indexOf("buildTypes");
    const rel = bt >= 0 ? g.indexOf("release {", bt) : -1;
    if (rel >= 0) {
      const head = g.slice(0, rel);
      let tail = g.slice(rel);
      tail = tail.replace(
        /signingConfig\s+signingConfigs\.debug/,
        "signingConfig project.hasProperty('CRICCORNER_KEYSTORE_FILE') ? signingConfigs.release : signingConfigs.debug"
      );
      g = head + tail;
      done("release builds are signed with your own keystore when CRICCORNER_KEYSTORE_FILE is set (android/app/build.gradle)");
    } else {
      warn("could not find the release build type in android/app/build.gradle; set the signing config by hand");
    }
    fs.writeFileSync(appGradle, g);
  } else {
    warn("could not find signingConfigs in android/app/build.gradle; set the release signing by hand");
  }
}
if (!/CRICCORNER_KEYSTORE_FILE\s*=/.test(props.replace(/^\s*#.*$/gm, ""))) {
  warn("No release keystore set yet. Until you set CRICCORNER_KEYSTORE_FILE the build still uses the public debug key (see SECURITY.md step 2).");
}

// 3. AndroidManifest: no backups ----------------------------------------------------
let m = fs.readFileSync(manifest, "utf8");
if (/android:allowBackup="false"/.test(m)) {
  done("backups already off");
} else if (/android:allowBackup="true"/.test(m)) {
  m = m.replace('android:allowBackup="true"', 'android:allowBackup="false"');
  fs.writeFileSync(manifest, m);
  done("Android backup turned off (AndroidManifest.xml)");
} else if (/<application\b/.test(m)) {
  m = m.replace(/<application\b/, '<application android:allowBackup="false"');
  fs.writeFileSync(manifest, m);
  done("Android backup turned off (AndroidManifest.xml)");
} else {
  warn("no <application> tag found in AndroidManifest.xml");
}

console.log("CricCorner Android hardening:\n" + notes.join("\n"));
