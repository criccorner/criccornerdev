import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useAppState, useAllState, useAccess } from "../../context/AppContext";
import { useAuth } from "../../auth/AuthContext";
import { organizedBy, teamsOf, playerTitles } from "../../utils/playerInfo";
import { computePlayerStats } from "../../stats/playerStats";
import Avatar from "../../components/Avatar";
import Card from "../../components/Card";
import StatsView from "./StatsView";
import AnalyticsView from "./AnalyticsView";
import { colors, spacing, typography, radius } from "../../utils/theme";

// A player's profile and stats, opened by tapping his name (team roster, scorecard, players list).
export default function PlayerStatsScreen({ route, navigation }) {
  const { playerId } = route.params;
  const { canEdit } = useAccess();
  const { matches, teams } = useAppState();
  const all = useAllState();
  const everyone = all.players;
  const { user } = useAuth();
  const { myPlayerIds } = useAccess();
  const [tab, setTab] = useState("stats");
  const player = everyone.find((p) => p.id === playerId);
  const stats = useMemo(() => (player ? computePlayerStats({ matches, teams, playerId }) : null), [matches, teams, playerId, player]);

  const info = useMemo(() => {
    if (!player) return null;
    const mem = teamsOf(player.id, all.teams);
    const org = organizedBy(player.id, { tournaments: all.tournaments, owners: all._owners, me: user && user.id, myPlayerIds: myPlayerIds || new Set() });
    return { teams: mem, organized: org, titles: playerTitles(player, { teams: mem, matches: all.matches, organized: org }) };
  }, [player, all.teams, all.tournaments, all.matches, all._owners, user, myPlayerIds]);

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
            <View style={styles.titles}>
              {(info.titles.length ? info.titles : ["Player"]).map((t) => (
                <Text key={t} style={styles.titleChip}>{t}</Text>
              ))}
            </View>
          </View>
          {canEdit("players", playerId) ? (
            <Pressable onPress={() => navigation.navigate("Players", { screen: "EditPlayer", params: { playerId } })} hitSlop={8} style={styles.editBtn}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </Pressable>
          ) : null}
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
        <Card>
          <Text style={typography.label}>TEAMS</Text>
          {info.teams.length ? (
            info.teams.map((t) => (
              <Pressable key={t.id} onPress={() => navigation.navigate("Teams", { screen: "TeamDetail", params: { teamId: t.id } })} style={styles.linkRow}>
                <Text style={styles.linkText}>{t.name}</Text>
                <Text style={{ color: colors.textMuted }}>›</Text>
              </Pressable>
            ))
          ) : (
            <Text style={[typography.muted, { marginTop: 4 }]}>Not in any team yet.</Text>
          )}
          {info.organized.length ? (
            <>
              <Text style={[typography.label, { marginTop: spacing.md }]}>TOURNAMENTS ORGANIZED</Text>
              {info.organized.map((t) => (
                <Pressable key={t.id} onPress={() => navigation.navigate("Tournaments", { screen: "TournamentDetail", params: { tournamentId: t.id } })} style={styles.linkRow}>
                  <Text style={styles.linkText}>{t.name}</Text>
                  <Text style={{ color: colors.textMuted }}>›</Text>
                </Pressable>
              ))}
            </>
          ) : null}
        </Card>
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
  titles: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  titleChip: { color: "#fff", backgroundColor: "rgba(255,255,255,0.22)", fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, overflow: "hidden", marginRight: 6, marginTop: 2 },
  linkRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  linkText: { color: colors.primary, fontWeight: "700", flex: 1 },
  editBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  editBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  tabs: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: radius.pill, padding: 4, marginTop: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabText: { color: "#fff", fontWeight: "700" },
});
