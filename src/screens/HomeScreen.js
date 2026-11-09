import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import CopyrightFooter from "../components/CopyrightFooter";
import { useAppState, useAllState, useAccess } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Card from "../components/Card";
import GlobalSearch from "../components/GlobalSearch";
import NotificationBell from "../components/NotificationBell";

function StatBox({ label, value, onPress }) {
  const body = (
    <Card style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={typography.muted}>{label}</Text>
    </Card>
  );
  if (!onPress) return <View style={{ flex: 1 }}>{body}</View>;
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={`${label}: ${value}. Open ${label}`}>
      {body}
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { teams: allTeams } = useAppState();
  const { mine, createdByMe, canEdit } = useAccess();
  const all = useAllState();
  const { matches } = mine;
  const [searching, setSearching] = useState(false);
  const open = (tab, screen) => () => navigation.navigate(tab, { screen });
  const liveMatches = matches.filter((m) => m.status === "live");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>🏏 CricCorner</Text>
            <Text style={styles.subtitle}>Everything you need to run match day</Text>
          </View>
          <NotificationBell navigation={navigation} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <GlobalSearch navigation={navigation} onActive={setSearching} />
        {searching ? null : (
        <>
        <Text style={styles.sectionLabel}>ON CRICCORNER</Text>
        <View style={styles.statsRow}>
          <StatBox label="Players" value={all.players.length} />
          <StatBox label="Teams" value={all.teams.length} />
          <StatBox label="Tournaments" value={all.tournaments.length} />
        </View>
        <Text style={styles.sectionLabel}>CREATED BY ME</Text>
        <View style={styles.statsRow}>
          <StatBox label="Players" value={createdByMe.players.length} onPress={open("Players", "PlayersList")} />
          <StatBox label="Teams" value={createdByMe.teams.length} onPress={open("Teams", "TeamsList")} />
          <StatBox label="Tournaments" value={createdByMe.tournaments.length} onPress={open("Tournaments", "TournamentsList")} />
        </View>

        {liveMatches.length > 0 && (
          <Card>
            <Text style={typography.h3}>🔴 Live now</Text>
            {liveMatches.map((m) => {
              const teamA = allTeams.find((t) => t.id === m.teamAId);
              const teamB = allTeams.find((t) => t.id === m.teamBId);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => navigation.navigate("Matches", { screen: canEdit("matches", m.id) ? "LiveScoring" : "Scorecard", params: { matchId: m.id } })}
                  style={styles.liveRow}
                >
                  <Text style={typography.body}>
                    {teamA?.name} vs {teamB?.name}
                  </Text>
                  <Text style={{ color: colors.danger, fontWeight: "700" }}>LIVE ›</Text>
                </Pressable>
              );
            })}
          </Card>
        )}

        <Card>
          <Text style={typography.h3}>Quick actions</Text>
          <View style={{ height: spacing.sm }} />
          <QuickAction label="➕ Add a player" onPress={() => navigation.navigate("Players", { screen: "AddPlayer" })} />
          <QuickAction label="👥 Create a team" onPress={() => navigation.navigate("Teams", { screen: "CreateTeam" })} />
          <QuickAction label="🗓️ Schedule a match" onPress={() => navigation.navigate("Matches", { screen: "ScheduleMatch" })} />
          <QuickAction label="🏆 Create a tournament" onPress={() => navigation.navigate("Tournaments", { screen: "CreateTournament" })} />
        </Card>
        <CopyrightFooter onOpenTerms={() => navigation.navigate("Profile", { screen: "Legal" })} />
        </>
        )}
      </ScrollView>
    </View>
  );
}

function QuickAction({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.quickAction}>
      <Text style={typography.body}>{label}</Text>
      <Text style={{ color: colors.textMuted }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: "#fff" },
  subtitle: { color: "#CFE3D8", marginTop: spacing.xs },
  body: { padding: spacing.md },
  sectionLabel: { color: colors.textMuted, fontWeight: "800", fontSize: 11, letterSpacing: 0.8, marginTop: spacing.sm, marginBottom: spacing.xs },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
  liveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  quickAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
