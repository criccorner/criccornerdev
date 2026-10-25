import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseEmail, parsePhoneOptional, validatePassword, ROLES } from "./validators";
import { profileToUser, friendlyError, BLOCKED_MESSAGE } from "./db";
import { authCall, rest, removeAvatar, validToken } from "../cloud/api";
import { clearCache } from "../cloud/cacheStore";
import { pathFromUrl } from "../profile/store";
import { loadSession, setSession, getSession, onSessionChange, normalizeSession } from "../cloud/session";
import { ApiError } from "../cloud/http";
import { Linking } from "react-native";
import { oauthUrl, parseOAuthCallback, isOAuthCallback } from "./oauth";

// Login with email + password, backed by Supabase Auth (a real server).
// Same functions as the old on-device version, so the screens barely changed.

const LOGIN_ERROR = "Incorrect email or password.";
const PROFILE_CACHE = "@criccorner_profile_cache_v1";
const AuthContext = createContext(null);
const fail = (error) => ({ ok: false, error });

async function fetchProfile(userId) {
  const r = await rest(`profiles?select=*&id=eq.${encodeURIComponent(userId)}`);
  const row = Array.isArray(r.json) ? r.json[0] : null;
  if (row) AsyncStorage.setItem(PROFILE_CACHE, JSON.stringify(row)).catch(() => {});
  return row || null;
}

