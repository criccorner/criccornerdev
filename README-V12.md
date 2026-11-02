# CricCorner update v12: copyright and terms
Copy `src` over your project's `src` and rebuild. No SQL.

1. FIRST: open `src/legal/config.js` and set OWNER_NAME (your name or business name), SUPPORT_EMAIL and GOVERNING_LAW (e.g. "New South Wales, Australia").
   Until you do, the app shows "© 2026 CricCorner. All rights reserved."
2. Every user now sees the copyright notice:
   - once after logging in, a "Copyright and Terms" screen with "I agree, continue" (shown again to anyone new, or to everyone if you change LEGAL_VERSION in config.js);
   - a "© 2026 ... All rights reserved." line with a "Terms of Use & Copyright" link at the bottom of the Login, Register, Home and Profile screens.
3. `site/terms.html` is the same Terms for the web (put it next to privacy.html and fill in the YOUR_... words there too).
   Link it in the Play Console listing if you like.
The Terms are a general template, not legal advice: please read them once.
