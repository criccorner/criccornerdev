# CricCorner update v9  (no SQL, no app.json change)
Copy the `src` folder over your project's `src` folder and rebuild.

1. Live scoring fits one screen: tighter spacing; the 6 run buttons on one row; Wide / No Ball / Bye / Leg Bye / Overthrow on one row;
   shots mode on one row (All / 4 & 6 / Not 4 & 6 / Off); wicketkeeper row, "Tap an extra..." line, "Score a ball" heading and the
   "Recent balls" heading removed. The recent-overs line stays. (The keeper is still taken from the match setup.)
2. Team page: tap any player in the roster (avatar or name) or in the Cricket Hall of Fame to open his stats. (The earlier v6 update had accidentally dropped the Player Stats screen from the navigation, so tapping did nothing; this restores it.)
3. Registration bug: the phone's password manager was filling the saved password into the Full Name box. The name and mobile boxes now
   switch autofill off, and registration refuses a name that contains the password.
   Anyone already registered with a wrong name can fix it in Profile -> Edit profile -> Full Name.
