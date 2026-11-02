# CricCorner patch v4 (cumulative: includes v3 - delete, squads, captain/keeper, themes, remove player)

## New
1. Edit match details (overs, venue, date, squads, captain, wicketkeeper) for scheduled AND live matches.
2. Each player sees only the matches, teams and tournaments he is part of, and can change only what he created.
3. Add player to team: search by name, mobile number or email.

## Install
1. Copy `App.js` and `src/` over your project.
2. Supabase -> SQL Editor, run both (safe to re-run):
   - supabase/captain_can_update_match.sql   (if you haven't already)
   - supabase/tighten_team_permissions.sql   (teams can now only be changed by their creator/admin)
3. Build a new APK. The first launch after updating re-downloads the shared data once.

## Notes
- Everything created so far belongs to whoever created it (mostly your admin account). Other players can't change those
  teams/matches/tournaments - only view them. To hand something over, change its owner in Supabase.
- Visibility is enforced inside the app. Phone numbers/emails of other players are masked on screen.
