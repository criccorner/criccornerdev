# CricCorner update v7  (no SQL, no app.json change)

1. Match awards under the result (completed matches): Player, Batter, Bowler and Fielder of the match, each with their figures.
2. Highlights on a match: each captain adds Instagram / Facebook links for his own team (batting, bowling, fielding,
   special moment). Everyone who can see the match can open them. A captain removes only his own team's links; an admin both.
3. Team logo (owner/admin: Team screen -> "Add logo") and a record on every team: Matches, Won, Lost, Tied, NR, Win %.
4. Tap a team -> "Cricket Hall of Fame": Run Machine, Wicket Hunter, MVP, Best All-Rounder, Safe Hands, Most Sixes, Most Consistent (top 3 each).
5. New "End match as No result" button on a live scorecard (rain / abandoned). It counts as NR and gives no awards.

## Install
Copy the `src` folder over your project's `src` folder, then rebuild the APK.

## Rules used (tell me if you want them changed)
- Points: 1 per run, 20 per wicket, 10 per maiden, 10 per catch, 15 per stumping, 10 per run-out. Player of the match / MVP = most points.
- Batter = most runs (fewer balls breaks a tie). Bowler = most wickets (fewer runs breaks a tie; with no wickets, best economy over 1+ over).
- Fielder = most catches + stumpings + run-outs. Not shown if nobody took one.
- Best All-Rounder: only players who both scored runs and took wickets, ranked by runs + 25 per wicket.
- Most Consistent: share of matches with 15+ runs, a wicket, or a dismissal in the field; needs 3+ matches.
- Win % = won / (won + lost + tied); no results are left out. Hall of Fame counts only players in that team's squad for each match.
- Everything is worked out from the scorecards each time, so a captain correction updates awards and the Hall of Fame.
