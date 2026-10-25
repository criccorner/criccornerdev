import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, typography, radius } from "../utils/theme";
import { ZONES, SHOTS, zonePoint, shotByKey } from "../utils/shots";

const SIZE = 250;
const BUBBLE = 62;

// Shot chips + a wagon wheel to tap. Everything is optional.
//   value = { shot, zone }, hand = "R" | "L"
export default function ShotPicker({ value, onChange, hand = "R", onHand, onZonePress }) {
  const shot = shotByKey(value.shot);
  const likely = new Set(shot ? shot.towards : []);
  return (
    <View>
      <Text style={typography.label}>SHOT (OPTIONAL)</Text>
      <View style={styles.chipRow}>
        {SHOTS.map((s) => (
          <Pressable key={s.key} onPress={() => onChange({ ...value, shot: value.shot === s.key ? null : s.key })} style={[styles.chip, value.shot === s.key && styles.chipActive]}>
            <Text style={[styles.chipText, value.shot === s.key && { color: "#fff" }]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.handRow}>
        <Text style={typography.label}>WHERE DID IT GO?</Text>
        <Pressable onPress={() => onHand && onHand(hand === "R" ? "L" : "R")} style={styles.handBtn}>
          <Text style={styles.handText}>{hand === "L" ? "Left-hander" : "Right-hander"} ⇄</Text>
        </Pressable>
      </View>
      <View style={[styles.wheel, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]}>
        <View style={styles.pitch} />
        <Text style={styles.bowler}>bowler ↑</Text>
        {ZONES.map((z) => {
          const p = zonePoint(z, hand, SIZE);
          const active = value.zone === z.key;
          return (
            <Pressable
              key={z.key}
              onPress={() => (onZonePress ? onZonePress(z.key) : onChange({ ...value, zone: active ? null : z.key }))}
              style={[styles.zone, { left: p.x - BUBBLE / 2, top: p.y - BUBBLE / 2 }, likely.has(z.key) && styles.zoneLikely, active && styles.zoneActive]}
            >
              <Text style={[styles.zoneText, active && { color: "#fff" }]}>{z.label}</Text>
              <Text style={[styles.zoneSide, active && { color: "#fff" }]}>{z.side}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600", fontSize: 12 },
  handRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md, marginBottom: spacing.sm },
  handBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },
  handText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  wheel: { alignSelf: "center", borderWidth: 2, borderColor: colors.border, backgroundColor: "#E8F3EA" },
  pitch: { position: "absolute", left: SIZE / 2 - 9, top: SIZE / 2 - 38, width: 18, height: 76, backgroundColor: "#D9C79E", borderRadius: 3 },
  bowler: { position: "absolute", top: 4, alignSelf: "center", fontSize: 10, color: colors.textMuted },
  zone: { position: "absolute", width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  zoneLikely: { borderColor: colors.accent, borderWidth: 2 },
  zoneActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  zoneText: { fontSize: 10, fontWeight: "700", color: colors.text, textAlign: "center" },
  zoneSide: { fontSize: 9, color: colors.textMuted },
});
