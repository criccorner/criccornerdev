import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../utils/theme";

// Two or three pill buttons, e.g. "My matches | Other matches". options: [[key, label], ...]
export default function SegmentedTabs({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map(([key, label]) => {
        const on = value === key;
        return (
          <Pressable key={key} onPress={() => onChange(key)} style={[styles.tab, on && styles.tabOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <Text style={[styles.text, on && styles.textOn]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", backgroundColor: colors.border, borderRadius: radius.pill, padding: 4, marginHorizontal: spacing.md, marginTop: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: "center" },
  tabOn: { backgroundColor: colors.primary },
  text: { color: colors.text, fontWeight: "700" },
  textOn: { color: "#fff" },
});
