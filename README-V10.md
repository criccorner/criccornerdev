# CricCorner update v10
Copy `src` over your project's `src`, run `supabase/oauth_signup.sql` once (for Google/Apple names), then rebuild.
Also in this zip: `scripts/harden-android.js` and `SECURITY.md` (item 5).

## 1. Sign in with Google / Apple  (needs setup in Supabase, see below)
Login and Register screens have "Continue with Google / Apple". The browser opens, the person signs in, and CricCorner reopens already logged in.
Setup (once):
1. Supabase -> Authentication -> URL Configuration -> Redirect URLs: add `criccorner://auth-callback`
2. Supabase -> Authentication -> Providers -> Google: enable; paste a Client ID + Secret from Google Cloud Console
   (APIs & Services -> Credentials -> OAuth client, type "Web application"; its Authorized redirect URI is the callback URL shown in the Supabase Google page).
3. Apple (optional; needs a paid Apple Developer account): Providers -> Apple, follow Supabase's steps (Services ID + key).
   If you are not setting Apple up yet, open `src/auth/oauth.js` and set its `enabled` to false so the button is hidden.
4. `app.json` must still contain `"scheme": "criccorner"` (added for invite links).
Accounts with the same email are joined automatically (a person who registered with email can later use Google with that email).
Not tested against real Google/Apple here: please try it once and tell me what you see.

## 2. Help page
Profile -> "Help - how to use CricCorner", and a Help link at the bottom of the Login screen. Searchable, grouped by module.

## 3. Replace the bowler of an over (during or after the match)
- Live scoring has a new "Fix an over" button (next to Change Strike / Change Bowler). It opens Captain corrections on the Bowlers tab.
- There you can fix one over (any bowler from the playing squad) or swap a wrong bowler in all his overs.
- The person who created/scores the match can now do corrections for BOTH sides, as well as each captain for his own side and admins.

## 4. Attendance
Open a scheduled match -> "WHO IS PLAYING?": Available / Not available / Maybe. Everyone sees totals and names. A player answers for himself;
the person who added a player can answer for him. In Match Setup, squads show ✅ ❌ ❓ beside names and have "Select all except Not available".
Stored on the player's own entry, so no SQL is needed.

## 5. Securing the APK
Read SECURITY.md. After `npx expo prebuild --platform android` run `node scripts/harden-android.js`, make your own release key, and share builds via Play internal testing / Firebase App Distribution.
