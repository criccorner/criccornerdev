import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { navigationRef } from "../navigation/navRef";
import { trackScreen, trackAppVisit } from "./activity";

// Records which screens people open and when they come back to the app, for the admin's activity log. Shows nothing.
export default function ScreenTracker() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const onState = () => {
      try {
        const r = navigationRef.getCurrentRoute && navigationRef.getCurrentRoute();
        if (r && userRef.current) trackScreen(userRef.current, r.name);
      } catch (e) { /* tracking must never break the app */ }
    };
    const off = navigationRef.addListener ? navigationRef.addListener("state", onState) : null;
    const sub = AppState.addEventListener("change", (s) => { if (s === "active" && userRef.current) trackAppVisit(userRef.current); });
    return () => { if (typeof off === "function") off(); if (sub && sub.remove) sub.remove(); };
  }, []);
  return null;
}
