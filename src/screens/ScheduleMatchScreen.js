import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import FormField from "../components/FormField";
import Button from "../components/Button";
import { newId } from "../utils/id";
import SquadPicker from "../components/SquadPicker";
import { validateMatchSquads, squadFields } from "../utils/squads";
import StagePicker from "../components/StagePicker";
import { cleanStage } from "../utils/stages";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ScheduleMatchScreen({ navigation, route }) {
  const { players } = useAppState();
  const { mine, canEdit } = useAccess();
  // You schedule matches between your own teams, and only add them to tournaments you run.
  const teams = mine.teams;
  const tournaments = mine.tournaments.filter((t) => canEdit("tournaments", t.id));
  const dispatch = useAppDispatch();
  const presetTournamentId = route?.params?.tournamentId || null;

  const [teamAId, setTeamAId] = useState(null);
  const [teamBId, setTeamBId] = useState(null);
  const [overs, setOvers] = useState("20");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState(todayIso());
  const [tournamentId, setTournamentId] = useState(presetTournamentId);
  const [stage, setStage] = useState(null); // Quarter Final, Semi Final ... (tournament matches only)
  const emptySide = { ids: [], captainId: null, keeperId: null };
  const [sideA, setSideA] = useState(emptySide);
  const [sideB, setSideB] = useState(emptySide);

  // Picking a team pre-selects its players, except anyone already in the other squad.
  const playersOf = (teamId) => (teams.find((t) => t.id === teamId)?.playerIds || []).filter((id) => players.some((p) => p.id === id));
  const chooseTeamA = (id) => {
    setTeamAId(id);
    setSideA({ ids: playersOf(id).filter((pid) => !sideB.ids.includes(pid)), captainId: null, keeperId: null });
  };
  const chooseTeamB = (id) => {
    setTeamBId(id);
    setSideB({ ids: playersOf(id).filter((pid) => !sideA.ids.includes(pid)), captainId: null, keeperId: null });
  };

  const submit = () => {
    if (!teamAId || !teamBId) {
      Alert.alert("Pick both teams");
      return;
    }
    if (teamAId === teamBId) {
      Alert.alert("Teams must be different");
      return;
    }
    const oversNum = parseInt(overs, 10);
    if (!Number.isInteger(oversNum) || oversNum < 1 || oversNum > 50) {
      Alert.alert("Invalid overs", "Overs must be a whole number between 1 and 50.");
      return;
    }

    const squadError = validateMatchSquads(sideA, sideB, players);
    if (squadError) {
      Alert.alert("Check the squads", squadError);
      return;
    }

    const matchId = newId("match");
    const payload = {
      id: matchId,
      name: null,
      teamAId,
      teamBId,
      overs: oversNum,
      venue: venue.trim() || null,
      date,
      tournamentId: tournamentId || null,
      stage: tournamentId ? cleanStage(stage) : null,
      ...squadFields(sideA, sideB),
    };

    dispatch({ type: "SCHEDULE_MATCH", payload });
    if (tournamentId) {
      dispatch({ type: "ATTACH_MATCH_TO_TOURNAMENT", payload: { tournamentId, matchId } });
    }
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.label}>TEAM A</Text>
      <TeamPicker teams={teams} selected={teamAId} onSelect={chooseTeamA} exclude={teamBId} />

      <Text style={[typography.label, { marginTop: spacing.md }]}>TEAM B</Text>
      <TeamPicker teams={teams} selected={teamBId} onSelect={chooseTeamB} exclude={teamAId} />

      {teamAId && teamBId ? (
        <>
          <Text style={[typography.label, { marginTop: spacing.md }]}>SQUADS</Text>
          <Text style={typography.muted}>Choose who plays, then the captain and wicketkeeper of each side. A player can only be in one squad.</Text>
          <SquadPicker title="Team A" team={teams.find((t) => t.id === teamAId)} players={players} value={sideA} onChange={setSideA} blockedIds={sideB.ids} />
          <SquadPicker title="Team B" team={teams.find((t) => t.id === teamBId)} players={players} value={sideB} onChange={setSideB} blockedIds={sideA.ids} />
        </>
      ) : null}

      <View style={{ height: spacing.md }} />
      <FormField
        label="Overs (1-50)"
        value={overs}
        onChangeText={setOvers}
        keyboardType="number-pad"
        placeholder="e.g. 20"
      />
      <FormField label="Venue" value={venue} onChangeText={setVenue} placeholder="e.g. City Ground" />
      <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-08-15" />

      {tournaments.length > 0 && (
        <>
          <Text style={typography.label}>ATTACH TO TOURNAMENT (OPTIONAL)</Text>
          <View style={{ height: spacing.xs }} />
          <View style={styles.chipRow}>
            {tournaments.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTournamentId(tournamentId === t.id ? null : t.id)}
                style={[styles.chip, tournamentId === t.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, tournamentId === t.id && { color: "#fff" }]}>{t.name}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {tournamentId ? <StagePicker value={stage} onChange={setStage} /> : null}

      <View style={{ height: spacing.lg }} />
      <Button title="Schedule Match" onPress={submit} />
    </ScrollView>
  );
}

function TeamPicker({ teams, selected, onSelect, exclude }) {
  if (teams.length === 0) {
    return <Text style={typography.muted}>Create at least two teams first.</Text>;
  }
  return (
    <View style={styles.chipRow}>
      {teams.map((t) => (
        <Pressable
          key={t.id}
          disabled={t.id === exclude}
          onPress={() => onSelect(t.id)}
          style={[styles.chip, selected === t.id && styles.chipActive, t.id === exclude && styles.chipDisabled]}
        >
          <Text style={[styles.chipText, selected === t.id && { color: "#fff" }]}>{t.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
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
});
