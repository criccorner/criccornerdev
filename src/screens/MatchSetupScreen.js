import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Button from "../components/Button";
import { createInnings } from "../utils/cricketEngine";

export default function MatchSetupScreen({ route, navigation }) {
  const { matchId } = route.params;
  const { matches, teams, players } = useAppState();
  const dispatch = useAppDispatch();

  const match = matches.find((m) => m.id === matchId);
  const teamA = teams.find((t) => t.id === match?.teamAId);
  const teamB = teams.find((t) => t.id === match?.teamBId);

  const [tossWinnerTeamId, setTossWinnerTeamId] = useState(match?.tossWinnerTeamId || null);
  const [tossDecision, setTossDecision] = useState(match?.tossDecision || null);
  const [strikerId, setStrikerId] = useState(null);
  const [nonStrikerId, setNonStrikerId] = useState(null);
  const [bowlerId, setBowlerId] = useState(null);

  if (!match || !teamA || !teamB) return null;

  const battingFirstTeamId =
    tossWinnerTeamId && tossDecision
      ? tossDecision === "bat"
        ? tossWinnerTeamId
        : tossWinnerTeamId === teamA.id
        ? teamB.id
        : teamA.id
      : null;

  const bowlingFirstTeamId = battingFirstTeamId ? (battingFirstTeamId === teamA.id ? teamB.id : teamA.id) : null;

  const battingRoster = players.filter((p) => teams.find((t) => t.id === battingFirstTeamId)?.playerIds.includes(p.id));
  const bowlingRoster = players.filter((p) => teams.find((t) => t.id === bowlingFirstTeamId)?.playerIds.includes(p.id));

  const startMatch = () => {
    if (!tossWinnerTeamId || !tossDecision) {
      Alert.alert("Complete the toss first");
      return;
    }
    if (!strikerId || !nonStrikerId || strikerId === nonStrikerId) {
      Alert.alert("Pick two different opening batsmen");
      return;
    }
    if (!bowlerId) {
      Alert.alert("Pick the opening bowler");
      return;
    }

    const innings1 = createInnings({
      battingTeamId: battingFirstTeamId,
      bowlingTeamId: bowlingFirstTeamId,
      strikerId,
      nonStrikerId,
      bowlerId,
      totalOvers: match.overs,
      target: null,
    });

    dispatch({
      type: "UPDATE_MATCH",
      payload: {
        matchId,
        changes: { tossWinnerTeamId, tossDecision, battingFirstTeamId, status: "live", currentInnings: 1, innings1 },
      },
    });

    navigation.replace("LiveScoring", { matchId });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.h3}>Toss</Text>
      <Text style={typography.muted}>Who won the toss?</Text>
      <View style={styles.row}>
        {[teamA, teamB].map((t) => (
          <Pressable key={t.id} onPress={() => setTossWinnerTeamId(t.id)} style={[styles.chip, tossWinnerTeamId === t.id && styles.chipActive]}>
            <Text style={[styles.chipText, tossWinnerTeamId === t.id && { color: "#fff" }]}>{t.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[typography.muted, { marginTop: spacing.md }]}>Elected to</Text>
      <View style={styles.row}>
        {["bat", "bowl"].map((d) => (
          <Pressable key={d} onPress={() => setTossDecision(d)} style={[styles.chip, tossDecision === d && styles.chipActive]}>
            <Text style={[styles.chipText, tossDecision === d && { color: "#fff" }]}>{d === "bat" ? "Bat First" : "Bowl First"}</Text>
          </Pressable>
        ))}
      </View>

      {battingFirstTeamId && (
        <>
          <View style={styles.divider} />
          <Text style={typography.h3}>Opening Batsmen ({teams.find((t) => t.id === battingFirstTeamId)?.name})</Text>
          {battingRoster.length < 2 ? (
            <Text style={typography.muted}>This team needs at least 2 players on its roster.</Text>
          ) : (
            <>
              <Text style={typography.muted}>Striker</Text>
              <PlayerRow players={battingRoster} selected={strikerId} onSelect={setStrikerId} exclude={nonStrikerId} />
              <Text style={[typography.muted, { marginTop: spacing.sm }]}>Non-striker</Text>
              <PlayerRow players={battingRoster} selected={nonStrikerId} onSelect={setNonStrikerId} exclude={strikerId} />
            </>
          )}

          <View style={styles.divider} />
          <Text style={typography.h3}>Opening Bowler ({teams.find((t) => t.id === bowlingFirstTeamId)?.name})</Text>
          {bowlingRoster.length < 1 ? (
            <Text style={typography.muted}>This team needs at least 1 player on its roster.</Text>
          ) : (
            <PlayerRow players={bowlingRoster} selected={bowlerId} onSelect={setBowlerId} />
          )}
        </>
      )}

      <View style={{ height: spacing.lg }} />
      <Button title="Start Match" onPress={startMatch} />
    </ScrollView>
  );
}

function PlayerRow({ players, selected, onSelect, exclude }) {
  return (
    <View style={styles.row}>
      {players.map((p) => (
        <Pressable key={p.id} disabled={p.id === exclude} onPress={() => onSelect(p.id)} style={[styles.chip, selected === p.id && styles.chipActive, p.id === exclude && styles.chipDisabled]}>
          <Text style={[styles.chipText, selected === p.id && { color: "#fff" }]}>{p.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDisabled: { opacity: 0.35 },
  chipText: { color: colors.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
});
