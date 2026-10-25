# CricCorner: Registration, Login/Logout, Forgot Password

## Install (4 steps)

1. Copy everything in this zip into your `criccorner` project folder (the `src/` folders merge).
   It REPLACES only `App.js`. All other files are new.
2. Install the one new dependency:
   ```bash
   npx expo install expo-crypto
   ```
3. Add a Profile (logout) tab. Open `src/navigation/RootNavigator.js` and make two edits:
   ```js
   // near the other imports
   import ProfileScreen from "../screens/ProfileScreen";

   // inside <Tab.Navigator>, after the Tournaments tab
   <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon("👤") }} />
   ```
4. Check, then build:
   ```bash
   npx expo export --platform android
   eas build --platform android --profile preview
   ```

## What it does

- **Register**: name, mobile number OR email, password (8+ chars, letters + a number),
  role (Batter / Bowler / All-rounder / Wicketkeeper Batsman).
- **Verify**: 6-digit code, expires in 10 min, 5 attempts max, resend with 30s cooldown.
  Login is blocked until verified. After verifying, the player appears in the Players tab with their role.
- **Login / Logout**: session persists across app restarts. 5 wrong passwords locks the account for 5 minutes.
  Logout is on the Profile tab.
- **Forgot password**: send code, enter code + new password. The screen never reveals whether an account exists.

## IMPORTANT: demo mode vs real email/SMS

The app cannot send email/SMS by itself (that needs provider secrets that must never ship inside an app).
In this build, `src/auth/delivery.js` shows the code in an on-screen alert so you can test the flow.
Accounts live on the device only, so a user can't log in from another phone.

To go live, you need a small backend. Keep the screens, replace the bodies in
`src/auth/AuthContext.js` with calls to:

| Endpoint | Purpose |
|---|---|
| POST /auth/register | create account, email/SMS the code (SendGrid / AWS SES / Twilio) |
| POST /auth/verify | check code, mark verified |
| POST /auth/resend | resend code |
| POST /auth/login | return a session token (store in expo-secure-store) |
| POST /auth/forgot | send reset code |
| POST /auth/reset | check code, set new password |

Server must hash passwords with bcrypt/argon2, rate-limit, and expire codes. Alternatively use a managed
service (Firebase Auth or Supabase Auth) that gives you email verification and password reset out of the box.
