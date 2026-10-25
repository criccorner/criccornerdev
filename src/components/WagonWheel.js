import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../utils/theme";
import { ZONES, zonePoint } from "../utils/shots";

const SIZE = 250;

// Read-only wagon wheel: runs scored in each direction. summary = wheelSummary(...).zones
export default function WagonWheel({ zones, hand = "R" }) {
  const max = Math.max(1, ...ZONES.map((z) => (zones[z.key] ? zones[z.key].runs : 0)));
  return (
    <View style={[styles.wheel, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]}>
      <View style={styles.pitch} />
      {ZONES.map((z) => {
        const d = zones[z.key];
        const p = zonePoint(z, hand, SIZE);
        const size = d ? 34 + Math.round((d.runs / max) * 28) : 30;
        return (
          <View key={z.key} style={[styles.bubble, { width: size, height: size, borderRadius: size / 2, left: p.x - size / 2, top: p.y - size / 2 }, d && styles.bubbleOn]}>
            <Text style={[styles.runs, d && { color: "#fff" }]}>{d ? d.runs : "–"}</Text>
            <Text style={[styles.name, d && { color: "#fff" }]} numberOfLines={1}>{z.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: { alignSelf: "center", borderWidth: 2, borderColor: colors.border, backgroundColor: "#E8F3EA", marginTop: spacing.sm },
  pitch: { position: "absolute", left: SIZE / 2 - 9, top: SIZE / 2 - 38, width: 18, height: 76, backgroundColor: "#D9C79E", borderRadius: 3 },
  bubble: { position: "absolute", alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  runs: { fontSize: 13, fontWeight: "800", color: colors.textMuted },
  name: { fontSize: 7, color: colors.textMuted },
});
