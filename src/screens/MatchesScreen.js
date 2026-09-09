import React from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useAppState } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Button from "../components/Button";
import Card from "../components/Card";

const STATUS_COLORS = { scheduled: colors.info, live: colors.danger, completed: colors.success };

export default function MatchesScreen({ navigation }) {
  const { matches, teams } = useAppState();
  const sorted = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

  const openMatch = (m) => {
    if (m.status === "completed") navigation.navigate("Scorecard", { matchId: m.id });
    else if (m.status === "live") navigation.navigate("LiveScoring", { matchId: m.id });
    else navigation.navigate("MatchSetup", { matchId: m.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Button title="+ Schedule Match" onPress={() => navigation.navigate("ScheduleMatch")} />
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={<Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>No matches scheduled yet.</Text>}
        renderItem={({ item }) => {
          const teamA = teams.find((t) => t.id === item.teamAId);
          const teamB = teams.find((t) => t.id === item.teamBId);
          return (
            <Pressable onPress={() => openMatch(item)}>
              <Card>
                <View style={styles.rowTop}>
                  <Text style={typography.h3}>{teamA?.name} vs {teamB?.name}</Text>
                  <Text style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>{item.status.toUpperCase()}</Text>
                </View>
                <Text style={typography.muted}>{item.overs} overs · {item.venue || "Venue TBD"} · {new Date(item.date).toDateString()}</Text>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { padding: spacing.md, paddingBottom: 0 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  badge: { color: "#fff", fontSize: 10, fontWeight: "800", paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, overflow: "hidden" },
});
