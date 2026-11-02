# CricCorner update v8  (no SQL, no app.json change)
Copy the `src` folder over your project's `src` folder and rebuild.

1. No-ball: the batter now gets the ball counted as faced (scorecard, live score, strike rate and player stats). Wides still don't count. The over and bowler's balls are unchanged (a no-ball is not a legal ball).
2. Shot type: "Lofted shot" added. The live-scoring switch is now four buttons: All runs / 4 & 6 only / Not 4 & 6 / Off.
   Only the runs you choose ask for a shot and direction; the rest record instantly.
3. Live scoring shows RECENT BALLS: the current and previous two overs, e.g. "Ov 3: 1, 0, 4, 6, 1W, 2NB, 2". The last ball (the one Undo removes) is bold and underlined.
   Key: number = runs, W = wicket (1W = 1 run + wicket), Wd = wide, NB = no-ball (2NB = 2 runs in total), B = bye, LB = leg bye.
4. Captain corrections -> Bowlers -> "Picked the wrong bowler?": choose the wrong bowler, then anyone in the playing squad (even someone who hasn't bowled)
   and he takes every over/ball the wrong bowler had. Two overs in a row are still refused. The per-over chips below still work for a single over.
