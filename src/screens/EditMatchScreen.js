import React, { useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { colors, spacing, typography } from "../utils/theme";
import FormField from "../components/FormField";
import Button from "../components/Button";
import SquadPicker from "../components/SquadPicker";
import { computeInningsSummary } from "../utils/cricketEngine";
import { validateMatchSquads, squadFields, sideFromMatch, keeperOf } from "../utils/squads";
import StagePicker from "../components/StagePicker";
import { cleanStage } from "../utils/stages";

// Which of `ids` appear anywhere inside the innings data (batted, bowled, fielded, at the crease...).
function usedIn(match, ids) {
  const want = new Set(ids);
  const found = new Set();
  const stack = [match.innings1, match.innings2];
  while (stack.length) {
    const v = stack.pop();
    if (typeof v === "string") {
      if (want.has(v)) found.add(v);
    } else if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) stack.push(v[i]);
    } else if (v && typeof v === "object") {
      for (const k in v) stack.push(v[k]);
    }
  }
  return found;
}

const validDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());

export default function EditMatchScreen({ route, navigation }) {
  const { matchId } = route.params;
  const { matches, teams, players } = useAppState();
  const dispatch = useAppDispatch();
  const { canEdit } = useAccess();

  const match = matches.find((m) => m.id === matchId);
  const teamA = teams.find((t) => t.id === match?.teamAId);
  const teamB = teams.find((t) => t.id === match?.teamBId);

  const [overs, setOvers] = useState(String(match?.overs || 20));
  const [venue, setVenue] = useState(match?.venue || "");
  const [date, setDate] = useState(match?.date ? String(match.date).slice(0, 10) : "");
  const [stage, setStage] = useState(match?.stage || null);
  const [sideA, setSideA] = useState(() => sideFromMatch(match, "A", teamA?.playerIds || []));
  const [sideB, setSideB] = useState(() => {
    const a = sideFromMatch(match, "A", teamA?.playerIds || []).ids;
    return sideFromMatch(match, "B", (teamB?.playerIds || []).filter((id) => !a.includes(id)));
  });

  const note = (text) => (
    <View style={styles.center}>
      <Text style={[typography.h3, { textAlign: "center" }]}>{text}</Text>
    </View>
  );
  if (!match || !teamA || !teamB) return null;
  if (!canEdit("matches", matchId)) return note("Only the match creator, a captain or an admin can edit this match.");
  if (match.status === "completed") return note("A finished match can't be edited.");

  const live = match.status === "live";
  const innings = live ? (match.currentInnings === 1 ? match.innings1 : match.innings2) : null;
  const bowled = innings ? Math.ceil(computeInningsSummary(innings).legalBallCount / 6) : 0;

  const save = () => {
    const oversNum = parseInt(overs, 10);
    if (!Number.isInteger(oversNum) || oversNum < 1 || oversNum > 50) {
      Alert.alert("Invalid overs", "Overs must be a whole number between 1 and 50.");
      return;
    }
    if (live && oversNum < bowled) {
      Alert.alert("Too few overs", `${bowled} over${bowled === 1 ? " has" : "s have"} already been bowled in this innings, so the match can't be shorter than that.`);
      return;
    }
    if (!validDate(date.trim())) {
      Alert.alert("Invalid date", "Use the format YYYY-MM-DD, for example 2026-08-15.");
      return;
    }
    if (live) {
      // Nobody who has already played can be taken out of the squad.
      const before = [...(Array.isArray(match.squadA) ? match.squadA : teamA.playerIds), ...(Array.isArray(match.squadB) ? match.squadB : teamB.playerIds)];
      const removed = before.filter((id) => !sideA.ids.includes(id) && !sideB.ids.includes(id));
      const used = [...usedIn(match, removed)];
      if (used.length) {
        const names = used.map((id) => players.find((p) => p.id === id)?.name || "A player").join(", ");
        Alert.alert("Can't remove them", `${names} already played in this match, so they have to stay in the squad.`);
        return;
      }
    }

    const squadError = validateMatchSquads(sideA, sideB, players);
    if (squadError) {
      Alert.alert("Check the squads", squadError);
      return;
    }
    const changes = { overs: oversNum, venue: venue.trim() || null, date: date.trim(), ...squadFields(sideA, sideB) };
    if (match.tournamentId) changes.stage = cleanStage(stage);
    if (live) {
      const next = { ...match, ...changes };
      if (match.currentInnings === 1) {
        changes.innings1 = { ...match.innings1, totalOvers: oversNum, keeperId: keeperOf(next, match.innings1.bowlingTeamId) };
      } else {
        changes.innings2 = { ...match.innings2, totalOvers: oversNum, keeperId: keeperOf(next, match.innings2.bowlingTeamId) };
      }
    }
    dispatch({ type: "UPDATE_MATCH", payload: { matchId, changes } });
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={typography.h2}>{teamA.name} vs {teamB.name}</Text>
      <Text style={[typography.muted, { marginBottom: spacing.md }]}>
        {live ? "This match is in progress. Changes apply straight away." : "This match hasn't started."}
      </Text>

      <FormField label="Overs (1-50)" value={overs} onChangeText={setOvers} keyboardType="number-pad" />
      {live ? (
        <Text style={[typography.muted, { marginTop: -spacing.sm, marginBottom: spacing.md }]}>
          {bowled} over{bowled === 1 ? "" : "s"} bowled so far in this innings.
          {match.currentInnings === 2 ? " The target stays as it is." : ""}
        </Text>
      ) : null}
      <FormField label="Venue" value={venue} onChangeText={setVenue} placeholder="e.g. City Ground" />
      <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-08-15" autoCapitalize="none" />

      {match.tournamentId ? <StagePicker value={stage} onChange={setStage} /> : null}

      <Text style={[typography.label, { marginTop: spacing.sm }]}>SQUADS, CAPTAIN AND WICKETKEEPER</Text>
      {live ? <Text style={typography.muted}>Players who have already batted, bowled or fielded can't be removed.</Text> : null}
      <SquadPicker title="Team A" team={teamA} players={players} value={sideA} onChange={setSideA} blockedIds={sideB.ids} />
      <SquadPicker title="Team B" team={teamB} players={players} value={sideB} onChange={setSideB} blockedIds={sideA.ids} />

      <View style={{ height: spacing.lg }} />
      <Button title="Save changes" onPress={save} />
      <Text style={[typography.muted, { marginTop: spacing.md, textAlign: "center" }]}>The teams and the toss can't be changed here.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: colors.background },
});
