import React, { useState } from "react";
import { matchWhen } from "../utils/datetime";
import { View, Text, FlatList, StyleSheet, Pressable, Alert } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { newId } from "../utils/id";
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
  const { mine, canEdit, mayDelete, mayClone, mayScore } = useAccess();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState("upcoming");
  const when = (m) => `${String(m.date || "").slice(0, 10)} ${m.time || "00:00"}`;
  const upcoming = mine.matches.filter((m) => m.status !== "completed").sort((a, b) => when(a).localeCompare(when(b)));
  const past = mine.matches.filter((m) => m.status === "completed").sort((a, b) => when(b).localeCompare(when(a)));
  const sorted = tab === "upcoming" ? upcoming : past;

  const openMatch = (m) => {
    // Only the people who may change a match open its scoring / setup screens; everyone else watches the scorecard.
    if (m.status === "completed" || !mayScore(m)) navigation.navigate("Scorecard", { matchId: m.id });
    else if (m.status === "live") navigation.navigate("LiveScoring", { matchId: m.id });
    else navigation.navigate("MatchSetup", { matchId: m.id });
  };

  const confirmDelete = (m, name) =>
    Alert.alert("Delete this match?", `${name} will be removed for everyone. This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => dispatch({ type: "DELETE_MATCH", payload: { matchId: m.id } }) },
    ]);
  const clone = (m) => {
    const id = newId("match");
    dispatch({ type: "CLONE_MATCH", payload: { matchId: m.id, newId: id } });
    navigation.navigate("EditMatch", { matchId: id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Button title="+ Schedule Match" onPress={() => navigation.navigate("ScheduleMatch")} />
      </View>
      <SegmentedTabs
        options={[["upcoming", `Upcoming (${upcoming.length})`], ["past", `Past (${past.length})`]]}
        value={tab}
        onChange={setTab}
      />
      <FlatList
        data={sorted}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>
            {tab === "upcoming" ? "No upcoming matches. Tap Schedule Match to add one." : "No finished matches yet."}
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
                  {item.overs} overs · {item.venue || "Venue TBD"} · {matchWhen(item)}
                </Text>
                {item.status === "completed" && item.result ? <Text style={styles.result}>🏆 {item.result}</Text> : null}
                <View style={styles.links}>
                  {item.status !== "completed" && mayClone(item.id) ? (
                    <Pressable onPress={() => navigation.navigate("EditMatch", { matchId: item.id })} hitSlop={8}>
                      <Text style={styles.link}>✏️ Edit match details</Text>
                    </Pressable>
                  ) : null}
                  {mayClone(item.id) ? (
                    <Pressable onPress={() => clone(item)} hitSlop={8}>
                      <Text style={styles.link}>⧉ Clone</Text>
                    </Pressable>
                  ) : null}
                  {mayDelete("matches", item.id) ? (
                    <Pressable onPress={() => confirmDelete(item, `${teamA?.name} vs ${teamB?.name}`)} hitSlop={8}>
                      <Text style={[styles.link, { color: colors.danger }]}>🗑 Delete</Text>
                    </Pressable>
                  ) : null}
                </View>
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
  links: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginTop: spacing.sm },
  link: { color: colors.primary, fontWeight: "700" },
  result: { color: colors.success, fontWeight: "800", marginTop: 4 },
  badge: { flexShrink: 0, color: "#fff", fontSize: 10, fontWeight: "800", paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, overflow: "hidden" },
});
