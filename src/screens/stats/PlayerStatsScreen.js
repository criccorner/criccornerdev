import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useAppState, useAllState } from "../../context/AppContext";
import { computePlayerStats } from "../../stats/playerStats";
import Avatar from "../../components/Avatar";
import Card from "../../components/Card";
import StatsView from "./StatsView";
import AnalyticsView from "./AnalyticsView";
import { colors, spacing, typography, radius } from "../../utils/theme";

// Any player's stats, opened by tapping his name (for example on a team's roster).
export default function PlayerStatsScreen({ route }) {
  const { playerId } = route.params;
  const { matches, teams } = useAppState();
  const everyone = useAllState().players;
  const [tab, setTab] = useState("stats");
  const player = everyone.find((p) => p.id === playerId);
  const stats = useMemo(() => (player ? computePlayerStats({ matches, teams, playerId }) : null), [matches, teams, playerId, player]);

  if (!player) {
    return (
      <View style={styles.container}>
        <Card style={{ margin: spacing.md }}><Text style={typography.body}>This player could not be found.</Text></Card>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Avatar uri={player.photoUrl || null} name={player.name} size={46} />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={styles.title}>{player.name}</Text>
            <Text style={styles.subtitle}>{player.role && player.role !== "Player" ? `${player.role} · ` : ""}Player stats</Text>
          </View>
        </View>
        <View style={styles.tabs}>
          {[["stats", "Stats"], ["analytics", "Analytics"]].map(([key, label]) => (
            <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}>
              <Text style={[styles.tabText, tab === key && { color: colors.primary }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        {tab === "stats" ? <StatsView stats={stats} /> : <AnalyticsView stats={stats} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: 20, fontWeight: "800", color: "#fff" },
  subtitle: { color: "#CFE3D8", marginTop: 2 },
  tabs: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: radius.pill, padding: 4, marginTop: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabText: { color: "#fff", fontWeight: "700" },
});
