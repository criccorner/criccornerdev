import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { newId } from "../utils/id";
import { tournamentProgress, tournamentTables } from "../tournament/plan";
import { advanceTournament, setMatchWinner, canRegenerate } from "../tournament/actions";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import Badge from "../components/Badge";
import { colors, spacing, typography, radius } from "../utils/theme";
import { sortTournamentMatches, stageTag } from "../utils/stages";

const FORMAT_NAME = { roundrobin: "Round Robin", knockout: "Knockout", groups: "Groups + Knockout" };
const STATUS_COLOR = { scheduled: colors.info, live: colors.danger, completed: colors.success };

function PointsTable({ title, rows, nameOf }) {
  return (
    <Card>
      <Text style={typography.h3}>{title}</Text>
      <View style={styles.tr}>
        <Text style={[styles.th, { flex: 3, textAlign: "left" }]}>Team</Text>
        {["P", "W", "L", "T", "Pts", "NRR"].map((h) => (
          <Text key={h} style={[styles.th, h === "NRR" && { flex: 1.6 }]}>{h}</Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={r.teamId} style={styles.tr}>
          <Text style={[styles.td, { flex: 3, textAlign: "left", fontWeight: i === 0 && r.played ? "800" : "600" }]} numberOfLines={1}>{i + 1}. {nameOf(r.teamId)}</Text>
          <Text style={styles.td}>{r.played}</Text>
          <Text style={styles.td}>{r.won}</Text>
          <Text style={styles.td}>{r.lost}</Text>
          <Text style={styles.td}>{r.tied}</Text>
          <Text style={[styles.td, { fontWeight: "800" }]}>{r.points}</Text>
          <Text style={[styles.td, { flex: 1.6 }]}>{r.played ? `${r.nrr >= 0 ? "+" : ""}${r.nrr.toFixed(2)}` : "–"}</Text>
        </View>
      ))}
    </Card>
  );
}

