# CricCorner v2: bowler fix, My Stats, Analytics, Tournament formats

## Install
Copy this zip's `src/` folder into your project. It REPLACES (back up first if you edited them):
- `src/utils/cricketEngine.js`, `src/utils/scorecard.js`
- `src/screens/LiveScoringScreen.js`, `src/screens/ScorecardScreen.js`
- `src/screens/CreateTournamentScreen.js`, `src/screens/TournamentDetailScreen.js`
- `src/navigation/RootNavigator.js`
and ADDS `src/stats/`, `src/tournament/`, `src/screens/stats/`, `src/components/StatTile.js`, `src/components/BarChart.js`.
It includes everything from the previous scoring/extras/strike patches. It needs the earlier login, admin, profile and
isolation patches to be installed. No new packages. Raise `versionCode`, run `npx expo export --platform android`, rebuild with `eas build`.

## 1. Change bowler (fixed)
Bowler selections and changes are now saved in the same ordered log as the balls, so Undo reverses exactly the last thing you did:
- Changing the bowler mid-over, then undoing back past the change, brings the earlier bowler back.
- Undo right after a Change Bowler reverts the change (before, it deleted a ball and left the change in place).
- Choosing/changing the bowler twice at the start of an over, wides at the start of an over, undoing the ball that ended an over,
  and re-scoring it all behave correctly. The previous over's bowler stays blocked.
- Matches saved before this update still load.

## 2 & 3. My Stats tab (Stats + Analytics)
- Stats: batting, bowling, fielding, wicketkeeping, recent form.
- Analytics: strengths, areas to improve, strong areas, strike rate, dot/boundary %, run distribution, phases
  (powerplay / middle / death), starting vs set, positions, innings situations, dismissals, bowling economy by phase and more.
- Fielding and keeping stats need to know WHO took each catch. The wicket screen now asks "Caught by / Stumped by / Run out by"
  (optional), and there is a new Wicketkeeper selector on the Live Scoring screen.
- Insights are simple rules over your own numbers with minimum sample sizes. Shot direction isn't recorded, so off-side/leg-side
  analysis isn't included.
- Stats come from matches in this account on this phone, counting completed matches and finished first innings.

## 4. Tournament formats
Create Tournament now sets the format and generates the matches:
- Round Robin (single or double), Knockout (byes for any number of teams, seeded bracket), Groups + Knockout.
- Choose overs, teams, random draw or seeded order, first match day, matches per day, days between match days, venue.
- Points table (win 2, tie 1, loss 0) with net run rate, per league or per group.
- Knockout rounds and the post-group knockout are generated with one tap when the previous stage is finished.
- A tied knockout match asks you to pick who goes through (for example after a super over).
- Tournaments made before this update: open them and tap "Set Format & Generate Matches". Sponsors still show on every match.
- The format can be changed until the first generated match starts.

## Limits
- All data is on this phone. Stats and tournaments only cover matches scored in this account.
- No DLS, abandoned/no-result matches, or super overs (use the manual winner pick for knockout ties).
- A run-out still assumes the striker is out.
- With 7 tabs the labels are small. If they look cramped, set `tabBarShowLabel: false` in RootNavigator.js.
