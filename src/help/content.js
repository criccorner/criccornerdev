// Text of the in-app Help page. Each topic: { id, icon, title, items: [{ q, a }] }.
// Keep answers short and in the order a person would do things.
export const HELP_TOPICS = [
  {
    id: "start", icon: "🚀", title: "Getting started",
    items: [
      { q: "What is CricCorner?", a: "CricCorner lets you build teams, schedule matches, score them ball by ball, and see scorecards, player stats and team awards. Everything is shared through the cloud, so your teammates see the same data." },
      { q: "Create your account", a: "Tap Register, type your real name in Full Name, your email, choose your playing role and set a password (8+ characters with letters and a number). You can also continue with Google or Apple. Then verify your email if asked." },
      { q: "The five tabs", a: "Players, Teams, Matches, Tournaments and Profile at the bottom, plus My Stats. Most things start in Teams (build a team) and Matches (schedule and score a game)." },
      { q: "Working offline", a: "The app keeps working without internet and saves on your phone. When you are back online it syncs by itself; the banner at the top tells you when it is syncing." },
    ],
  },
  {
    id: "players", icon: "🧑", title: "Players",
    items: [
      { q: "Add a player", a: "Players tab → Add. Enter the name (and mobile or email if you have it). Players you add stay yours; you see your own players and your teammates." },
      { q: "Why do I see only some players?", a: "The Players list shows players you added, your own entry, and people in your teams or matches. Admins see everyone." },
      { q: "Edit a player", a: "Tap a player → Edit. You can edit players you added and your own entry. Your own name is changed in Profile → Edit Profile." },
    ],
  },
  {
    id: "teams", icon: "🛡️", title: "Teams",
    items: [
      { q: "Create a team", a: "Teams tab → Create Team. Give it a name, then open it to add players." },
      { q: "Add or invite players", a: "In the team, tap + Add Player to search and add someone, or Invite to send a join request that the player accepts." },
      { q: "Share an invite link", a: "In the team tap “Share invite link”, choose WhatsApp, email or any app. The player taps the link, CricCorner opens and he joins the team himself. “Reset invite link” makes old links stop working." },
      { q: "Team logo and record", a: "The team owner can tap Add logo. Each team shows Matches, Won, Lost, Tied, NR (no result) and Win %." },
      { q: "Cricket Hall of Fame", a: "Open a team to see its Hall of Fame: Run Machine, Wicket Hunter, MVP, Best All-Rounder, Safe Hands, Most Sixes and Most Consistent. Tap a name to see that player's stats. Points: 1 per run, 20 per wicket, 10 per maiden, 10 per catch, 15 per stumping, 10 per run-out." },
    ],
  },
  {
    id: "matches", icon: "🏏", title: "Matches and attendance",
    items: [
      { q: "Schedule a match", a: "Matches tab → Schedule Match. Pick the two teams, date, venue and overs. You can choose each side's squad, captain and wicketkeeper now or at match setup." },
      { q: "Say if you can play", a: "Open a scheduled match. Under WHO IS PLAYING? tap Available, Not available or Maybe. Everyone sees the totals and names. Tap the same button again to clear your answer. Captains can answer for players they manage." },
      { q: "Start the match", a: "Open the match → Start/Match Setup: confirm squads, toss, who bats first, openers, bowler and wicketkeeper. In squads, a ✅ ❌ ❓ before a name shows his answer." },
      { q: "Edit or delete", a: "Edit match details (before it is completed) from the scorecard. Only a team captain can delete a match." },
    ],
  },
  {
    id: "scoring", icon: "🎯", title: "Live scoring",
    items: [
      { q: "Score a ball", a: "Tap 0, 1, 2, 3, 4 or 6 for runs off the bat. Use Wide, No Ball, Bye, Leg Bye for extras (then choose the runs). A no-ball counts as a ball faced by the batter." },
      { q: "Wicket", a: "Tap Wicket, choose how he was out, the fielder if needed, and the incoming batter." },
      { q: "Undo", a: "Undo removes the last ball. The line under the scores shows the last three overs, e.g. “Ov 3: 1, 0, 4, 6, 1W, 2NB, 2”, so you can see how far to go back. W = wicket, Wd = wide, NB = no-ball, B = bye, LB = leg bye." },
      { q: "Overthrow", a: "Tap Overthrow, choose the runs already run, the overthrow runs, and whether they are off the bat, byes or leg byes." },
      { q: "Change strike or bowler", a: "Use ⇄ Change Strike if the batters crossed differently, and 🎯 Change Bowler between or during overs. After an over ends the app asks for the next bowler; a bowler cannot bowl two overs in a row." },
      { q: "Shots and wagon wheel", a: "Under 🎯 Shots choose All, 4 & 6 or Off. When a run is one you chose, pick the direction on the wheel (and the shot if you like). Skip to save time. Left-handers mirror the wheel." },
      { q: "Picked the wrong bowler?", a: "During scoring tap 🛠 Fix an over. Choose the over and the right bowler, or replace one bowler with another in all his overs. You can do this after the match too." },
    ],
  },
  {
    id: "scorecard", icon: "📋", title: "Scorecard, awards and highlights",
    items: [
      { q: "Scorecard", a: "Open any match for the full scorecard: batting, bowling, extras, fall of wickets, and the wagon wheel when directions were recorded." },
      { q: "Match awards", a: "A finished match shows Player, Batter, Bowler and Fielder of the match with their figures." },
      { q: "Highlights links", a: "Captains can add Instagram or Facebook links for their own team on the scorecard (batting, bowling, fielding or a special moment). Tap a link to open it." },
      { q: "No result", a: "If rain stops play, tap “End match as No result” on the scorecard of a live match. It counts as NR and gives no awards." },
    ],
  },
  {
    id: "corrections", icon: "🛠️", title: "Captain corrections",
    items: [
      { q: "Who can correct a match?", a: "The captain of each side (for his own team), the person who scored the match, and admins. It works during the match and after it." },
      { q: "What can be corrected", a: "Replace a player across the whole match; change how a batter was out and who caught or stumped him; change who bowled an over, or swap a wrong bowler in all his overs. Runs and the result never change." },
      { q: "Cricket rules enforced", a: "No bowled/caught/LBW off a wide, only a run-out off a no-ball, stumpings only by the wicketkeeper, and no bowler bowls two overs in a row." },
    ],
  },
  {
    id: "tournaments", icon: "🏆", title: "Tournaments",
    items: [
      { q: "Quarter Finals, Semi Finals and the Final", a: "On the tournament page tap + Schedule under Matches (or Other matches), pick the two teams, then choose the Round: Quarter Final, Semi Final, Final, 3rd place play-off, or your own name with Other. The round is shown on the match everywhere. You can change it later from Edit match details." },
      { q: "Create and run one", a: "Tournaments tab → Create. Add teams, schedule fixtures from the tournament page, and add sponsors whose banners show on the match screens." },
    ],
  },
  {
    id: "stats", icon: "📊", title: "Stats",
    items: [
      { q: "My Stats", a: "My Stats shows your batting, bowling and fielding totals and charts from completed matches." },
      { q: "Another player's stats", a: "In a team, tap a player's name (or a Hall of Fame entry) to open his stats." },
    ],
  },
  {
    id: "profile", icon: "👤", title: "Profile and account",
    items: [
      { q: "Edit your profile", a: "Profile → Edit Profile to change your name, photo, role, batting/bowling style and city." },
      { q: "Change password", a: "Profile → Change password. Type your current password, then the new one twice. If you signed in with Google or Apple and never set a password, use “Forgot password” on the login screen to create one." },
      { q: "Forgot password", a: "On the login screen tap “Forgot password”. A code is emailed to you." },
      { q: "Report a problem or idea", a: "Profile → Report an Issue / Suggestion. You can follow the reply under My Submissions." },
      { q: "Theme", a: "Profile → App theme to change colours." },
    ],
  },
  {
    id: "trouble", icon: "❓", title: "Troubleshooting",
    items: [
      { q: "I can't see a team or match", a: "You see teams and matches you created or play in. Ask the captain to add you, or open their invite link." },
      { q: "My changes don't show on a friend's phone", a: "Both phones must be online for a moment. Pull down or reopen the app; the sync banner shows progress." },
      { q: "A button is missing", a: "Some buttons only appear for captains, the scorer or admins (for example delete, corrections and highlights)." },
    ],
  },
];

export function searchHelp(topics, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return topics;
  return topics
    .map((t) => ({ ...t, items: t.items.filter((i) => `${t.title} ${i.q} ${i.a}`.toLowerCase().includes(q)) }))
    .filter((t) => t.items.length);
}
