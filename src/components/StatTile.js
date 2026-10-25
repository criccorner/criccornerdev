import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../utils/theme";

export default function StatTile({ label, value, sub }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}

// A wrapping grid of tiles, three per row.
export function StatGrid({ children }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  tile: { width: "31.5%", backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm, alignItems: "center" },
  value: { fontSize: 20, fontWeight: "800", color: colors.primary },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: "600", marginTop: 2, textTransform: "uppercase" },
  sub: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
});
