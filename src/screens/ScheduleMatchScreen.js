import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import FormField from "../components/FormField";
import Button from "../components/Button";
import CityPicker from "../components/CityPicker";
import { newId } from "../utils/id";
import SquadPicker from "../components/SquadPicker";
import { validateMatchSquads, squadFields } from "../utils/squads";
import StagePicker from "../components/StagePicker";
import { cleanStage } from "../utils/stages";

const LAST_CITY_KEY = "@criccorner_last_match_city_v1";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// Team B choices: your own teams, plus every team your teams have played before.
export function teamBChoices(allTeams, matches, ownTeamIds, excludeId) {
  const own = new Set(ownTeamIds);
  const ids = new Set(ownTeamIds);
  for (const m of matches || []) {
    if (own.has(m.teamAId) && m.teamBId) ids.add(m.teamBId);
    if (own.has(m.teamBId) && m.teamAId) ids.add(m.teamAId);
  }
  return allTeams.filter((t) => ids.has(t.id) && t.id !== excludeId);
}

// Find any team by name (first-time opponents).
export function findTeams(allTeams, query, excludeIds = [], limit = 8) {
  const q = norm(query);
  if (q.length < 2) return [];
  const skip = new Set(excludeIds);
  return allTeams.filter((t) => !skip.has(t.id) && norm(t.name).includes(q)).slice(0, limit);
}

