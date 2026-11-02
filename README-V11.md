# CricCorner update v11: Play Store pack
Copy `src` over your project's `src`. Run `supabase/delete_account.sql` once in the Supabase SQL editor. Rebuild.

1. Account deletion: Profile -> "Delete my account" (bottom). Type DELETE to confirm.
   Deletes login, profile, photo, contact details; the person's own player entry becomes "Deleted player"; feedback they sent is scrubbed.
   Match scorecards and teams other people use are kept. The main administrator cannot delete himself (hand over admin first).
   (Also fixes a trap: the database now allows ownership to be released when an account is deleted.)
2. `site/privacy.html` and `site/delete-account.html`: put them on GitHub Pages next to your invite page.
   Replace YOUR_NAME_OR_BUSINESS_NAME, YOUR_COUNTRY and YOUR_SUPPORT_EMAIL (use find/replace) before publishing.
   I am not a lawyer: read the policy once and make sure it matches what you do.
3. `PLAY-STORE.md`: store name, short and full description, release notes, graphics list, and suggested answers for the
   Data safety, content rating and app access forms, plus a release checklist.
