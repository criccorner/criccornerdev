import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../utils/theme";

export default function Badge({ label, color = colors.info }) {
  return <Text style={[styles.badge, { backgroundColor: color }]}>{label}</Text>;
}

export const STATUS_COLORS = {
  Open: colors.info,
  "In Progress": colors.accent,
  Resolved: colors.success,
  Rejected: colors.textMuted,
};

const styles = StyleSheet.create({
  badge: { color: "#fff", fontSize: 10, fontWeight: "800", paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, overflow: "hidden", marginRight: spacing.xs },
});
