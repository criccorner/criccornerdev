import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";

export default function TournamentDetailScreen({ route, navigation }) {
  const { tournamentId } = route.params;
  const { tournaments, matches, teams } = useAppState();
  const dispatch = useAppDispatch();
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorTagline, setSponsorTagline] = useState("");

  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) return null;

  const tournamentMatches = matches.filter((m) => tournament.matchIds.includes(m.id));

  const addSponsor = () => {
    if (!sponsorName.trim()) return;
    dispatch({
      type: "ADD_SPONSOR_TO_TOURNAMENT",
      payload: { tournamentId, sponsor: { name: sponsorName.trim(), tagline: sponsorTagline.trim() || null } },
    });
    setSponsorName("");
    setSponsorTagline("");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={typography.h2}>{tournament.name}</Text>
      <Text style={typography.muted}>
        {tournament.startDate}
        {tournament.endDate ? ` – ${tournament.endDate}` : ""}
      </Text>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={typography.h3}>Sponsors</Text>
        <Text style={[typography.muted, { marginBottom: spacing.sm }]}>
          Sponsors added here appear on the scoreboard of every match in this tournament.
        </Text>
        {tournament.sponsors.map((s) => (
          <View key={s.id} style={styles.sponsorRow}>
            <View style={styles.sponsorDot} />
            <View>
              <Text style={typography.body}>{s.name}</Text>
              {s.tagline && <Text style={typography.muted}>{s.tagline}</Text>}
            </View>
          </View>
        ))}
        <View style={{ height: spacing.sm }} />
        <FormField label="Sponsor Name" value={sponsorName} onChangeText={setSponsorName} placeholder="e.g. Acme Sports" />
        <FormField label="Tagline (optional)" value={sponsorTagline} onChangeText={setSponsorTagline} placeholder="e.g. Official Kit Partner" />
        <Button title="+ Add Sponsor" onPress={addSponsor} />
      </Card>

      <Card>
        <View style={styles.matchesHeader}>
          <Text style={typography.h3}>Matches</Text>
          <Pressable onPress={() => navigation.navigate("ScheduleMatch", { tournamentId })}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>+ Schedule</Text>
          </Pressable>
        </View>
        {tournamentMatches.length === 0 ? (
          <Text style={typography.muted}>No matches scheduled in this tournament yet.</Text>
        ) : (
          tournamentMatches.map((m) => {
            const teamA = teams.find((t) => t.id === m.teamAId);
            const teamB = teams.find((t) => t.id === m.teamBId);
            return (
              <Pressable
                key={m.id}
                style={styles.matchRow}
                onPress={() =>
                  navigation.navigate(
                    m.status === "completed" ? "Scorecard" : m.status === "live" ? "LiveScoring" : "MatchSetup",
                    { matchId: m.id }
                  )
                }
              >
                <Text style={typography.body}>
                  {teamA?.name} vs {teamB?.name}
                </Text>
                <Text style={typography.muted}>{m.status}</Text>
              </Pressable>
            );
          })
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sponsorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  sponsorDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.accent, marginRight: spacing.sm },
  matchesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  matchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
});
