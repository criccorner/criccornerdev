import React from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CopyrightFooter from "./CopyrightFooter";
import { colors, spacing, typography } from "../utils/theme";

export default function AuthLayout({ title, subtitle, children }) {
  const navigation = useNavigation();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>🏏 CricCorner</Text>
        <Text style={typography.h1}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.muted, { marginTop: spacing.xs, marginBottom: spacing.lg }]}>{subtitle}</Text>
        ) : (
          <View style={{ height: spacing.lg }} />
        )}
        {children}
        <View style={{ flex: 1 }} />
        <CopyrightFooter onOpenTerms={() => navigation.navigate("Legal")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: spacing.xl + spacing.lg, flexGrow: 1 },
  brand: { color: colors.primary, fontWeight: "800", fontSize: 16, marginBottom: spacing.md },
});