export default function ScheduleMatchScreen({ navigation, route }) {
  const { players, teams: allTeams, matches } = useAppState();
  const { mine, canEdit, createdByMe, myPlayerIds } = useAccess();
  // Team A: the teams you created (or own). Team B: those, plus teams you have played, plus a search for anyone else.
  const ownTeams = useMemo(() => {
    const created = new Set((createdByMe.teams || []).map((t) => t.id));
    return allTeams.filter((t) => created.has(t.id) || (t.ownerId && myPlayerIds && myPlayerIds.has(t.ownerId)));
  }, [allTeams, createdByMe, myPlayerIds]);
  const tournaments = mine.tournaments.filter((t) => canEdit("tournaments", t.id));
  const dispatch = useAppDispatch();
  const presetTournamentId = route?.params?.tournamentId || null;

  const [teamAId, setTeamAId] = useState(null);
  const [teamBId, setTeamBId] = useState(null);
  const [findText, setFindText] = useState("");
  const [overs, setOvers] = useState("20");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState(todayIso());
  const [tournamentId, setTournamentId] = useState(presetTournamentId);
  const [stage, setStage] = useState(null); // Quarter Final, Semi Final ... (tournament matches only)
  const [place, setPlace] = useState(null); // the match's city (for local sponsors)
  const emptySide = { ids: [], captainId: null, keeperId: null };
  const [sideA, setSideA] = useState(emptySide);
  const [sideB, setSideB] = useState(emptySide);

  useEffect(() => {
    AsyncStorage.getItem(LAST_CITY_KEY).then((raw) => { if (raw) { try { setPlace((cur) => cur || JSON.parse(raw)); } catch (e) {} } }).catch(() => {});
  }, []);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  const effectivePlace = place || (tournament && tournament.city ? { name: tournament.city, label: tournament.cityLabel || tournament.city, lat: tournament.cityLat, lng: tournament.cityLng } : null);

  const choicesB = useMemo(() => teamBChoices(allTeams, matches, ownTeams.map((t) => t.id), teamAId), [allTeams, matches, ownTeams, teamAId]);
  const teamB = allTeams.find((t) => t.id === teamBId) || null;
  const found = useMemo(() => findTeams(allTeams, findText, [teamAId, ...choicesB.map((t) => t.id)]), [allTeams, findText, teamAId, choicesB]);
  const nameOfPlayer = (id) => (players.find((p) => p.id === id) || {}).name || "";

  // Picking a team pre-selects its players, except anyone already in the other squad.
  const playersOf = (teamId) => (allTeams.find((t) => t.id === teamId)?.playerIds || []).filter((id) => players.some((p) => p.id === id));
  const chooseTeamA = (id) => {
    setTeamAId(id);
    if (teamBId === id) setTeamBId(null);
    setSideA({ ids: playersOf(id).filter((pid) => !sideB.ids.includes(pid)), captainId: null, keeperId: null });
  };
  const chooseTeamB = (id) => {
    setTeamBId(id);
    setFindText("");
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

    // No players picked on either side = "let the players say who is available"; the captain picks the XI later.
    const attendanceMode = sideA.ids.length === 0 && sideB.ids.length === 0;
    if (!attendanceMode) {
      if (sideA.ids.length === 0 || sideB.ids.length === 0) {
        Alert.alert("Pick players for both teams", "Choose players for both sides, or clear both to let the players mark their own attendance.");
        return;
      }
      const squadError = validateMatchSquads(sideA, sideB, players);
      if (squadError) {
        Alert.alert("Check the squads", squadError);
        return;
      }
    }

    const matchId = newId("match");
    const ownerOf = (teamId) => {
      const t = allTeams.find((x) => x.id === teamId);
      return t && t.ownerId && (t.playerIds || []).includes(t.ownerId) ? t.ownerId : null;
    };
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
      ...(effectivePlace ? { city: effectivePlace.name, cityLat: Number.isFinite(effectivePlace.lat) ? effectivePlace.lat : null, cityLng: Number.isFinite(effectivePlace.lng) ? effectivePlace.lng : null } : {}),
      ...(attendanceMode
        ? {
            // Until the XI is confirmed each team's owner acts as its captain (so they can confirm it).
            squadA: [], squadB: [], captainA: ownerOf(teamAId), captainB: ownerOf(teamBId), keeperA: null, keeperB: null,
            attendance: true,
          }
        : squadFields(sideA, sideB)),
    };

    dispatch({ type: "SCHEDULE_MATCH", payload });
    if (tournamentId) {
      dispatch({ type: "ATTACH_MATCH_TO_TOURNAMENT", payload: { tournamentId, matchId } });
    }
    if (place) AsyncStorage.setItem(LAST_CITY_KEY, JSON.stringify(place)).catch(() => {});
    navigation.goBack();
  };

  const teamA = allTeams.find((t) => t.id === teamAId);
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={typography.label}>TEAM A (YOUR TEAMS)</Text>
      <TeamPicker teams={ownTeams} selected={teamAId} onSelect={chooseTeamA} exclude={teamBId} empty="Create a team first (Teams tab). Only teams you created are listed here." />

      <Text style={[typography.label, { marginTop: spacing.md }]}>TEAM B</Text>
      <TeamPicker teams={choicesB} selected={teamBId} onSelect={chooseTeamB} exclude={teamAId} empty="Teams you have played before appear here. Use the search below to find a new opponent." />
      {teamB && !choicesB.some((t) => t.id === teamB.id) ? (
        <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
          <View style={[styles.chip, styles.chipActive]}><Text style={[styles.chipText, { color: "#fff" }]}>{teamB.name}</Text></View>
        </View>
      ) : null}

      <View style={styles.search}>
        <Text style={{ marginRight: spacing.sm }}>🔍</Text>
        <TextInput value={findText} onChangeText={setFindText} placeholder="Find a team to play for the first time" placeholderTextColor={colors.textMuted} style={styles.searchInput} autoCorrect={false} />
        {findText ? <Pressable onPress={() => setFindText("")} hitSlop={8}><Text style={{ color: colors.textMuted }}>✕</Text></Pressable> : null}
      </View>
      {findText.trim().length >= 2 ? (
        found.length ? (
          found.map((t) => (
            <Pressable key={t.id} onPress={() => chooseTeamB(t.id)} style={styles.found}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.body, { fontWeight: "700" }]}>{t.name}</Text>
                <Text style={typography.muted}>{(t.playerIds || []).length} players{t.ownerId && nameOfPlayer(t.ownerId) ? ` · Owner: ${nameOfPlayer(t.ownerId)}` : ""}</Text>
              </View>
              <Text style={{ color: colors.primary, fontWeight: "800" }}>Select</Text>
            </Pressable>
          ))
        ) : (
          <Text style={[typography.muted, { marginTop: spacing.xs }]}>No other team matches “{findText.trim()}”.</Text>
        )
      ) : null}

      {teamAId && teamBId ? (
        <>
          <Text style={[typography.label, { marginTop: spacing.md }]}>SQUADS</Text>
          <Text style={typography.muted}>Choose who plays, then the captain and wicketkeeper of each side. A player can only be in one squad.</Text>
          <View style={styles.tip}>
            <Text style={styles.tipText}>Not sure who is coming? Tap “Clear” on both sides. Every player gets a 🔔 notification to mark whether they are available, and you pick the final XI afterwards.</Text>
          </View>
          <SquadPicker title="Team A" team={teamA} players={players} value={sideA} onChange={setSideA} blockedIds={sideB.ids} />
          <SquadPicker title="Team B" team={teamB} players={players} value={sideB} onChange={setSideB} blockedIds={sideA.ids} />
        </>
      ) : null}

      <View style={{ height: spacing.md }} />
      <FormField label="Overs (1-50)" value={overs} onChangeText={setOvers} keyboardType="number-pad" placeholder="e.g. 20" />
      <FormField label="Venue" value={venue} onChangeText={setVenue} placeholder="e.g. City Ground" />
      <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-08-15" />
      <CityPicker label="City (optional, for local sponsors)" value={effectivePlace} onChange={setPlace} />

      {tournaments.length > 0 && (
        <>
          <Text style={typography.label}>ATTACH TO TOURNAMENT (OPTIONAL)</Text>
          <View style={{ height: spacing.xs }} />
          <View style={styles.chipRow}>
            {tournaments.map((t) => (
              <Pressable key={t.id} onPress={() => setTournamentId(tournamentId === t.id ? null : t.id)} style={[styles.chip, tournamentId === t.id && styles.chipActive]}>
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

function TeamPicker({ teams, selected, onSelect, exclude, empty }) {
  if (teams.length === 0) {
    return <Text style={typography.muted}>{empty || "Create at least two teams first."}</Text>;
  }
  return (
    <View style={styles.chipRow}>
      {teams.map((t) => (
        <Pressable key={t.id} disabled={t.id === exclude} onPress={() => onSelect(t.id)} style={[styles.chip, selected === t.id && styles.chipActive, t.id === exclude && styles.chipDisabled]}>
          <Text style={[styles.chipText, selected === t.id && { color: "#fff" }]}>{t.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDisabled: { opacity: 0.35 },
  chipText: { color: colors.text, fontWeight: "600" },
  search: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 8, fontSize: 15 },
  found: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tip: { backgroundColor: colors.primary + "14", borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  tipText: { color: colors.text, fontSize: 12 },
});
