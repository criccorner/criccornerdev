import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Card from "../components/Card";
import { colors, spacing, typography } from "../utils/theme";

export default function FindScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.group}>LOOKING FOR</Text>
        <Pressable onPress={() => navigation.navigate("FindPlayers")} style={styles.row}>
          <Text style={typography.body}>🧢 A player</Text>
          <Text style={{ color: colors.textMuted }}>›</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("FindTeamToJoin")} style={styles.row}>
          <Text style={typography.body}>🤝 A team to join</Text>
          <Text style={{ color: colors.textMuted }}>›</Text>
        </Pressable>
        <Text style={styles.group}>AVAILABLE</Text>
        <Pressable onPress={() => navigation.navigate("FindTeams")} style={styles.row}>
          <Text style={typography.body}>🔎 Find available teams</Text>
          <Text style={{ color: colors.textMuted }}>›</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("FindGrounds")} style={styles.row}>
          <Text style={typography.body}>🏟️ Find available grounds</Text>
          <Text style={{ color: colors.textMuted }}>›</Text>
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  group: { fontSize: 11, fontWeight: "800", color: colors.textMuted, marginTop: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.md },
});
