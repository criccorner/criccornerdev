import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useAppState, useAccess } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import { stageTag } from "../utils/stages";
import Button from "../components/Button";
import Card from "../components/Card";
import SegmentedTabs from "../components/SegmentedTabs";

const STATUS_COLORS = {
  scheduled: colors.info,
  live: colors.danger,
  completed: colors.success,
};

export default function MatchesScreen({ navigation }) {
  const { teams } = useAppState();
  const { mine, other, canEdit } = useAccess();
  const [view, setView] = useState("mine");
  const list = view === "mine" ? mine.matches : other.matches;
  const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

  const openMatch = (m) => {
    // Only the people who may change a match open its scoring / setup screens; everyone else watches the scorecard.
    if (m.status === "completed" || !canEdit("matches", m.id)) navigation.navigate("Scorecard", { matchId: m.id });
    else if (m.status === "live") navigation.navigate("LiveScoring", { matchId: m.id });
    else navigation.navigate("MatchSetup", { matchId: m.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Button title="+ Schedule Match" onPress={() => navigation.navigate("ScheduleMatch")} />
      </View>
      <SegmentedTabs options={[["mine", `My matches (${mine.matches.length})`], ["other", `Other matches (${other.matches.length})`]]} value={view} onChange={setView} />
      <FlatList
        data={sorted}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>
            {view === "mine" ? "No matches scheduled yet." : "No other matches yet."}
          </Text>
        }
        renderItem={({ item }) => {
          const teamA = teams.find((t) => t.id === item.teamAId);
          const teamB = teams.find((t) => t.id === item.teamBId);
          return (
            <Pressable onPress={() => openMatch(item)}>
              <Card>
                <View style={styles.rowTop}>
                  <Text style={[typography.h3, { flex: 1, marginRight: spacing.sm }]}>
                    {teamA?.name} vs {teamB?.name}
                  </Text>
                  <Text style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                {stageTag(item) ? <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 12 }}>{stageTag(item).toUpperCase()}</Text> : null}
                <Text style={typography.muted}>
                  {item.overs} overs · {item.venue || "Venue TBD"} · {new Date(item.date).toDateString()}
                </Text>
                {item.status === "completed" && item.result ? <Text style={styles.result}>🏆 {item.result}</Text> : null}
                {item.status !== "completed" && canEdit("matches", item.id) ? (
                  <Pressable onPress={() => navigation.navigate("EditMatch", { matchId: item.id })} hitSlop={8} style={{ marginTop: spacing.sm }}>
                    <Text style={{ color: colors.primary, fontWeight: "700" }}>✏️ Edit match details</Text>
                  </Pressable>
                ) : null}
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
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  result: { color: colors.success, fontWeight: "800", marginTop: 4 },
  badge: { flexShrink: 0, color: "#fff", fontSize: 10, fontWeight: "800", paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, overflow: "hidden" },
});
