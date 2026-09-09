import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAppState } from "../context/AppContext";
import { colors, spacing, typography } from "../utils/theme";
import Card from "../components/Card";
import SponsorBanner from "../components/SponsorBanner";
import { computeInningsSummary } from "../utils/cricketEngine";

function InningsCard({ title, innings, players }) {
  if (!innings) return null;
  const s = computeInningsSummary(innings);
  const battingRows = Object.entries(s.batsmenStats).map(([id, stats]) => ({
    id,
    name: players.find((p) => p.id === id)?.name || "Unknown",
    ...stats,
  }));
  const bowlingRows = Object.entries(s.bowlerStats).map(([id, stats]) => ({
    id,
    name: players.find((p) => p.id === id)?.name || "Unknown",
    ...stats,
  }));

  return (
    <Card>
      <Text style={typography.h3}>{title}</Text>
      <Text style={styles.inningsScore}>
        {s.totalRuns}/{s.wickets} ({s.oversDisplay} ov)
      </Text>

      <Text style={[typography.label, { marginTop: spacing.md }]}>BATTING</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Batsman</Text>
        <Text style={styles.th}>R</Text>
        <Text style={styles.th}>B</Text>
        <Text style={styles.th}>4s</Text>
        <Text style={styles.th}>6s</Text>
      </View>
      {battingRows.map((b) => (
        <View key={b.id} style={styles.tableRow}>
          <Text style={[styles.td, { flex: 2 }]}>
            {b.name}
            {b.out ? <Text style={typography.muted}> ({b.howOut})</Text> : <Text style={typography.muted}> (not out)</Text>}
          </Text>
          <Text style={styles.td}>{b.runs}</Text>
          <Text style={styles.td}>{b.balls}</Text>
          <Text style={styles.td}>{b.fours}</Text>
          <Text style={styles.td}>{b.sixes}</Text>
        </View>
      ))}

      <Text style={[typography.label, { marginTop: spacing.md }]}>BOWLING</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Bowler</Text>
        <Text style={styles.th}>O</Text>
        <Text style={styles.th}>R</Text>
        <Text style={styles.th}>W</Text>
      </View>
      {bowlingRows.map((b) => (
        <View key={b.id} style={styles.tableRow}>
          <Text style={[styles.td, { flex: 2 }]}>{b.name}</Text>
          <Text style={styles.td}>{Math.floor(b.balls / 6)}.{b.balls % 6}</Text>
          <Text style={styles.td}>{b.runs}</Text>
          <Text style={styles.td}>{b.wickets}</Text>
        </View>
      ))}

      <Text style={[typography.muted, { marginTop: spacing.sm }]}>
        Extras: {s.totalExtras} (wd {s.extrasBreakdown.wide}, nb {s.extrasBreakdown.noball}, b {s.extrasBreakdown.bye}, lb {s.extrasBreakdown.legbye})
      </Text>
    </Card>
  );
}

export default function ScorecardScreen({ route }) {
  const { matchId } = route.params;
  const { matches, teams, players, tournaments } = useAppState();
  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  const teamA = teams.find((t) => t.id === match.teamAId);
  const teamB = teams.find((t) => t.id === match.teamBId);
  const tournament = tournaments.find((t) => t.id === match.tournamentId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SponsorBanner tournament={tournament} />
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Card style={{ alignItems: "center" }}>
          <Text style={typography.h2}>
            {teamA?.name} vs {teamB?.name}
          </Text>
          <Text style={typography.muted}>{match.venue || "Venue TBD"} · {new Date(match.date).toDateString()}</Text>
          {match.result && <Text style={styles.result}>{match.result}</Text>}
        </Card>

        <InningsCard title={`${teams.find((t) => t.id === match.innings1?.battingTeamId)?.name} - Innings 1`} innings={match.innings1} players={players} />
        <InningsCard title={`${teams.find((t) => t.id === match.innings2?.battingTeamId)?.name} - Innings 2`} innings={match.innings2} players={players} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  inningsScore: { fontSize: 24, fontWeight: "800", color: colors.primary, marginTop: 4 },
  result: { marginTop: spacing.sm, color: colors.success, fontWeight: "700" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4, marginTop: 4 },
  th: { flex: 1, fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  td: { flex: 1, fontSize: 13, color: colors.text },
});
