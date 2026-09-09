# CricCorner — React Native Starter

A cross-platform (Android + iOS) cricket scoring app built with **Expo / React
Native**. This is a fully working starter: all data lives on-device
(AsyncStorage), so you can run it, add players, create teams, schedule
matches, and score a live game end-to-end with zero backend setup. Swap the
data layer for a real API later (see below) without touching any screen.

## Features implemented

1. **Players** — add a player manually, or a player can "join" the app with
   their own mobile number / email (`Players → Add / Join Player`).
2. **Teams** — create a team, optionally assign an owner.
3. **Rosters** — add a player to a team directly, or the team owner can send
   a join request that the player accepts/declines (`Team → Request to Join`).
4. **Match scheduling** — pick two teams, 1–50 overs (validated), venue,
   date, and optionally attach to a tournament.
5. **Tournaments** — create a tournament, attach matches to it.
6. **Live scoring** — full ball-by-ball engine: runs, wides, no-balls, byes,
   leg-byes, wickets with dismissal type + incoming batsman, automatic strike
   rotation, over completion → pick next bowler, innings transition with
   target/required-run-rate, match result, and a full scorecard.
7. **Sponsors** — add sponsors to a tournament; they render as a banner on
   the live-scoring screen and the scorecard for every match in that
   tournament.

## Project structure

```
App.js                       Entry point (providers + navigation)
src/
  context/AppContext.js      Global state (players/teams/matches/tournaments) + reducer
  storage/storage.js         AsyncStorage persistence (swap this for real API calls)
  utils/cricketEngine.js     Pure ball-by-ball scoring engine (the core logic)
  utils/theme.js             Design tokens (colors, spacing, type)
  navigation/RootNavigator.js Bottom tabs + stacks
  components/                Reusable UI (Button, Card, FormField, SponsorBanner)
  screens/                   One file per screen
```

## Running it locally

Requires Node.js 18+.

```bash
npm install
npx expo start
```

This opens Expo Dev Tools. Scan the QR code with the **Expo Go** app on your
phone (Android or iOS) to run it instantly with no native build — this is
the fastest way to try it out and iterate.

## Building an installable APK (Android) and IPA (iOS)

Expo's cloud build service, **EAS Build**, produces real, installable
binaries for both platforms from the same codebase — you don't need a Mac
for the iOS build.

```bash
npm install -g eas-cli
eas login                       # free Expo account
eas build:configure

# Android — produces a downloadable .apk
eas build --platform android --profile preview

# iOS — produces a .ipa (needs an Apple Developer account, $99/yr,
# to install on real devices or submit to the App Store / TestFlight)
eas build --platform ios --profile preview
```

Add this `eas.json` (created automatically by `eas build:configure`, or
create it yourself) so the Android build outputs an `.apk` rather than the
Play-Store `.aab` format:

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    }
  }
}
```

EAS builds in the cloud and gives you a download link when done — no local
Android Studio / Xcode installation required. For iOS, you'll still need an
Apple Developer Program membership to sign the build and install it on a
physical device (Apple requires this regardless of what tool you use).

## Known simplifications (call these out if you productionize)

- A wicket always dismisses the striker. Run-outs of the non-striker need a
  small addition — let the scorer pick which end when confirming the wicket.
- No enforcement that a bowler can't bowl two overs in a row.
- No free-hit tracking after a no-ball.
- "Join via phone/email" adds the player immediately — there's no real
  OTP/verification step, since that requires a backend (see below).

## Connecting a real backend

Everything currently goes through two files, so this is a contained change:

- **`src/storage/storage.js`** — replace `loadState`/`saveState` with calls
  to your API (e.g. `fetch('/api/state')`), or better, migrate the reducer
  in `src/context/AppContext.js` to dispatch real network requests per
  action (create player, create team, etc.) instead of just updating local
  state.
- **Auth & invites** — `JOIN_PLAYER_BY_CONTACT` and `REQUEST_PLAYER_JOIN` in
  `AppContext.js` are the two places to wire up: (1) OTP/magic-link
  verification for phone/email join, and (2) an SMS/email/push notification
  when a team owner sends a join request.
- **Real-time live scoring** — for multiple devices to see the same live
  match update instantly, put `computeInningsSummary`'s input (the `balls`
  array) behind a WebSocket or a service like Pusher/Ably/Firebase
  Realtime DB, and broadcast each `recordBall` call. The engine itself
  (`cricketEngine.js`) doesn't need to change — it's already a pure
  function over the ball log.
- **Push notifications** for join requests, match reminders, and live-score
  updates: `expo-notifications` is the natural fit inside this Expo setup.

## Design tokens

All colors/spacing/type live in `src/utils/theme.js` — change values there
to re-theme the whole app in one place.
