import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Button from "../components/Button";
import { createInnings } from "../utils/cricketEngine";
import SquadPicker from "../components/SquadPicker";
import { validateMatchSquads, squadFields, sideFromMatch } from "../utils/squads";

export default function MatchSetupScreen({ route, navigation }) {
  const { matchId } = route.params;
  const { matches, teams, players } = useAppState();
  const dispatch = useAppDispatch();

  const match = matches.find((m) => m.id === matchId);
  const teamA = teams.find((t) => t.id === match?.teamAId);
  const teamB = teams.find((t) => t.id === match?.teamBId);

  const [tossWinnerTeamId, setTossWinnerTeamId] = useState(match?.tossWinnerTeamId || null);
  const [tossDecision, setTossDecision] = useState(match?.tossDecision || null); // "bat" | "bowl"
  const [strikerId, setStrikerId] = useState(null);
  const [nonStrikerId, setNonStrikerId] = useState(null);
  const [bowlerId, setBowlerId] = useState(null);
  // Squads: use the ones chosen when scheduling; otherwise start from the full
  // teams, keeping anyone who is on both teams in Team A only.
  const [sideA, setSideA] = useState(() => sideFromMatch(match, "A", teamA?.playerIds || []));
  const [sideB, setSideB] = useState(() => {
    const a = sideFromMatch(match, "A", teamA?.playerIds || []).ids;
    return sideFromMatch(match, "B", (teamB?.playerIds || []).filter((id) => !a.includes(id)));
  });

  if (!match || !teamA || !teamB) return null;

  const battingFirstTeamId =
    tossWinnerTeamId && tossDecision
      ? tossDecision === "bat"
        ? tossWinnerTeamId
        : tossWinnerTeamId === teamA.id
        ? teamB.id
        : teamA.id
      : null;

  const bowlingFirstTeamId = battingFirstTeamId
    ? battingFirstTeamId === teamA.id
      ? teamB.id
      : teamA.id
    : null;

  const squadOf = (teamId) => (teamId === teamA.id ? sideA.ids : sideB.ids);
  const battingRoster = players.filter((p) => battingFirstTeamId && squadOf(battingFirstTeamId).includes(p.id));
  const bowlingRoster = players.filter((p) => bowlingFirstTeamId && squadOf(bowlingFirstTeamId).includes(p.id));

  const startMatch = () => {
    const squadError = validateMatchSquads(sideA, sideB, players);
    if (squadError) {
      Alert.alert("Check the squads", squadError);
      return;
    }
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
    const inBat = (id) => battingRoster.some((p) => p.id === id);
    if (!inBat(strikerId) || !inBat(nonStrikerId) || !bowlingRoster.some((p) => p.id === bowlerId)) {
      Alert.alert("Pick the openers again", "A chosen player is no longer in the squad.");
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
      keeperId: bowlingFirstTeamId === teamA.id ? sideA.keeperId : sideB.keeperId,
    });

    dispatch({
      type: "UPDATE_MATCH",
      payload: {
        matchId,
        changes: {
          tossWinnerTeamId,
          tossDecision,
          battingFirstTeamId,
          ...squadFields(sideA, sideB),
          status: "live",
          currentInnings: 1,
          innings1,
        },
      },
    });

    navigation.replace("LiveScoring", { matchId });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.h3}>Squads</Text>
      <Text style={typography.muted}>A player can only play for one team in a match. Pick a captain and wicketkeeper for each side.</Text>
      <SquadPicker title="Team A" team={teamA} players={players} value={sideA} matchId={match.id} onChange={setSideA} blockedIds={sideB.ids} />
      <SquadPicker title="Team B" team={teamB} players={players} value={sideB} matchId={match.id} onChange={setSideB} blockedIds={sideA.ids} />

      <View style={styles.divider} />
      <Text style={typography.h3}>Toss</Text>
      <Text style={typography.muted}>Who won the toss?</Text>
      <View style={styles.row}>
        {[teamA, teamB].map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTossWinnerTeamId(t.id)}
            style={[styles.chip, tossWinnerTeamId === t.id && styles.chipActive]}
          >
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
          <Text style={typography.h3}>
            Opening Batsmen ({teams.find((t) => t.id === battingFirstTeamId)?.name})
          </Text>
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
          <Text style={typography.h3}>
            Opening Bowler ({teams.find((t) => t.id === bowlingFirstTeamId)?.name})
          </Text>
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
        <Pressable
          key={p.id}
          disabled={p.id === exclude}
          onPress={() => onSelect(p.id)}
          style={[styles.chip, selected === p.id && styles.chipActive, p.id === exclude && styles.chipDisabled]}
        >
          <Text style={[styles.chipText, selected === p.id && { color: "#fff" }]}>{p.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDisabled: { opacity: 0.35 },
  chipText: { color: colors.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
});
