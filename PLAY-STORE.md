# CricCorner: Google Play listing pack

Fill the `YOUR_...` placeholders in `site/privacy.html` and `site/delete-account.html` first, publish the `site/` folder
(GitHub Pages works: put `privacy.html` and `delete-account.html` next to your invite page), then paste the URLs below.

## URLs to enter in Play Console
- Privacy policy: `https://criccorner.github.io/criccornerdev/privacy.html`
- Account deletion (App content → Data safety → "Delete account URL"): `https://criccorner.github.io/criccornerdev/delete-account.html`
- Support email: criccornersupport@gmail.com

## Store listing text
**App name** (max 30): `CricCorner: Cricket Scoring`   (27)

**Short description** (max 80):
`Score cricket matches ball by ball, manage teams and track player stats.`   (72)

**Full description** (max 4000):
```
CricCorner is the easy way for cricket clubs, friends and families to run their games. Build your team, schedule a match, score it ball by ball, and share the scorecard with everyone.

SCORE LIVE
• Fast one-tap scoring: runs, wides, no-balls, byes, leg-byes, overthrows and wickets
• See the last three overs at a glance, and undo a ball in one tap
• Optional shot type and wagon wheel: record where the runs came from, or switch it off to score faster
• Works offline and syncs when you are back online

TEAMS AND PLAYERS
• Create teams, add players and set captains and wicketkeepers for every match
• Invite players with a link you can send on WhatsApp, email or SMS. They tap it and join the team themselves
• Add a team logo and see each team's matches, wins, losses, ties and win percentage
• Players can say whether they are available for an upcoming match

SCORECARDS AND AWARDS
• Full scorecards: batting, bowling, extras and fall of wickets
• Player, Batter, Bowler and Fielder of the match
• Add Instagram or Facebook highlight links for your team's best moments

CAPTAIN CORRECTIONS
• Picked the wrong bowler, or entered the wrong dismissal? Captains can fix it during or after the match, with cricket rules checked for you (for example, no bowler bowls two overs in a row)
• Replace a player across the whole match

STATS AND HALL OF FAME
• Personal batting, bowling and fielding stats
• Each team has its own Cricket Hall of Fame: Run Machine, Wicket Hunter, MVP, Best All-Rounder, Safe Hands, Most Sixes and Most Consistent

TOURNAMENTS
• Run a tournament with fixtures and sponsor banners

SIMPLE AND PRIVATE
• Sign in with your email, Google or Apple
• No ads
• Delete your account any time from the Profile tab

Questions or ideas? Use "Report an Issue / Suggestion" inside the app.
```

**Category:** Sports   **Tags:** Cricket, Sports management, Scoreboard   **Contact email:** criccornersupport@gmail.com

**Release notes (first release, max 500):**
`First release of CricCorner: live ball-by-ball scoring, teams and invite links, scorecards with match awards, captain corrections, team Hall of Fame, availability for matches, and Google/Apple sign-in.`

## Graphics you need to prepare
| Asset | Size |
|---|---|
| App icon | 512 × 512 PNG |
| Feature graphic | 1024 × 500 PNG/JPG |
| Phone screenshots | at least 2, up to 8 (portrait, e.g. 1080 × 1920). Good ones: live scoring, scorecard with awards, team page with Hall of Fame, wagon wheel, Help page |

## Policy forms: suggested answers (check each against what you ship)
**App access:** Restricted. Give Google a test account (create one and note the email and password under "Instructions"). Say: "Log in with the email and password, or register with any email. Sign-in with Google also works."
**Ads:** No ads.  **Target audience:** 18 and over (or 13+). Not designed for children.  **Category:** Sports, not a game.
**Content rating questionnaire:** no violence, no sexual content, no gambling, no user-to-user chat. Users can add Instagram/Facebook links (user-generated content links): answer the "users can share content" question honestly. Expected rating: Everyone.
**News app / Health / Financial:** No.  **Government app:** No.

**Data safety form**
| Data type | Collected | Shared with others | Optional | Purpose |
|---|---|---|---|---|
| Name | Yes | No (service providers only: Supabase) | No | Account, app functionality |
| Email address | Yes | No | No | Account, app functionality |
| Phone number | Yes | No | Yes | App functionality (matching players, invites) |
| User IDs | Yes | No | No | Account |
| Photos | Yes | No | Yes | App functionality (profile photo, team logo) |
| Other user-generated content (teams, scores, feedback text) | Yes | No | Yes | App functionality, support |
Everything else (location, contacts, financial, health, web history, device identifiers, diagnostics): **No**.
- Is all data encrypted in transit? **Yes**
- Can users request deletion? **Yes**: in-app (Profile → Delete my account) and web URL above.
- Does the app follow Play's Families policy? **No** (not for children).
Note: Supabase hosts your database for you. Google treats that as a service provider, not "sharing", so answer "No" to sharing; the answers above reflect that.

## Release checklist
1. `node scripts/harden-android.js`, release keystore ready (SECURITY.md)
2. `cd android && ./gradlew bundleRelease` → upload the `.aab` to Internal testing
3. Run the closed test (12 testers, 14 days) if it is a personal account, then apply for production
4. Google Cloud: set the OAuth consent screen to "In production"
5. Test: register, sign in with Google, join by invite link, score a match, delete a test account
