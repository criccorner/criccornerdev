import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSync } from "../context/AppContext";
import { colors, spacing } from "../utils/theme";

// A thin status strip: shows only when something needs attention. (Offline / error / notice strips stay
// until the problem is gone, so they move the page once. The routine "Saving" indicator never does.)
export default function SyncBanner() {
  const { status, error, pending, notice, syncNow, dismissNotice } = useSync();

  if (notice) {
    return (
      <Pressable onPress={dismissNotice} style={[styles.bar, { backgroundColor: colors.accent }]}>
        <Text style={styles.text}>{notice} (tap to dismiss)</Text>
      </Pressable>
    );
  }
  if (status === "offline") {
    return (
      <Pressable onPress={syncNow} style={[styles.bar, { backgroundColor: colors.textMuted }]}>
        <Text style={styles.text}>
          Offline{pending ? ` · ${pending} change${pending === 1 ? "" : "s"} waiting to upload` : ""}. Tap to retry.
        </Text>
      </Pressable>
    );
  }
  if (status === "error") {
    return (
      <Pressable onPress={syncNow} style={[styles.bar, { backgroundColor: colors.danger }]}>
        <Text style={styles.text}>{error || "Sync problem"}. Tap to retry.</Text>
      </Pressable>
    );
  }
  if (status === "syncing" && pending > 0) {
    // A thin line drawn OVER the top of the screen. It takes no space, so the page does not jump
    // down and up every time something is saved.
    return <View pointerEvents="none" style={styles.saving} />;
  }
  return null;
}

const styles = StyleSheet.create({
  saving: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent, zIndex: 50, elevation: 50 },
  bar: { paddingVertical: 6, paddingHorizontal: spacing.md },
  text: { color: "#fff", fontSize: 12, fontWeight: "700", textAlign: "center" },
});
