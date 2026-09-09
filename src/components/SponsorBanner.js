import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "../utils/theme";

// Renders every sponsor attached to a tournament in a horizontally
// scrollable strip. Drop this into any screen that shows a live or
// completed score so sponsors get guaranteed visibility. If a match has
// no tournament, nothing is rendered.
export default function SponsorBanner({ tournament }) {
  if (!tournament || !tournament.sponsors || tournament.sponsors.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Tournament Sponsors</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tournament.sponsors.map((s) => (
          <View key={s.id} style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>{s.name}</Text>
            {s.tagline ? <Text style={styles.tagline} numberOfLines={1}>{s.tagline}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.primaryDark, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  label: { ...typography.label, color: "#CFE3D8", marginBottom: spacing.xs },
  chip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    alignItems: "center",
  },
  chipText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  tagline: { color: "#CFE3D8", fontSize: 10 },
});
