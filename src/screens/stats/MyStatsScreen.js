import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { useAppState } from "../../context/AppContext";
import { computePlayerStats } from "../../stats/playerStats";
import { findMyPlayer } from "../../auth/identity";
import { playerUsage } from "../../players/playerOps";
import { photoUriFor } from "../../profile/store";
import Avatar from "../../components/Avatar";
import Card from "../../components/Card";
import StatsView from "./StatsView";
import AnalyticsView from "./AnalyticsView";
import { colors, spacing, typography, radius } from "../../utils/theme";

export default function MyStatsScreen({ navigation }) {
  const { user } = useAuth();
  const { matches, teams, players } = useAppState();
  const [tab, setTab] = useState("stats");

  // "Me" = the player in this workspace that matches the logged-in account.
  // Linked by mobile number / email (any formatting). If duplicates exist, the one in use wins.
  const me = findMyPlayer(players, user, (id) => playerUsage(id, { teams, matches }).used);
  const stats = useMemo(() => (me ? computePlayerStats({ matches, teams, playerId: me.id }) : null), [matches, teams, me && me.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Avatar uri={photoUriFor(user)} name={user.name} size={46} />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={styles.title}>{user.name}</Text>
            <Text style={styles.subtitle}>{user.role} · My Stats</Text>
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
        {me ? (
          <Text style={[typography.muted, { marginBottom: spacing.sm }]}>
            Linked player: <Text style={{ fontWeight: "700", color: colors.text }}>{me.name}</Text> ({user.email || user.identifier})
          </Text>
        ) : null}
        {stats && !stats.hasData ? (
          <Card style={{ backgroundColor: "#FFF6DB", borderColor: colors.accent }}>
            <Text style={typography.body}>
              No matches found for this player yet. Stats are linked to your account by your email or mobile number. Make sure your mobile number in Edit Profile matches your player entry.
            </Text>
            <Pressable onPress={() => navigation.navigate("Profile", { screen: user.isAdmin ? "FixContacts" : "EditProfile" })} style={{ marginTop: spacing.sm }}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>{user.isAdmin ? "🛠️ Fix duplicate contacts" : "✏️ Check my profile"}</Text>
            </Pressable>
          </Card>
        ) : null}
        {!stats ? (
          <Card>
            <Text style={typography.h3}>No player profile found</Text>
            <Text style={[typography.muted, { marginTop: spacing.xs }]}>Add yourself on the Players tab, then add yourself to a team to start building stats.</Text>
          </Card>
        ) : tab === "stats" ? (
          <StatsView stats={stats} />
        ) : (
          <AnalyticsView stats={stats} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 20, fontWeight: "800", color: "#fff" },
  subtitle: { color: "#CFE3D8", marginTop: 2 },
  tabs: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: radius.pill, padding: 4, marginTop: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabText: { color: "#fff", fontWeight: "700" },
});
