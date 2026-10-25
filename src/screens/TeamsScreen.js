import React from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useAppState, useAccess } from "../context/AppContext";
import { colors, spacing, typography } from "../utils/theme";
import Button from "../components/Button";
import Card from "../components/Card";
import { TeamLogo, RecordRow } from "../components/TeamExtras";
import { teamRecord } from "../stats/awards";

export default function TeamsScreen({ navigation }) {
  const { players, matches } = useAppState();
  const { mine } = useAccess();
  const teams = mine.teams;

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Button title="+ Create Team" onPress={() => navigation.navigate("CreateTeam")} />
      </View>
      <FlatList
        data={teams}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>
            No teams yet. Create one to start scheduling matches.
          </Text>
        }
        renderItem={({ item }) => {
          const owner = players.find((p) => p.id === item.ownerId);
          const pendingCount = item.joinRequests.filter((r) => r.status === "pending").length;
          return (
            <Pressable onPress={() => navigation.navigate("TeamDetail", { teamId: item.id })}>
              <Card>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TeamLogo team={item} size={46} />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={typography.h3}>{item.name}</Text>
                <Text style={typography.muted}>
                  {item.playerIds.length} player{item.playerIds.length === 1 ? "" : "s"} · Owner:{" "}
                  {owner?.name || "Unassigned"}
                </Text>
                  </View>
                </View>
                <RecordRow record={teamRecord(matches, item.id)} compact />
                {pendingCount > 0 && (
                  <Text style={[typography.muted, { color: colors.accent, marginTop: 4 }]}>
                    {pendingCount} pending join request{pendingCount === 1 ? "" : "s"}
                  </Text>
                )}
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
});
