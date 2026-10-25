import React from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../utils/theme";
import Card from "../components/Card";
import CopyrightFooter from "../components/CopyrightFooter";
import { termsSections, copyrightLine } from "../legal/content";

// Terms of Use & Copyright (also used inside the first-time notice).
export default function LegalScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={typography.h2}>Terms of Use & Copyright</Text>
      <Text style={[typography.muted, { marginBottom: spacing.md }]}>{copyrightLine()}</Text>
      {termsSections().map((s) => (
        <Card key={s.h}>
          <Text style={typography.h3}>{s.h}</Text>
          <Text style={styles.p}>{s.p}</Text>
        </Card>
      ))}
      <CopyrightFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  p: { color: colors.text, marginTop: spacing.xs, lineHeight: 21 },
});
