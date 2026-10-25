import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { newId } from "../utils/id";
import { validateFormat, splitIntoGroups, nextPow2 } from "../tournament/fixtures";
import { setTournamentFormat, canRegenerate } from "../tournament/actions";
import FormField from "../components/FormField";
import Button from "../components/Button";
import Card from "../components/Card";
import { colors, spacing, typography, radius } from "../utils/theme";

const FORMATS = [
  { type: "roundrobin", title: "Round Robin (League)", desc: "Every team plays every other team. Teams are ranked on a points table." },
  { type: "knockout", title: "Knockout", desc: "Lose and you're out. Winners go through round by round to the final." },
  { type: "groups", title: "Groups + Knockout", desc: "Teams are split into groups. The top teams from each group go into a knockout." },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

function Choice({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map((o) => (
        <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[styles.chip, value === o.value && styles.chipActive]}>
          <Text style={[styles.chipText, value === o.value && { color: "#fff" }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// "28 matches over 7 rounds" etc. Shown live as the organiser changes settings.
function preview(type, n, legs, groupCount, advance) {
  if (n < 2) return "Select at least 2 teams.";
  if (type === "roundrobin") {
    const m = (n * (n - 1)) / 2 * legs;
    return `${m} matches (${legs === 2 ? "home and away" : "each pair plays once"}).`;
  }
  if (type === "knockout") {
    const rounds = Math.log2(nextPow2(n));
    const byes = nextPow2(n) - n;
    return `${n - 1} matches over ${rounds} round${rounds === 1 ? "" : "s"}${byes ? `. ${byes} top seed${byes === 1 ? " gets" : "s get"} a first-round bye` : ""}.`;
  }
  if (!Number.isInteger(groupCount) || groupCount < 2 || n < groupCount * 2) return "Each group needs at least 2 teams.";
  const sizes = splitIntoGroups(Array.from({ length: n }, (_, i) => i), groupCount).map((g) => g.teamIds.length);
  const gm = sizes.reduce((x, s) => x + (s * (s - 1)) / 2 * legs, 0);
  const q = Number.isInteger(advance) ? groupCount * advance : 0;
  return `${gm} group matches (groups of ${[...new Set(sizes)].join(" or ")}). Then ${q} teams go into a knockout, generated once the groups finish.`;
}

export default function CreateTournamentScreen({ navigation, route }) {
  const { teams: seenTeams, matches, tournaments } = useAppState();
  const dispatch = useAppDispatch();
  const { mine, canEdit } = useAccess();
  const editingId = route?.params?.tournamentId || null;
  const existing = editingId ? tournaments.find((t) => t.id === editingId) : null;
  // You can build a tournament from your own teams (plus the ones it already has).
  const teams = seenTeams.filter((t) => mine.teams.some((m) => m.id === t.id) || (existing?.teamIds || []).includes(t.id));
  const f0 = existing?.format || {};

  const [name, setName] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startDate, setStartDate] = useState(f0.startDate || todayIso());
  const [type, setType] = useState(f0.type || "roundrobin");
  const [overs, setOvers] = useState(String(f0.overs || 20));
  const [legs, setLegs] = useState(f0.legs || 1);
  const [groupCount, setGroupCount] = useState(String(f0.groupCount || 2));
  const [advance, setAdvance] = useState(String(f0.advance || 2));
  const [perDay, setPerDay] = useState(String(f0.perDay || 1));
  const [stepDays, setStepDays] = useState(String(f0.stepDays || 1));
  const [venue, setVenue] = useState(f0.venue || "");
  const [shuffle, setShuffle] = useState(f0.shuffle !== undefined ? f0.shuffle : true);
  const [teamIds, setTeamIds] = useState(existing?.teamIds || []);
  const [error, setError] = useState("");

  const toggleTeam = (id) => setTeamIds(teamIds.includes(id) ? teamIds.filter((x) => x !== id) : [...teamIds, id]);

  const build = () => ({
    type,
    overs: Number(overs),
    legs: type === "knockout" ? undefined : legs,
    groupCount: type === "groups" ? Number(groupCount) : undefined,
    advance: type === "groups" ? Number(advance) : undefined,
    perDay: Number(perDay),
    stepDays: Number(stepDays),
    startDate: startDate.trim(),
    venue: venue.trim() || null,
    shuffle,
  });

  const run = () => {
    const format = build();
    const idGen = (prefix) => newId(prefix);
    let state = { matches, tournaments };
    let id = editingId;
    if (!editingId) {
      id = newId("tourn");
      state = {
        matches,
        tournaments: [...tournaments, { id, name: name.trim(), startDate: format.startDate, endDate: endDate.trim() || null, sponsors: [], matchIds: [] }],
      };
    }
    const res = setTournamentFormat(state, id, format, teamIds, { idGen });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    // The tournament and ALL its fixtures are saved in one update.
    dispatch({ type: "HYDRATE", payload: res.next });
    navigation.replace("TournamentDetail", { tournamentId: id });
  };

  const submit = () => {
    setError("");
    if (!editingId && !name.trim()) {
      setError("Tournament name is required.");
      return;
    }
    const err = validateFormat(build(), teamIds);
    if (err) {
      setError(err);
      return;
    }
    if (editingId && (existing?.stages || []).length) {
      if (!canRegenerate({ matches, tournaments }, editingId)) {
        setError("Matches have already started, so the format can't be changed.");
        return;
      }
      Alert.alert("Rebuild fixtures?", "The matches generated earlier will be replaced with new ones. Matches you added by hand are kept.", [
        { text: "Cancel", style: "cancel" },
        { text: "Rebuild", style: "destructive", onPress: run },
      ]);
      return;
    }
    run();
  };

  const nTeams = teamIds.length;
  const info = preview(type, nTeams, legs, Number(groupCount), Number(advance));

  if (existing && !canEdit("tournaments", editingId)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: colors.background }}>
        <Text style={typography.h3}>Only the organiser can change this tournament</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {!editingId ? (
          <>
            <FormField label="Tournament Name" value={name} onChangeText={setName} placeholder="e.g. City Premier League 2026" />
            <FormField label="End Date (optional, YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
          </>
        ) : (
          <Text style={[typography.h2, { marginBottom: spacing.md }]}>{existing?.name}</Text>
        )}

        <Text style={typography.label}>FORMAT</Text>
        {FORMATS.map((fm) => (
          <Pressable key={fm.type} onPress={() => setType(fm.type)} style={[styles.format, type === fm.type && styles.formatActive]}>
            <Text style={[typography.h3, type === fm.type && { color: colors.primary }]}>{type === fm.type ? "● " : "○ "}{fm.title}</Text>
            <Text style={typography.muted}>{fm.desc}</Text>
          </Pressable>
        ))}

        <View style={{ height: spacing.md }} />
        <FormField label="Overs per match (1-50)" value={overs} onChangeText={setOvers} keyboardType="number-pad" />

        {type !== "knockout" ? (
          <>
            <Text style={typography.label}>ROUND ROBIN TYPE</Text>
            <Choice options={[{ value: 1, label: "Single (play once)" }, { value: 2, label: "Double (home & away)" }]} value={legs} onChange={setLegs} />
            <View style={{ height: spacing.md }} />
          </>
        ) : null}

        {type === "groups" ? (
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <FormField style={{ flex: 1 }} label="Number of groups" value={groupCount} onChangeText={setGroupCount} keyboardType="number-pad" />
            <FormField style={{ flex: 1 }} label="Advance per group" value={advance} onChangeText={setAdvance} keyboardType="number-pad" />
          </View>
        ) : null}

        <Text style={typography.label}>SEEDING</Text>
        <Choice options={[{ value: true, label: "Random draw" }, { value: false, label: "In order selected" }]} value={shuffle} onChange={setShuffle} />
        <Text style={[typography.muted, { marginTop: spacing.xs, marginBottom: spacing.md }]}>
          {shuffle ? "Teams are drawn at random." : "The order you tap the teams is the seeding (first = top seed)."}
        </Text>

        <Text style={[typography.h3, { marginBottom: spacing.xs }]}>Schedule</Text>
        <FormField label="First match day (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <FormField style={{ flex: 1 }} label="Matches per day" value={perDay} onChangeText={setPerDay} keyboardType="number-pad" />
          <FormField style={{ flex: 1 }} label="Days between match days" value={stepDays} onChangeText={setStepDays} keyboardType="number-pad" />
        </View>
        <Choice options={[{ value: "1", label: "Daily" }, { value: "7", label: "Weekly" }]} value={stepDays} onChange={setStepDays} />
        <View style={{ height: spacing.md }} />
        <FormField label="Venue (optional)" value={venue} onChangeText={setVenue} placeholder="e.g. City Oval" />

        <View style={styles.teamsHeader}>
          <Text style={typography.h3}>Teams ({nTeams} selected)</Text>
          <Pressable onPress={() => setTeamIds(nTeams === teams.length ? [] : teams.map((t) => t.id))}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>{nTeams === teams.length && teams.length ? "Clear" : "Select all"}</Text>
          </Pressable>
        </View>
        {teams.length === 0 ? (
          <Text style={typography.muted}>Create teams first (Teams tab), then come back.</Text>
        ) : (
          teams.map((t) => {
            const on = teamIds.includes(t.id);
            const order = teamIds.indexOf(t.id) + 1;
            return (
              <Pressable key={t.id} onPress={() => toggleTeam(t.id)} style={[styles.team, on && styles.teamOn]}>
                <Text style={[styles.check, on && { color: colors.primary }]}>{on ? (shuffle ? "✔" : order) : "○"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>{t.name}</Text>
                  <Text style={[typography.muted, t.playerIds.length < 2 && { color: colors.danger }]}>
                    {t.playerIds.length} player{t.playerIds.length === 1 ? "" : "s"}{t.playerIds.length < 2 ? " · needs 2+ to score a match" : ""}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}

        <Card style={{ marginTop: spacing.md, backgroundColor: colors.background }}>
          <Text style={typography.label}>THIS WILL CREATE</Text>
          <Text style={[typography.body, { marginTop: spacing.xs }]}>{info}</Text>
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={editingId ? "Save Format & Generate Matches" : "Create Tournament & Generate Matches"} onPress={submit} />
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  format: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  formatActive: { borderColor: colors.primary, backgroundColor: "#EEF7F2" },
  teamsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.sm },
  team: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  teamOn: { borderColor: colors.primary },
  check: { width: 24, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.textMuted },
  error: { color: colors.danger, marginVertical: spacing.md },
});
