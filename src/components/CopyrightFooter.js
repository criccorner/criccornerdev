import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing } from "../utils/theme";
import { copyrightLine } from "../legal/content";

// One-line copyright notice with a link to the Terms. `onOpenTerms` decides how to get to the Terms screen.
export default function CopyrightFooter({ onOpenTerms }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{copyrightLine()}</Text>
      {onOpenTerms ? (
        <Pressable onPress={onOpenTerms} hitSlop={8}>
          <Text style={styles.link}>Terms of Use & Copyright</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: spacing.lg },
  text: { color: colors.textMuted, fontSize: 11, textAlign: "center" },
  link: { color: colors.primary, fontSize: 11, fontWeight: "700", marginTop: 2, textDecorationLine: "underline" },
});
