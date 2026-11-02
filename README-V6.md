# CricCorner update v6

Included:
1. Team invite link (share on WhatsApp / email / SMS; the player joins himself)
2. Overthrow runs (off the bat, byes, leg byes)
3. Shot type + direction for runs, and a wagon wheel on the scorecard
4. Scorer switch to turn the shot / wagon wheel ON or OFF during the match
(AI Analysis is parked for a later release.)

## Install
1. Copy the `src` folder over your project's `src` folder. It does NOT touch `src/cloud/config.js`.
2. Run `supabase/team_invite_link.sql` once in the Supabase SQL editor (needed for the invite link).
3. Build a new APK.

## Make the invite link open the app
1. In your project's `app.json`, inside `"expo": { ... }`, add:  `"scheme": "criccorner"`
2. Run `npx expo prebuild --platform android` once, then build as usual.
3. Put `invite-page/index.html` on any web host (GitHub Pages, Netlify, Supabase Storage...).
   If you want the page to offer a download button, set `APP_DOWNLOAD_URL` at the top of its script.
4. Open `src/invite/config.js` and set `INVITE_WEB_BASE` to that page's address
   (for example "https://yourname.github.io/criccorner-join/"). Optionally set `APP_DOWNLOAD_URL` too.
   Until you do, the app shares `criccorner://join/...` links, which only work for people who already have the app.

## Use
- Team screen -> "Share invite link". Pick WhatsApp / email / etc. The player taps the link, CricCorner
  opens, and "Join team" adds him. "Reset invite link" stops old links working.
- Live scoring -> "Shot & wagon wheel: ON/OFF" switch above the run buttons. With it ON, tapping 1/2/3/4/6
  asks where the ball went (optionally the shot too). Skip, or turn it off to score at full speed.
- "Overthrow" button next to Wide / No Ball / Bye / Leg Bye.
- Scorecard -> WAGON WHEEL card (by batter) once directions were recorded.
