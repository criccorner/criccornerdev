import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Card from "../../components/Card";
import { colors, spacing, typography } from "../../utils/theme";

// Cricket Marketplace home: browse what has been approved, or sell (one listing per person).
export default function MarketplaceScreen({ navigation }) {
  const Row = ({ label, hint, to }) => (
    <Pressable onPress={() => navigation.navigate(to)} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={typography.h3}>{label}</Text>
        <Text style={typography.muted}>{hint}</Text>
      </View>
      <Text style={{ color: colors.textMuted }}>›</Text>
    </Pressable>
  );
  return (
    <View style={styles.container}>
      <Card>
        <Row label="🛍️ Available Cricket Marketplace" hint="Stores, coaches, physios, clubs and more - by category" to="MarketplaceBrowse" />
        <Row label="💰 Sell" hint="List your product or service (one listing, approved by an admin)" to="MarketplaceSell" />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
});