export default function TournamentDetailScreen({ route, navigation }) {
  const { tournamentId } = route.params;
  const { tournaments, matches, teams } = useAppState();
  const dispatch = useAppDispatch();
  const { canEdit } = useAccess();
  const manage = canEdit("tournaments", tournamentId);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorTagline, setSponsorTagline] = useState("");

  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) return null;

  const state = { matches, tournaments };
  const nameOf = (id) => teams.find((t) => t.id === id)?.name || "TBD";
  const stages = tournament.stages || [];
  const progress = tournamentProgress(tournament, matches);
  const tables = tournamentTables(tournament, matches);
  const matchById = (id) => matches.find((m) => m.id === id);
  const stageIds = new Set(stages.flatMap((s) => s.matchIds || []));
  const otherMatches = sortTournamentMatches(matches.filter((m) => tournament.matchIds.includes(m.id) && !stageIds.has(m.id)));
  const f = tournament.format;

  const apply = (res) => {
    if (!res.ok) {
      Alert.alert("Can't do that", res.error);
      return;
    }
    dispatch({ type: "HYDRATE", payload: res.next });
  };

  const generateNext = () => apply(advanceTournament(state, tournamentId, { idGen: (p) => newId(p) }));

  const openMatch = (m) =>
    navigation.navigate(m.status === "completed" || !canEdit("matches", m.id) ? "Scorecard" : m.status === "live" ? "LiveScoring" : "MatchSetup", { matchId: m.id });

  const addSponsor = () => {
    if (!sponsorName.trim()) return;
    dispatch({ type: "ADD_SPONSOR_TO_TOURNAMENT", payload: { tournamentId, sponsor: { name: sponsorName.trim(), tagline: sponsorTagline.trim() || null } } });
    setSponsorName("");
    setSponsorTagline("");
  };

  const MatchRow = ({ m }) => (
    <Pressable onPress={() => openMatch(m)} style={styles.matchRow}>
      <View style={{ flex: 1 }}>
        {stageTag(m) ? <Text style={styles.stageTag}>{stageTag(m).toUpperCase()}</Text> : null}
        <Text style={typography.body}>{nameOf(m.teamAId)} vs {nameOf(m.teamBId)}</Text>
        <Text style={typography.muted}>{m.date}{m.round ? ` · Round ${m.round}` : ""}</Text>
        {m.status === "completed" && m.result ? <Text style={{ color: colors.success, fontSize: 12, marginTop: 1 }}>{m.result}{m.winnerOverride ? ` (${nameOf(m.winnerOverride)} advance)` : ""}</Text> : null}
      </View>
      <Badge label={m.status.toUpperCase()} color={STATUS_COLOR[m.status]} />
    </Pressable>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={typography.h2}>{tournament.name}</Text>
      <Text style={typography.muted}>
        {tournament.startDate}{tournament.endDate ? ` – ${tournament.endDate}` : ""}
        {f ? ` · ${FORMAT_NAME[f.type]} · ${f.overs} overs · ${tournament.teamIds.length} teams` : ""}
      </Text>

      {progress.complete ? (
        <Card style={styles.champion}>
          <Text style={styles.championText}>🏆 Champion: {nameOf(progress.champion)}</Text>
        </Card>
      ) : null}

      {!manage ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={typography.muted}>You can follow this tournament. Only its organiser can change it.</Text>
        </Card>
      ) : null}

      {!manage && (!f || !stages.length) ? null : !f || !stages.length ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={typography.h3}>No format set</Text>
          <Text style={[typography.muted, { marginVertical: spacing.sm }]}>Choose a format (league, knockout or groups) and the matches are generated for you.</Text>
          <Button title="Set Format & Generate Matches" onPress={() => navigation.navigate("CreateTournament", { tournamentId })} />
        </Card>
      ) : (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={typography.h3}>Progress</Text>
          <Text style={[typography.muted, { marginTop: 2 }]}>
            {progress.completed} of {progress.total} matches completed{stages.length > 1 || stages[0].kind === "knockout" ? ` · current: ${stages[stages.length - 1].kind === "group" ? "Group stage" : stages[stages.length - 1].name}` : ""}
          </Text>

          {(manage ? progress.needsWinner.filter((id) => stageIds.has(id)) : []).map((id) => {
            const m = matchById(id);
            return (
              <View key={id} style={styles.tie}>
                <Text style={typography.body}>{nameOf(m.teamAId)} vs {nameOf(m.teamBId)} ended tied. Who goes through?</Text>
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                  {[m.teamAId, m.teamBId].map((tid) => (
                    <Button key={tid} title={nameOf(tid)} variant="outline" onPress={() => apply(setMatchWinner(state, id, tid))} style={{ flex: 1 }} />
                  ))}
                </View>
              </View>
            );
          })}

          {manage && progress.canAdvance ? (
            <Button title={`➡️ ${progress.nextLabel}`} onPress={generateNext} style={{ marginTop: spacing.md }} />
          ) : !progress.complete && progress.needsWinner.length === 0 ? (
            <Text style={[typography.muted, { marginTop: spacing.sm }]}>
              {tournament.format.type === "roundrobin"
                ? progress.leagueDone
                  ? "League matches are finished. The champion is decided by the Final: tap + Schedule under Matches and choose Round: Final."
                  : "Finish the league matches, then play a Final to decide the champion."
                : "Finish all matches in this stage to unlock the next one."}
            </Text>
          ) : null}

          {manage && canRegenerate(state, tournamentId) ? (
            <Pressable onPress={() => navigation.navigate("CreateTournament", { tournamentId })} style={{ marginTop: spacing.md }}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>⚙️ Change format / teams (before play starts)</Text>
            </Pressable>
          ) : null}
        </Card>
      )}

      {tables.map((tb) => (
        <PointsTable key={tb.title} title={tb.title} rows={tb.rows} nameOf={nameOf} />
      ))}

      {stages.map((s) => (
        <Card key={s.id}>
          <Text style={typography.h3}>{s.name}</Text>
          {s.kind === "knockout" && s.entries.some((e) => e.type === "bye") ? (
            <Text style={[typography.muted, { marginTop: 2 }]}>
              Bye to next round: {s.entries.filter((e) => e.type === "bye").map((e) => nameOf(e.teamId)).join(", ")}
            </Text>
          ) : null}
          {(s.matchIds || []).map((id) => {
            const m = matchById(id);
            return m ? <MatchRow key={id} m={m} /> : null;
          })}
        </Card>
      ))}

      <Card>
        <View style={styles.header}>
          <Text style={typography.h3}>{stages.length ? "Other matches" : "Matches"}</Text>
          {manage ? (
            <Pressable onPress={() => navigation.navigate("ScheduleMatch", { tournamentId })}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>+ Schedule</Text>
            </Pressable>
          ) : null}
        </View>
        {(manage ? progress.needsWinner.filter((id) => !stageIds.has(id)) : []).map((id) => {
          const m = matchById(id);
          return m ? (
            <View key={id} style={styles.tie}>
              <Text style={typography.body}>{nameOf(m.teamAId)} vs {nameOf(m.teamBId)} ended tied. Who is the champion?</Text>
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                {[m.teamAId, m.teamBId].map((tid) => (
                  <Button key={tid} title={nameOf(tid)} variant="outline" onPress={() => apply(setMatchWinner(state, id, tid))} style={{ flex: 1 }} />
                ))}
              </View>
            </View>
          ) : null;
        })}
        {otherMatches.length === 0 ? (
          <Text style={typography.muted}>{stages.length ? "No extra matches. Tap + Schedule to add one, such as a Quarter Final, Semi Final or Final." : "No matches yet."}</Text>
        ) : (
          otherMatches.map((m) => <MatchRow key={m.id} m={m} />)
        )}
      </Card>

      <Card>
        <Text style={typography.h3}>Sponsors</Text>
        <Text style={[typography.muted, { marginBottom: spacing.sm }]}>Sponsors added here appear on the scoreboard of every match in this tournament.</Text>
        {tournament.sponsors.map((sp) => (
          <View key={sp.id} style={styles.sponsorRow}>
            <View style={styles.sponsorDot} />
            <View>
              <Text style={typography.body}>{sp.name}</Text>
              {sp.tagline ? <Text style={typography.muted}>{sp.tagline}</Text> : null}
            </View>
          </View>
        ))}
        {manage ? (
          <>
            <View style={{ height: spacing.sm }} />
            <FormField label="Sponsor Name" value={sponsorName} onChangeText={setSponsorName} placeholder="e.g. Acme Sports" />
            <FormField label="Tagline (optional)" value={sponsorTagline} onChangeText={setSponsorTagline} placeholder="e.g. Official Kit Partner" />
            <Button title="+ Add Sponsor" onPress={addSponsor} />
          </>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  champion: { backgroundColor: "#FFF6DB", borderColor: colors.accent, alignItems: "center", marginTop: spacing.md },
  championText: { fontSize: 18, fontWeight: "800", color: colors.text },
  tie: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: "#FFF6DB", borderWidth: 1, borderColor: colors.accent },
  tr: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { flex: 1, fontSize: 11, fontWeight: "700", color: colors.textMuted, textAlign: "center", textTransform: "uppercase" },
  td: { flex: 1, fontSize: 13, color: colors.text, textAlign: "center" },
  stageTag: { color: colors.accent, fontWeight: "800", fontSize: 11, letterSpacing: 0.5, marginBottom: 1 },
  matchRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sponsorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  sponsorDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.accent, marginRight: spacing.sm },
});
