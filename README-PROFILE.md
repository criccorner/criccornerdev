# CricCorner: Full Scorecard + Edit Profile with Photo

## Install

1. Copy this zip's `src/` folder into your `criccorner` project (folders merge). It REPLACES these files
   (back them up first if you've edited them):
   - `src/screens/ScorecardScreen.js`
   - `src/navigation/RootNavigator.js`  (includes the Profile tab and the new Scorecard button)
   - `src/navigation/ProfileStack.js`
   - `src/screens/ProfileScreen.js`
2. Install two packages:
   ```bash
   npx expo install expo-image-picker expo-file-system
   ```
3. In `app.json`, replace `"plugins": []` with:
   ```json
   "plugins": [
     ["expo-image-picker", {
       "photosPermission": "CricCorner needs access to your photos so you can set a profile picture.",
       "cameraPermission": "CricCorner needs camera access so you can take a profile picture."
     }]
   ]
   ```
4. Increase `versionCode` under `android` in `app.json`, then:
   ```bash
   npx expo export --platform android
   eas build --platform android --profile preview
   ```
   Camera/photo access is a native feature, so it needs a fresh build. It won't appear via a quick reload.

## 1. Full scorecard

- During live scoring, tap **📊 Scorecard** (top right) at any time. It updates as you score.
- From the Matches list, scheduled and completed matches open their details/scorecard as before.
- Shows: match status, toss, result, and for each innings: score, run rate, required rate + balls left (chases),
  batting (runs, balls, 4s, 6s, strike rate, how out, `*` on the striker), yet to bat, extras breakdown,
  total, fall of wickets, and bowling (overs, maidens, runs, wickets, economy).
- Notes: the scorecard follows cricket rules (byes and leg-byes are not charged to the bowler; a no-ball counts as
  1 extra, with runs off the bat credited to the batter). The bowler line on the Live Scoring screen still counts
  byes against the bowler. Catches show "caught b Bowler" since the fielder isn't recorded.

## 2. Edit Profile + photo

- Profile tab shows your photo (or your initial), role, batting/bowling style and city, with an **Edit Profile** button.
- Editable: name, playing role, batting style, bowling style, city, and photo (camera, gallery, or remove).
- Mobile/email can't be edited because they verify the account.
- Saving also updates your entry in the Players tab, so the new name appears in team lists and scorecards.
- The photo is saved on the phone and survives app restarts.

## Limitation (same as before)

All data, including photos, lives on the phone that created it. Other players and the admin will not see your photo.
Sharing photos across phones needs the server step (cloud storage + database). The Players list still shows initials.
