import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import FormField from "./FormField";
import { colors, spacing, radius } from "../utils/theme";
import { knownVenues } from "../utils/venues";

// Type a venue or tap one you used before.
export default function VenueField({ value, onChange, matches }) {
  const options = knownVenues(matches, value);
  return (
    <View>
      <FormField label="Venue" value={value} onChangeText={onChange} placeholder="Type a venue or pick one below" />
      {options.length ? (
        <View style={styles.row}>
          {options.map((v) => (
            <Pressable key={v} onPress={() => onChange(v)} style={styles.chip}>
              <Text style={styles.text}>📍 {v}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md, marginTop: -spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surface },
  text: { color: colors.text, fontWeight: "600" },
});
