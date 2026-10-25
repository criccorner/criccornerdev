import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, radius, spacing, design } from "../utils/theme";

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: design.cardBorder,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: design.shadowOpacity,
    shadowRadius: design.shadowRadius,
    shadowOffset: { width: 0, height: 2 },
    elevation: design.shadowOpacity > 0 ? Math.max(1, Math.round(design.shadowOpacity * 30)) : 0,
  },
});
