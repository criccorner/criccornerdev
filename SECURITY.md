# Protecting the APK you share for testing

**Be realistic first:** an APK cannot be made impossible to reverse-engineer. Anyone who has the file can unpack it.
So the goal is (a) make it much harder to read or copy, (b) make sure there is nothing worth stealing inside, and
(c) make sure the server protects the data even if someone does read the app.

## What is inside the APK, and what that means
| Item | Can be read from the APK? | Why it is OK / what to do |
|---|---|---|
| Your app code (JavaScript) | Yes, but compiled to Hermes bytecode (already on in Expo) and, after step 1, obfuscated | Hard to read, not impossible. Keep no secrets in code. |
| Supabase URL + **anon key** | **Yes, always** | Designed to be public. Never put the `service_role` key in the app. |
| Your data | No | It is on the server. Protected only by the rules (RLS) in `supabase/schema.sql`. |

## Step 1 — Harden the build (10 minutes, on your PC)
1. `npx expo prebuild --platform android` (project root)
2. `node scripts/harden-android.js`
   - turns on R8 code shrinking + obfuscation and resource shrinking
   - turns off Android backups (so adb/backup cannot copy the app's data)
   - prepares signing with your own key (step 2)
3. Build as usual: `cd android && ./gradlew assembleRelease`

If the app misbehaves after R8 (rare), open `android/gradle.properties` and set
`android.enableProguardInReleaseBuilds=false`, then rebuild.

## Step 2 — Sign with your OWN key, not the debug key
Local builds are signed with a public debug key, so anyone can re-sign a modified copy that looks the same.
```
keytool -genkeypair -v -storetype JKS -keystore criccorner-release.jks -alias criccorner -keyalg RSA -keysize 2048 -validity 10000
```
Keep `criccorner-release.jks` and its passwords safe (NOT in git, back it up: lose it and you can never update the app).
Add to `%USERPROFILE%\.gradle\gradle.properties` (outside the project):
```
CRICCORNER_KEYSTORE_FILE=C:/Users/you/keys/criccorner-release.jks
CRICCORNER_KEYSTORE_PASSWORD=...
CRICCORNER_KEY_ALIAS=criccorner
CRICCORNER_KEY_PASSWORD=...
```
Changing the key means testers must uninstall the old build once.

## Step 3 — Share it the safe way
- **Best:** Google Play *Internal testing* or Firebase App Distribution: only people you invite can install it, you can revoke
  access, and no loose APK file circulates.
- If you must send the APK: send it only to people you know, never post a public link, and number your builds so you know who has what.
- **Use a separate Supabase project for test builds.** Create a second free project, run `schema.sql` there, and put its URL/key in
  `src/cloud/config.js` for the test APK. A leaked test APK then exposes only test data, never your real teams and players.

## Step 4 — Make the server the real guard (most important)
Everyone who is logged in can read all shared data on the server today; the app only *hides* what is not theirs.
Someone with the APK and an account could call the API directly. Before a wide release:
- In Supabase → Authentication, keep **Confirm email** ON and add rate limits / CAPTCHA if you see sign-up abuse.
- Ask me to add row-level rules so the database itself only returns teams/matches/players a person belongs to
  (the "database lock on visibility" I offered earlier).
- If an APK leaks: Supabase → Settings → API → regenerate the anon key (and publish a new build), and block abusive users in the Admin panel.

## What this does NOT stop
Determined people can still read the code structure, remove the checks inside their own copy, or run it on a rooted phone.
That is why steps 3 and 4 matter more than obfuscation.
