# CricCorner – Player patch (edit players + fix duplicate contacts)

Apply LAST, after: login → admin → profile → isolation → v2.
Unzip over your project (F:\Data\CricCorner\criccorner), allow overwrite.
Then bump `android.versionCode` in app.json by 1 and rebuild the APK (eas build -p android --profile preview).

## What's new
- Players tab: tap any player to EDIT name / mobile / email / role. Your own entry shows a YOU badge.
  "This is me" fills in your login number. Delete is allowed only for players not used in any team or match.
- My Stats now links you to your player by number in ANY format (+61-434916595, +61 434 916 595, 0434 916 595).
- Profile -> "Fix duplicate contacts": previews and applies the clean-up below.

## Fix duplicate contacts (Profile tab)
1. Opens a preview of every player using your number. Nothing changes until you press Apply.
2. Keeps ONE "Ashutosh Bam" (the one actually used in teams/matches) with exactly +61434916595.
3. Other "Ashutosh Bam" entries: deleted if unused; merged into the kept one if used (their matches/teams move over).
4. Players with a different name get a dummy email (e.g. rohit.sharma@example.com) and the number is removed.
5. You can change any row's action in the preview. A backup is saved first; use "Restore previous data" to undo.
