import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import FormField from "./FormField";
import { colors, spacing, radius, typography } from "../utils/theme";
import { STAGE_OPTIONS, OTHER, isPresetStage } from "../utils/stages";

// Pick which round of the tournament a match is: League match, Quarter Final, Semi Final, Final ... or your own name.
// `value` is the label (or null for a league match). `onChange(label | null)`.
export default function StagePicker({ value, onChange }) {
  const custom = !!value && !isPresetStage(value);
  const active = value || "League match";
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={typography.label}>ROUND</Text>
      <View style={styles.row}>
        {[...STAGE_OPTIONS, OTHER].map((o) => {
          const on = o === OTHER ? custom : !custom && active === o;
          return (
            <Pressable key={o} onPress={() => onChange(o === OTHER ? " " : o === "League match" ? null : o)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.text, on && { color: "#fff" }]}>{o === OTHER ? "Other…" : o}</Text>
            </Pressable>
          );
        })}
      </View>
      {custom ? (
        <FormField label="Round name" value={value === " " ? "" : value} onChangeText={(t) => onChange(t || " ")} placeholder="e.g. Pre-quarter Final" maxLength={30} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { color: colors.text, fontWeight: "600" },
});
