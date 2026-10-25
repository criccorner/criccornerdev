import React from "react";
import { View, Text, ScrollView } from "react-native";
import { colors, spacing, typography } from "../utils/theme";

// Shown if the two Supabase values haven't been pasted into src/cloud/config.js yet.
export default function SetupNeededScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingTop: 80 }}>
      <Text style={typography.h2}>One-time setup needed</Text>
      <Text style={[typography.body, { marginTop: spacing.md }]}>
        This app now saves everything online so all players share the same data. The developer still needs to connect it to the online database:
      </Text>
      <View style={{ marginTop: spacing.md }}>
        <Text style={typography.body}>1. Create a free project at supabase.com.</Text>
        <Text style={typography.body}>2. Run supabase/schema.sql in its SQL Editor.</Text>
        <Text style={typography.body}>3. Paste the Project URL and anon key into src/cloud/config.js.</Text>
        <Text style={typography.body}>4. Build the app again.</Text>
      </View>
      <Text style={[typography.muted, { marginTop: spacing.lg }]}>Full steps are in README-CLOUD.md.</Text>
    </ScrollView>
  );
}
