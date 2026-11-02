# CricCorner v14

## 1. Screen jumping up and down while scoring or saving: fixed
Cause: every time something was saved, a "Saving…" bar appeared at the top and pushed the whole app down, then removed itself and pulled it back up. It is now a thin line drawn over the top of the screen, so nothing moves. (The "Offline", error and notice strips still appear when there is a real problem.)

## 2. Quarter Final / Semi Final / Final for tournament matches
- Tournament > + Schedule: after choosing the teams there is a **ROUND** row: League match, Quarter Final, Semi Final, Final, 3rd place play-off, Eliminator, Qualifier, or **Other…** to type your own (for example Pre-quarter Final).
- The round shows on the tournament page (in order: Quarter, Semi, Final), in the Matches list and on the scorecard.
- Change it later with Edit match details (tournament matches only).
- The round is a label. It does not change the points table or who is shown as champion.

## 3. "Not 4 & 6" removed
Shot modes are now **All**, **4 & 6** and **Off**. A match that was saved with the old mode simply behaves as All.

## 4. Change password
Profile > **🔑 Change password**. Enter the current password, then the new one twice. If you signed in with Google or Apple and never set a password, use Forgot password on the login screen once to create one.

## 5. Scoring screen
- Only **one over row**: the over being bowled, or the last over once it has finished ("Ov 3: 1, 0, 4, 6, 1W, 2NB, 2"; the last ball is underlined). A long over shows its last 12 balls.
- Run buttons are bigger, in two rows (0 1 2 / 3 4 6), and stretch to use the free space below. Extras, Wicket and Undo are bigger too. On a small phone the screen scrolls instead.

## Install
Unzip over the project and rebuild. No SQL, no new packages.

## Not covered
Jitter on a screen other than the Saving bar: if you still see it, tell me which screen and what you were doing.

## v14.1 (follow-up)
- **Run buttons** are now average size: 58 high, two rows of three (0 1 2 / 3 4 6). They no longer stretch to fill the screen.
- **Champion only after the Final.** No team is shown as champion until a match whose round is **Final** has been played and has a winner. Topping the league table is not enough. This applies to every format (league, knockout, groups). A tied Final asks the organiser who the champion is. After the league finishes, the tournament page says to schedule a Final (+ Schedule > Round: Final).
- Plain league fixtures no longer carry a "LEAGUE" tag; Group, Quarter Final, Semi Final and Final tags still show.

## v14.2: "who bowls next?" sheet could not be completed (stuck match)
With a big squad (12+ names) the bowler sheet after an over was taller than the screen and could not scroll, so **Confirm Bowler** was off-screen and scoring was stuck. Now:
- the sheet scrolls, with every name, Confirm and "Undo last ball instead" reachable;
- if a side has no players listed for the match, everyone not on the other side is offered (with a note), so the list can never be empty;
- the same protection applies to the innings-2 setup sheet (openers and bowler).

## v14.3: video test removed
The highlights-video test (v13) is gone, together with the camera, microphone, gallery and storage
permissions it needed, so Google Play has nothing to review there. Balls still store their `at` time (harmless).
Run once from the project root (Git Bash): `node scripts/remove-video.js` then `npm install`.
It deletes the video files, removes `expo-camera`, `expo-sharing` and `expo-media-library` from `package.json`,
the camera / media plugins and permissions from `app.json`, and the ClipTools module and permissions from `android/` if present.

## v14.9: footer size, player profiles, player search, rename team
- Footer tabs: icons 26 (was 22) and labels 12 (was 10), about 20% bigger. The active tab has a soft highlight behind its icon. "Tournaments" is shortened to "Tourneys" so the bigger text fits.
- Tapping a player now opens his profile and stats from: the Players tab, the scorecard (batters, bowlers, yet to bat, match awards), as well as a team's roster. Editing is still there: an "Edit" pill on the Players list and an "Edit" button on the profile.
- Players tab: search box (name or role) above the list; the full list stays.
- Teams: "Edit name" on the team page (owner, creator or admin). Finished matches' result sentences follow the new name.
