# CricCorner – Cloud patch (one shared database for all players)

After this patch every player who installs the APK and registers sees the same
players, teams, matches, tournaments and live scores. Data is stored online in
**Supabase** (free plan is enough to start).

Apply AFTER: login → admin → profile → isolation → v2 → player patch.

## Part 1 – Create the online database (about 10 minutes, once)

1. Go to https://supabase.com → sign up → **New project**.
   Name `criccorner`, choose a database password (save it), region **Sydney (ap-southeast-2)**.
2. Open `supabase/schema.sql` from this zip in a text editor.
   Near the top replace `YOUR_EMAIL_HERE@example.com` with the email **you will register with**
   (this email becomes the main administrator). Copy the whole file.
3. In Supabase: **SQL Editor → New query** → paste → **Run**. It should say "Success".
4. **Authentication → Emails (Templates)**: for both **Confirm signup** and **Reset password**,
   replace the message body with this, so people get a 6-digit code to type into the app:
   `<h2>Your CricCorner code</h2><p>Your code is: <b>{{ .Token }}</b></p>`
   Under **Authentication → Providers → Email**, set **Email OTP length = 6** and keep "Confirm email" ON.
5. **IMPORTANT – emails:** Supabase's built-in email sender only allows about 2 emails per hour.
   For real use, add your own sender: **Project Settings → Authentication → SMTP Settings**
   (e.g. a free Resend / Brevo account, or Gmail with an app password).
   For quick testing only you can switch "Confirm email" OFF: people are then logged in straight after registering (no code).
6. **Project Settings → API**: copy the **Project URL** and the **anon / public key**
   (or "Publishable key" if that is all you see).

## Part 2 – Put the app on your phone

1. Unzip this patch over `F:\Data\CricCorner\criccorner` (allow overwrite). It also adds `App.js`.
2. Open `src/cloud/config.js` and paste the two values from step 6.
3. In `app.json` raise `android.versionCode` by 1.
4. Run `npx expo export --platform android` (catches mistakes), then
   `eas build -p android --profile preview`.
5. Install the new APK over the old one (your old on-phone data stays on the phone).

## Part 3 – First use (you, the administrator)

1. Open the app → **Register** with the SAME email you put in the SQL file.
   Enter your mobile number `+61434916595`, choose a role, verify the code, done.
   You will see the **Admin Panel** in Profile.
2. On the phone that still has your old data: **Profile → Upload data from this phone** → Upload.
   (Old players, teams, matches and tournaments go online. They are owned by you.)
3. **Profile → Fix duplicate contacts** (administrators only): keeps ONE "Ashutosh Bam" with
   +61434916595, deletes/merges the other Ashutosh Bams, gives everyone else who used your
   number a dummy email like `rohit.sharma@example.com`. A backup is made first.
4. Tell your players to install the same APK and register with their email.

## How sharing works
- Everyone sees everything (like CricHeroes). Only the person who created a match/tournament/player
  entry – or an administrator – can change or delete it. Teams can be updated by anyone logged in,
  so players can accept join requests. A player can always edit their own player entry (matched by email).
- If someone tries to change something they don't own, the change is undone on their phone and a note is shown.
- Works offline: changes are saved on the phone and uploaded when internet returns (a grey bar shows "Offline").
- Live scores reach other phones within about 5 seconds.
- Blocked players are signed out within about a minute and see the "blocked by administrator" message.

## Limits to know about
- Login is by **email**. Mobile number is a profile detail (used to link your stats), not a login.
- Any logged-in player can see other players' phone numbers/emails (they are on the Players list).
- Free Supabase projects pause after 7 days without use (open the Supabase dashboard and click Restore).
  Free plan: 500 MB database, 50,000 monthly active users.
- Updates arrive by checking every 5 seconds, not instantly. Instant push needs a further step.
- iOS: not built yet; this code works on iOS but needs an Apple developer account to install.
