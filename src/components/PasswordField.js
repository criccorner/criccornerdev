import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { colors, spacing, typography, radius } from "../utils/theme";

// A password box with a 👁 button to show or hide what you typed. Takes the same props as FormField.
export default function PasswordField({ label, error, style, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, error ? { borderColor: colors.danger || "#E5252A" } : null]}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          {...rest}
          secureTextEntry={!show}
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} style={styles.eye} accessibilityRole="button" accessibilityLabel={show ? "Hide password" : "Show password"}>
          <Text style={{ fontSize: 20, opacity: show ? 1 : 0.55 }}>{show ? "🙈" : "👁️"}</Text>
        </Pressable>
      </View>
      {error ? <Text style={{ color: colors.danger || "#E5252A", fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, color: colors.text, marginBottom: 6, fontWeight: "600" },
  box: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
  eye: { paddingLeft: spacing.sm },
});
