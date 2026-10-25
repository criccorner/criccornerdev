import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { OAUTH_PROVIDERS } from "../auth/oauth";
import { colors, spacing, radius } from "../utils/theme";

// "Continue with Google / Apple" for the login and register screens.
export default function SocialButtons() {
  const { signInWithProvider, oauthError } = useAuth();
  const [err, setErr] = useState("");
  const list = OAUTH_PROVIDERS.filter((p) => p.enabled);
  if (!list.length) return null;
  const go = async (key) => {
    setErr("");
    const r = await signInWithProvider(key);
    if (!r.ok) setErr(r.error);
  };
  return (
    <View style={{ marginTop: spacing.lg }}>
      <View style={styles.or}>
        <View style={styles.line} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.line} />
      </View>
      {list.map((p) => (
        <Pressable key={p.key} onPress={() => go(p.key)} style={styles.btn}>
          <Text style={styles.icon}>{p.key === "google" ? "G" : ""}</Text>
          <Text style={styles.label}>{p.label}</Text>
        </Pressable>
      ))}
      {err || oauthError ? <Text style={styles.error}>{err || oauthError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  or: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { marginHorizontal: spacing.sm, color: colors.textMuted, fontWeight: "700" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: spacing.sm + 4, marginBottom: spacing.sm },
  icon: { fontWeight: "900", fontSize: 18, color: colors.text, width: 26, textAlign: "center" },
  label: { fontWeight: "700", color: colors.text, fontSize: 15 },
  error: { color: colors.danger, marginTop: spacing.xs },
});
