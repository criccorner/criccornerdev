import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radius, spacing, typography } from "../utils/theme";

export default function Button({ title, onPress, variant = "primary", disabled, loading, style }) {
  const isOutline = variant === "outline";
  const isDanger = variant === "danger";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isOutline && styles.outline,
        isDanger && styles.danger,
        !isOutline && !isDanger && styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && { opacity: 0.92, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : "#fff"} />
      ) : (
        <Text style={[typography.h3, { color: isOutline ? colors.primary : "#fff", letterSpacing: 0.2 }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    shadowColor: "#0E7A52",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: { opacity: 0.5 },
});
