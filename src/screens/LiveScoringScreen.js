import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Alert } from "react-native";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Button from "../components/Button";
import Card from "../components/Card";
import SponsorBanner from "../components/SponsorBanner";
import {
  computeInningsSummary,
  recordBall,
  undoLastBall,
  createInnings,
  setBowlerForOver,
  DISMISSAL_TYPES,
} from "../utils/cricketEngine";

export default function LiveScoringScreen({ route, navigation }) {
  const { matchId } = route.params;
  const { matches, teams, players, tournaments } = useAppState();
  const dispatch = useAppDispatch();

  const [wicketModal, setWicketModal] = useState(false);
  const [dismissalType, setDismissalType] = useState(null);
  const [newBatsmanId, setNewBatsmanId] = useState(null);
  const [nextBowlerModal, setNextBowlerModal] = useState(false);
  const [pendingBowlerId, setPendingBowlerId] = useState(null);
  const [nextInningsModal, setNextInningsModal] = useState(false);
  const [ni2Striker, setNi2Striker] = useState(null);
  const [ni2NonStriker, setNi2NonStriker] = useState(null);
  const [ni2Bowler, setNi2Bowler] = useState(null);

  const match = matches.find((m) => m.id === matchId);
  const tournament = tournaments.find((t) => t.id === match?.tournamentId);
  const teamA = teams.find((t) => t.id === match?.teamAId);
  const teamB = teams.find((t) => t.id === match?.teamBId);

  const inningsKey = match?.currentInnings === 1 ? "innings1" : "innings2";
  const innings = match?.[inningsKey];
  const summary = useMemo(() => (innings ? computeInningsSummary(innings) : null), [innings]);

  if (!match || !innings || !summary) return null;

  const battingTeam = teams.find((t) => t.id === innings.battingTeamId);
  const bowlingTeam = teams.find((t) => t.id === innings.bowlingTeamId);
  const battingRoster = players.filter((p) => battingTeam?.playerIds.includes(p.id));
  const bowlingRoster = players.filter((p) => bowlingTeam?.playerIds.includes(p.id));

  const strikerName = players.find((p) => p.id === summary.striker)?.name || "-";
  const nonStrikerName = players.find((p) => p.id === summary.nonStriker)?.name || "-";
  const bowlerName = players.find((p) => p.id === summary.currentBowlerId)?.name || "-";

  const strikerStats = summary.batsmenStats[summary.striker] || { runs: 0, balls: 0 };
  const nonStrikerStats = summary.batsmenStats[summary.nonStriker] || { runs: 0, balls: 0 };
  const bowlerStats = summary.bowlerStats[summary.currentBowlerId] || { balls: 0, runs: 0, wickets: 0 };

  const availableNewBatsmen = battingRoster.filter(
    (p) => !summary.batsmenStats[p.id]?.out && p.id !== summary.striker && p.id !== summary.nonStriker
  );

  const updateInnings = (updater) => {
    const updated = updater(innings);
    dispatch({ type: "UPDATE_MATCH", payload: { matchId, changes: { [inningsKey]: updated } } });
    return updated;
  };

  const afterBallCheck = (updatedInnings) => {
    const s = computeInningsSummary(updatedInnings);
    if (s.isInningsOver) {
      handleInningsOver(updatedInnings, s);
    } else if (s.ballsInCurrentOver === 0 && s.legalBallCount > 0 && s.legalBallCount % 6 === 0) {
      setPendingBowlerId(null);
      setNextBowlerModal(true);
    }
  };

  const score = (runs) => {
    const updated = updateInnings((inn) => recordBall(inn, { runs }));
    afterBallCheck(updated);
  };

  const scoreExtra = (extraType, runs = 0) => {
    const updated = updateInnings((inn) => recordBall(inn, { runs, extraType }));
    afterBallCheck(updated);
  };

  const openWicketModal = () => {
    setDismissalType(null);
    setNewBatsmanId(null);
    setWicketModal(true);
  };

  const confirmWicket = () => {
    if (!dismissalType) {
      Alert.alert("Select how the batsman was dismissed");
      return;
    }
    const needsNewBatsman = summary.wickets < 9;
    if (needsNewBatsman && !newBatsmanId) {
      Alert.alert("Select the incoming batsman");
      return;
    }
    const updated = updateInnings((inn) =>
      recordBall(inn, { runs: 0, isWicket: true, dismissalType, newBatsmanId: needsNewBatsman ? newBatsmanId : null })
    );
    setWicketModal(false);
    afterBallCheck(updated);
  };

  const confirmNextBowler = () => {
    if (!pendingBowlerId) {
      Alert.alert("Select the next bowler");
      return;
    }
    updateInnings((inn) => setBowlerForOver(inn, summary.currentOverIndex + 1, pendingBowlerId));
    setNextBowlerModal(false);
  };

  const undo = () => {
    updateInnings((inn) => undoLastBall(inn));
  };

  function handleInningsOver(finishedInnings, finishedSummary) {
    if (match.currentInnings === 1) {
      setNextInningsModal(true);
    } else {
      const innings1Summary = computeInningsSummary(match.innings1);
      const team1Runs = innings1Summary.totalRuns;
      const team2Runs = finishedSummary.totalRuns;
      let resultText;
      if (team2Runs > team1Runs) {
        const wicketsLeft = 10 - finishedSummary.wickets;
        resultText = `${battingTeam.name} won by ${wicketsLeft} wicket${wicketsLeft === 1 ? "" : "s"}`;
      } else if (team1Runs > team2Runs) {
        const margin = team1Runs - team2Runs;
        resultText = `${bowlingTeam.name} won by ${margin} run${margin === 1 ? "" : "s"}`;
      } else {
        resultText = "Match tied";
      }
      dispatch({ type: "UPDATE_MATCH", payload: { matchId, changes: { status: "completed", result: resultText } } });
      navigation.replace("Scorecard", { matchId });
    }
  }

  const startSecondInnings = () => {
    if (!ni2Striker || !ni2NonStriker || ni2Striker === ni2NonStriker || !ni2Bowler) {
      Alert.alert("Pick two openers and a bowler");
      return;
    }
    const innings1Summary = computeInningsSummary(match.innings1);
    const innings2 = createInnings({
      battingTeamId: innings.bowlingTeamId,
      bowlingTeamId: innings.battingTeamId,
      strikerId: ni2Striker,
      nonStrikerId: ni2NonStriker,
      bowlerId: ni2Bowler,
      totalOvers: match.overs,
      target: innings1Summary.totalRuns + 1,
    });
    dispatch({ type: "UPDATE_MATCH", payload: { matchId, changes: { currentInnings: 2, innings2 } } });
    setNextInningsModal(false);
  };

  const inn2BattingRoster = players.filter((p) => teams.find((t) => t.id === innings.bowlingTeamId)?.playerIds.includes(p.id));
  const inn2BowlingRoster = players.filter((p) => teams.find((t) => t.id === innings.battingTeamId)?.playerIds.includes(p.id));

  return (
    <View style={styles.container}>
      <SponsorBanner tournament={tournament} />

      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Card style={styles.scoreCard}>
          <Text style={styles.matchLabel}>{battingTeam?.name} vs {bowlingTeam?.name} · {match.overs} overs</Text>
          <Text style={styles.bigScore}>
            {summary.totalRuns}/{summary.wickets} <Text style={styles.oversText}>({summary.oversDisplay} ov)</Text>
          </Text>
          {innings.target != null && (
            <Text style={styles.target}>
              Target {innings.target} · Need {Math.max(innings.target - summary.totalRuns, 0)} runs from {Math.max(match.overs * 6 - summary.legalBallCount, 0)} balls
            </Text>
          )}
        </Card>

        <Card>
          <Row label="🏏 Striker" name={`${strikerName} *`} extra={`${strikerStats.runs} (${strikerStats.balls})`} />
          <Row label="Non-striker" name={nonStrikerName} extra={`${nonStrikerStats.runs} (${nonStrikerStats.balls})`} />
          <Row label="🎯 Bowler" name={bowlerName} extra={`${bowlerStats.wickets}/${bowlerStats.runs} (${Math.floor(bowlerStats.balls / 6)}.${bowlerStats.balls % 6})`} />
        </Card>

        <Card>
          <Text style={typography.h3}>Score a ball</Text>
          <View style={{ height: spacing.sm }} />
          <View style={styles.runGrid}>
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <Pressable key={r} onPress={() => score(r)} style={[styles.runButton, (r === 4 || r === 6) && styles.boundaryButton]}>
                <Text style={[styles.runButtonText, (r === 4 || r === 6) && { color: "#fff" }]}>{r}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ height: spacing.md }} />
          <View style={styles.extrasRow}>
            <ExtraButton label="Wide" onPress={() => scoreExtra("wide")} />
            <ExtraButton label="No Ball" onPress={() => scoreExtra("noball")} />
            <ExtraButton label="Bye" onPress={() => scoreExtra("bye", 1)} />
            <ExtraButton label="Leg Bye" onPress={() => scoreExtra("legbye", 1)} />
          </View>

          <View style={{ height: spacing.md }} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Button title="🔴 Wicket" variant="danger" onPress={openWicketModal} style={{ flex: 1 }} />
            <Button title="↩️ Undo" variant="outline" onPress={undo} style={{ flex: 1 }} />
          </View>
        </Card>
      </ScrollView>

      <Modal visible={wicketModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={typography.h3}>How was {strikerName} out?</Text>
            <View style={styles.chipRow}>
              {DISMISSAL_TYPES.map((d) => (
                <Pressable key={d} onPress={() => setDismissalType(d)} style={[styles.chip, dismissalType === d && styles.chipActive]}>
                  <Text style={[styles.chipText, dismissalType === d && { color: "#fff" }]}>{d}</Text>
                </Pressable>
              ))}
            </View>

            {summary.wickets < 9 && (
              <>
                <Text style={[typography.h3, { marginTop: spacing.md }]}>Incoming batsman</Text>
                <View style={styles.chipRow}>
                  {availableNewBatsmen.map((p) => (
                    <Pressable key={p.id} onPress={() => setNewBatsmanId(p.id)} style={[styles.chip, newBatsmanId === p.id && styles.chipActive]}>
                      <Text style={[styles.chipText, newBatsmanId === p.id && { color: "#fff" }]}>{p.name}</Text>
                    </Pressable>
                  ))}
                  {availableNewBatsmen.length === 0 && <Text style={typography.muted}>No more players available on roster.</Text>}
                </View>
              </>
            )}

            <View style={{ height: spacing.md }} />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button title="Cancel" variant="outline" onPress={() => setWicketModal(false)} style={{ flex: 1 }} />
              <Button title="Confirm Out" variant="danger" onPress={confirmWicket} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={nextBowlerModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={typography.h3}>Over complete — who's bowling next?</Text>
            <View style={styles.chipRow}>
              {bowlingRoster.map((p) => (
                <Pressable key={p.id} onPress={() => setPendingBowlerId(p.id)} style={[styles.chip, pendingBowlerId === p.id && styles.chipActive]}>
                  <Text style={[styles.chipText, pendingBowlerId === p.id && { color: "#fff" }]}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ height: spacing.md }} />
            <Button title="Confirm Bowler" onPress={confirmNextBowler} />
          </View>
        </View>
      </Modal>

      <Modal visible={nextInningsModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={typography.h3}>Innings 1 complete — set up innings 2</Text>
            <Text style={typography.muted}>Target: {computeInningsSummary(match.innings1).totalRuns + 1} runs</Text>

            <Text style={[typography.h3, { marginTop: spacing.md }]}>Opening striker</Text>
            <View style={styles.chipRow}>
              {inn2BattingRoster.map((p) => (
                <Pressable key={p.id} disabled={p.id === ni2NonStriker} onPress={() => setNi2Striker(p.id)} style={[styles.chip, ni2Striker === p.id && styles.chipActive, p.id === ni2NonStriker && styles.chipDisabled]}>
                  <Text style={[styles.chipText, ni2Striker === p.id && { color: "#fff" }]}>{p.name}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[typography.h3, { marginTop: spacing.md }]}>Non-striker</Text>
            <View style={styles.chipRow}>
              {inn2BattingRoster.map((p) => (
                <Pressable key={p.id} disabled={p.id === ni2Striker} onPress={() => setNi2NonStriker(p.id)} style={[styles.chip, ni2NonStriker === p.id && styles.chipActive, p.id === ni2Striker && styles.chipDisabled]}>
                  <Text style={[styles.chipText, ni2NonStriker === p.id && { color: "#fff" }]}>{p.name}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[typography.h3, { marginTop: spacing.md }]}>Opening bowler</Text>
            <View style={styles.chipRow}>
              {inn2BowlingRoster.map((p) => (
                <Pressable key={p.id} onPress={() => setNi2Bowler(p.id)} style={[styles.chip, ni2Bowler === p.id && styles.chipActive]}>
                  <Text style={[styles.chipText, ni2Bowler === p.id && { color: "#fff" }]}>{p.name}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ height: spacing.md }} />
            <Button title="Start Innings 2" onPress={startSecondInnings} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, name, extra }) {
  return (
    <View style={styles.statRow}>
      <Text style={typography.muted}>{label}</Text>
      <Text style={typography.body}>{name}</Text>
      <Text style={[typography.body, { fontWeight: "700" }]}>{extra}</Text>
    </View>
  );
}

function ExtraButton({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.extraButton}>
      <Text style={styles.extraButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scoreCard: { alignItems: "center", backgroundColor: colors.primary },
  matchLabel: { color: "#CFE3D8", fontSize: 13, fontWeight: "600" },
  bigScore: { color: "#fff", fontSize: 40, fontWeight: "800", marginTop: spacing.xs },
  oversText: { fontSize: 16, fontWeight: "600" },
  target: { color: "#fff", marginTop: spacing.xs, fontSize: 13 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs },
  runGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  runButton: { width: "30%", aspectRatio: 1.6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  boundaryButton: { backgroundColor: colors.accent, borderColor: colors.accent },
  runButtonText: { fontSize: 22, fontWeight: "800", color: colors.text },
  extrasRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  extraButton: { borderWidth: 1, borderColor: colors.info, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  extraButtonText: { color: colors.info, fontWeight: "700", fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: "85%" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDisabled: { opacity: 0.35 },
  chipText: { color: colors.text, fontWeight: "600" },
});
