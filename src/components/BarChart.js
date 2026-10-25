import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../utils/theme";

// A small dependency-free bar chart. data: [{ label, value, color? }]
export default function BarChart({ data, height = 100, color = colors.primary, format = (v) => String(Math.round(v)) }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={[styles.row, { height: height + 40 }]}>
      {data.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.col}>
          <Text style={styles.val}>{format(d.value)}</Text>
          <View style={{ width: "68%", height: Math.max((d.value / max) * height, d.value > 0 ? 3 : 1), backgroundColor: d.color || color, borderRadius: 4 }} />
          <Text style={styles.lbl} numberOfLines={1}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, marginTop: spacing.sm },
  col: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  val: { fontSize: 11, fontWeight: "700", color: colors.text, marginBottom: 2 },
  lbl: { fontSize: 10, color: colors.textMuted, marginTop: 3 },
});