const codeError = (e) => (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 429 ? "Incorrect or expired code." : friendlyError(e));

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState(null);
  const userRef = useRef(null);
  userRef.current = user;

  const signOutLocal = useCallback(async (message) => {
    await setSession(null);
    AsyncStorage.removeItem(PROFILE_CACHE).catch(() => {});
    setUser(null);
    setNotice(message || null);
  }, []);

  // Take a freshly issued session, load the profile, and sign in (or refuse if blocked).
  const adopt = useCallback(
    async (rawSession) => {
      await setSession(normalizeSession(rawSession));
      const p = await fetchProfile(getSession().user.id);
      if (!p) {
        await signOutLocal();
        return fail("Your account is not set up yet. Please try again in a moment.");
      }
      if (p.blocked) {
        await signOutLocal();
        return fail(BLOCKED_MESSAGE);
      }
      setNotice(null);
      setUser(profileToUser(p));
      return { ok: true };
    },
    [signOutLocal]
  );

  // On launch: restore the saved login (works offline using the saved profile).
  useEffect(() => {
    (async () => {
      const s = await loadSession();
      if (s) {
        try {
          const p = await fetchProfile(s.user.id);
          if (!p) await signOutLocal();
          else if (p.blocked) await signOutLocal(BLOCKED_MESSAGE);
          else setUser(profileToUser(p));
        } catch (e) {
          if (e instanceof ApiError && e.status === 0) {
            try {
              const raw = await AsyncStorage.getItem(PROFILE_CACHE);
              if (raw) setUser(profileToUser(JSON.parse(raw)));
            } catch (err) {}
          } else {
            await signOutLocal();
          }
        }
      }
      setReady(true);
    })();
  }, []);

  // If the server ends the session (password changed elsewhere, token revoked), log out here.
  useEffect(
    () =>
      onSessionChange((s) => {
        if (!s && userRef.current) {
          setUser(null);
        }
      }),
    []
  );

  const register = useCallback(async ({ name, identifier, password, role, phone }) => {
    const email = parseEmail(identifier);
    if (!name || !name.trim()) return fail("Please enter your full name.");
    if (!email) return fail("Enter a valid email address.");
    // Phone password managers sometimes fill the saved password into the first text box. Never accept that as a name.
    if (password && (name.trim() === password || (password.length >= 6 && name.includes(password)))) {
      return fail("The Full Name box has your password in it. Please clear it and type your real name.");
    }
    if (!ROLES.includes(role)) return fail("Please choose your playing role.");
    const ph = parsePhoneOptional(phone);
    if (ph === null) return fail("Enter a valid mobile number (8-15 digits), or leave it empty.");
    const pwErr = validatePassword(password);
    if (pwErr) return fail(pwErr);
    try {
      const json = await authCall("/signup", { body: { email, password, data: { name: name.trim(), role, phone: ph } } });
      if (json && json.access_token) {
        // Email confirmation is switched off in Supabase: the account is ready straight away.
        const r = await adopt(json);
        return r.ok ? { ok: true, identifier: email, signedIn: true } : r;
      }
      return { ok: true, identifier: email };
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) return fail("Too many sign-up emails were sent just now. Please wait a few minutes and try again.");
      if (e instanceof ApiError && /already|registered/i.test(e.message)) return fail("An account with this email already exists. Please log in.");
      return fail(friendlyError(e));
    }
  }, [adopt]);

  const verify = useCallback(async (identifier, code) => {
    const email = parseEmail(identifier);
    if (!email) return fail("Account not found.");
    try {
      const json = await authCall("/verify", { body: { type: "signup", email, token: String(code || "").trim() } });
      const r = await adopt(json);
      return r;
    } catch (e) {
      return fail(codeError(e));
    }
  }, [adopt]);

  const resendCode = useCallback(async (identifier) => {
    const email = parseEmail(identifier);
    if (!email) return fail("Nothing to verify for this account.");
    try {
      await authCall("/resend", { body: { type: "signup", email } });
      return { ok: true };
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) return fail("Please wait a minute before requesting another code.");
      return fail(friendlyError(e));
    }
  }, []);

  const login = useCallback(async (identifier, password) => {
    const email = parseEmail(identifier);
    if (!email || !password) return fail(LOGIN_ERROR);
    try {
      const json = await authCall("/token?grant_type=password", { body: { email, password } });
      return await adopt(json);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "email_not_confirmed" || /not confirmed/i.test(e.message)) {
          return { ok: false, needsVerification: true, identifier: email, error: "Please verify your email before logging in." };
        }
        if (e.status === 400 || e.status === 401 || e.status === 422) return fail(LOGIN_ERROR);
      }
      return fail(friendlyError(e));
    }
  }, [adopt]);

  // ---- Google / Apple ----
  const completeOAuth = useCallback(
    async (url) => {
      const t = parseOAuthCallback(url);
      if (!t) return null;
      if (t.error) {
        setNotice(null);
        return fail(t.error);
      }
      try {
        const u = await authCall("/user", { method: "GET", token: t.access_token });
        return await adopt({ ...t, user: u });
      } catch (e) {
        return fail(friendlyError(e, "Couldn't finish signing in. Please try again."));
      }
    },
    [adopt]
  );

  // Opens the provider's sign-in page in the browser; the result comes back through completeOAuth.
  const signInWithProvider = useCallback(async (provider) => {
    try {
      await Linking.openURL(oauthUrl(provider));
      return { ok: true, pending: true };
    } catch (e) {
      return fail("Couldn't open the sign-in page.");
    }
  }, []);

  const [oauthError, setOauthError] = useState(null);
  useEffect(() => {
    const handle = async (url) => {
      if (!isOAuthCallback(url) || userRef.current) return;
      const r = await completeOAuth(url);
      if (r && !r.ok) setOauthError(r.error);
      else setOauthError(null);
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => sub && sub.remove && sub.remove();
  }, [completeOAuth]);

  // Re-read the signed-in account (after an admin edits it, or to detect blocking).
  const refreshUser = useCallback(async () => {
    const s = getSession();
    if (!s) {
      setUser(null);
      return;
    }
    try {
      const p = await fetchProfile(s.user.id);
      if (!p) return signOutLocal();
      if (p.blocked) return signOutLocal(BLOCKED_MESSAGE);
      setUser(profileToUser(p));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403) && !getSession()) setUser(null);
      // offline: keep the current user
    }
  }, [signOutLocal]);

  // Permanently deletes the signed-in account on the server (see supabase/delete_account.sql).
  const deleteAccount = useCallback(async () => {
    const s = getSession();
    const me = userRef.current;
    if (!s || !me) return fail("Please log in again.");
    try {
      const photo = pathFromUrl(me.photoUrl);
      if (photo) await removeAvatar(photo).catch(() => {}); // best effort: the picture goes too
      await rest("rpc/delete_my_account", { method: "POST", body: {} });
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) return fail("No internet connection. Connect and try again.");
      if (e instanceof ApiError && (e.status === 404 || /delete_my_account/.test(String(e.message)))) return fail("Account deletion is not switched on yet. Please contact support.");
      return fail(friendlyError(e, "Couldn't delete the account. Please try again."));
    }
    await clearCache(me.id).catch(() => {});
    await signOutLocal("Your account has been deleted.");
    return { ok: true };
  }, [signOutLocal]);

  const logout = useCallback(async () => {
    const s = getSession();
    if (s) authCall("/logout?scope=local", { token: s.access_token }).catch(() => {});
    await signOutLocal();
  }, [signOutLocal]);

  // Always reports success so the screen doesn't reveal which emails have accounts.
  const requestReset = useCallback(async (identifier) => {
    const email = parseEmail(identifier);
    if (!email) return fail("Enter a valid email address.");
    try {
      await authCall("/recover", { body: { email } });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 0 || e.status === 429)) return fail(friendlyError(e));
    }
    return { ok: true, identifier: email };
  }, []);

  const resetPassword = useCallback(async (identifier, code, newPassword) => {
    const email = parseEmail(identifier);
    const pwErr = validatePassword(newPassword);
    if (pwErr) return fail(pwErr);
    if (!email) return fail("Incorrect code.");
    let json;
    try {
      json = await authCall("/verify", { body: { type: "recovery", email, token: String(code || "").trim() } });
    } catch (e) {
      return fail(codeError(e));
    }
    try {
      await authCall("/user", { method: "PUT", body: { password: newPassword }, token: json.access_token });
    } catch (e) {
      return fail(friendlyError(e, "Couldn't set the new password."));
    }
    authCall("/logout?scope=local", { token: json.access_token }).catch(() => {});
    return { ok: true };
  }, []);

  // Change the password while logged in. The current password is checked first, so a phone left
  // unlocked can't be used to take over the account.
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const me = userRef.current;
    const email = me && parseEmail(me.email);
    if (!email) return fail("Please log in again.");
    if (!currentPassword) return fail("Enter your current password.");
    const pwErr = validatePassword(newPassword);
    if (pwErr) return fail(pwErr);
    if (newPassword === currentPassword) return fail("The new password must be different from the current one.");
    try {
      await authCall("/token?grant_type=password", { body: { email, password: currentPassword } });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 400 || e.status === 401 || e.status === 422)) {
        return fail("The current password is not correct. If you signed in with Google or Apple and never set a password, use \"Forgot password\" on the login screen to create one.");
      }
      return fail(friendlyError(e, "Couldn't check your password. Please try again."));
    }
    try {
      await authCall("/user", { method: "PUT", body: { password: newPassword }, token: await validToken() });
    } catch (e) {
      return fail(friendlyError(e, "Couldn't change the password. Please try again."));
    }
    // Refresh this phone's login with the new password so it carries on without a hiccup.
    try {
      await adopt(await authCall("/token?grant_type=password", { body: { email, password: newPassword } }));
    } catch (e) {
      /* the old session is still valid; nothing to do */
    }
    return { ok: true };
  }, [adopt]);

  const value = useMemo(
    () => ({ ready, user, notice, register, verify, resendCode, login, logout, refreshUser, requestReset, resetPassword, changePassword, signInWithProvider, oauthError, deleteAccount }),
    [ready, user, notice, register, verify, resendCode, login, logout, refreshUser, requestReset, resetPassword, changePassword, signInWithProvider, oauthError, deleteAccount]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
