import React, { useMemo, useState } from "react";
import { squadIds, keeperOf } from "../utils/squads";
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Modal, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Button from "../components/Button";
import Card from "../components/Card";
import SponsorBanner from "../components/SponsorBanner";
import ShotPicker from "../components/ShotPicker";
import { recentOvers } from "../utils/overLine";
import { shotLabel } from "../utils/shots";
import {
  computeInningsSummary,
  recordBall,
  undoLastBall,
  createInnings,
  setBowler,
  setKeeper,
  bowlerOptions,
  swapStrike,
  needsNewBowler,
  describeEntry,
  DISMISSAL_TYPES,
} from "../utils/cricketEngine";

const EXTRA_INFO = {
  wide: { title: "Wide", penalty: 1, hint: "1 penalty run is added automatically. How many MORE runs were scored? (+4 if it went to the boundary)" },
  noball: { title: "No Ball", penalty: 1, hint: "1 penalty run is added automatically. Where did the other runs come from, and how many?" },
  bye: { title: "Byes", penalty: 0, hint: "How many byes were run?" },
  legbye: { title: "Leg Byes", penalty: 0, hint: "How many leg byes were run?" },
};

// Quick reasons for a manual strike change. All optional.
const STRIKE_REASONS = ["Wrong batter on strike", "Run entered incorrectly", "Batters crossed", "Mix-up after undo"];

// Who took the catch / stumping / run-out (all optional).
const FIELDER_PROMPT = { Caught: "Caught by (optional)", Stumped: "Stumped by (optional)", "Run Out": "Run out by (optional)" };

const NB_TYPES = [
  { value: "bat", label: "Off the bat" },
  { value: "bye", label: "Byes" },
  { value: "legbye", label: "Leg byes" },
];

function extraOptions(type, nbRunType) {
  if (type === "wide") return [0, 1, 2, 3, 4, 5];
  if (type === "noball") return nbRunType === "bat" ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5];
  return [1, 2, 3, 4, 5];
}

export default function LiveScoringScreen({ route, navigation }) {
  const { matchId } = route.params;
  const { matches, teams, players, tournaments } = useAppState();
  const access = useAccess();
  const dispatch = useAppDispatch();

  const [wicketModal, setWicketModal] = useState(false);
  const [dismissalType, setDismissalType] = useState(null);
  const [newBatsmanId, setNewBatsmanId] = useState(null);
  const [fielderId, setFielderId] = useState(null);
  const [keeperModal, setKeeperModal] = useState(false);
  const [changeBowlerOpen, setChangeBowlerOpen] = useState(false);
  const [pendingBowlerId, setPendingBowlerId] = useState(null);
  const [undoNote, setUndoNote] = useState(null);
  const [strikeModal, setStrikeModal] = useState(false);
  const [strikeChip, setStrikeChip] = useState(null);
  const [strikeNote, setStrikeNote] = useState("");
  const [extraPicker, setExtraPicker] = useState(null); // "wide" | "noball" | "bye" | "legbye" | null
  const [nbRunType, setNbRunType] = useState("bat"); // where a no-ball's runs came from
  const [shotSheet, setShotSheet] = useState(null); // { runs } while the scorer is choosing a shot / direction
  const [shotSel, setShotSel] = useState({ shot: null, zone: null });
  const [otOpen, setOtOpen] = useState(false); // overthrow entry
  const [otType, setOtType] = useState("bat"); // bat | bye | legbye
  const [otBase, setOtBase] = useState(0);
  const [otRuns, setOtRuns] = useState(null);
  const [ni2Striker, setNi2Striker] = useState(null);
  const [ni2NonStriker, setNi2NonStriker] = useState(null);
  const [ni2Bowler, setNi2Bowler] = useState(null);

  const match = matches.find((m) => m.id === matchId);
  const tournament = tournaments.find((t) => t.id === match?.tournamentId);

  const inningsKey = match?.currentInnings === 1 ? "innings1" : "innings2";
  const innings = match?.[inningsKey];
  const summary = useMemo(() => (innings ? computeInningsSummary(innings) : null), [innings]);

  if (!match || !innings || !summary) return null;

  const battingTeam = teams.find((t) => t.id === innings.battingTeamId);
  const bowlingTeam = teams.find((t) => t.id === innings.bowlingTeamId);
  const battingSquad = squadIds(match, teams, innings.battingTeamId);
  const bowlingSquad = squadIds(match, teams, innings.bowlingTeamId);
  const battingRoster = players.filter((p) => battingSquad.includes(p.id));
  const rosterOf = (squad) => players.filter((p) => squad.includes(p.id));
  // If a side has no players listed (a team without squad, e.g. a tournament fixture), fall back to everyone
  // who is not on the other side, so scoring can never dead-end on an empty list.
  const poolOf = (squad, otherSquad) => {
    const roster = rosterOf(squad);
    return roster.length ? roster : players.filter((p) => !otherSquad.includes(p.id));
  };
  const bowlingRoster = poolOf(bowlingSquad, battingSquad);
  const bowlingListMissing = rosterOf(bowlingSquad).length === 0;

  const nameOf = (id) => players.find((p) => p.id === id)?.name || "-";
  const strikerName = nameOf(summary.striker);
  const nonStrikerName = nameOf(summary.nonStriker);
  const bowlerName = nameOf(summary.currentBowlerId);

  const strikerStats = summary.batsmenStats[summary.striker] || { runs: 0, balls: 0 };
  const nonStrikerStats = summary.batsmenStats[summary.nonStriker] || { runs: 0, balls: 0 };
  const bowlerStats = summary.bowlerStats[summary.currentBowlerId] || { balls: 0, runs: 0, wickets: 0 };

  const availableNewBatsmen = battingRoster.filter(
    (p) => !summary.batsmenStats[p.id]?.out && p.id !== summary.striker && p.id !== summary.nonStriker
  );

  // These two are DERIVED from the ball log (not remembered flags), so they stay
  // correct after Undo, after a restart, and when the screen is re-opened.
  const mustPickBowler = needsNewBowler(innings); // an over just ended
  const inningsBreak = match.currentInnings === 1 && summary.isInningsOver;
  const bowlerModalOpen = mustPickBowler || changeBowlerOpen;
  const bowlerOpts = bowlerOptions(innings, bowlingRoster.map((p) => p.id));
  const overLines = recentOvers(innings, 1); // just the current over, or the last one if it has just finished
  const MAX_TOKENS = 12;
  const lastEntry = innings.balls[innings.balls.length - 1];
  const lastStrikeChange = lastEntry && lastEntry.type === "swap" ? lastEntry : null;

  const updateInnings = (updater) => {
    const updated = updater(innings);
    dispatch({ type: "UPDATE_MATCH", payload: { matchId, changes: { [inningsKey]: updated } } });
    return updated;
  };

  const finishMatch = (finishedSummary) => {
    const team1Runs = computeInningsSummary(match.innings1).totalRuns;
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
  };

  // Innings 1 ending is detected from state (inningsBreak). Only the end of
  // the match needs to be handled here.
  const afterBall = (updatedInnings) => {
    const s = computeInningsSummary(updatedInnings);
    if (s.isInningsOver && match.currentInnings === 2) finishMatch(s);
  };

  // Shot type + wagon wheel can be switched off by the scorer to save time.
  // Modes: "all" runs, "boundaries" (4 and 6 only), "off". (Matches saved with the old "except" mode count as "all".)
  const savedMode = match.wagonMode === "except" ? "all" : match.wagonMode;
  const wheelMode = savedMode || (match.wagonWheel === false ? "off" : "all");
  const wheelOn = wheelMode !== "off";
  const wantsShot = (runs) =>
    runs > 0 && (wheelMode === "all" || (wheelMode === "boundaries" && (runs === 4 || runs === 6)));
  const hand = (match.batterHand || {})[summary.striker] === "L" ? "L" : "R";
  const setWheelMode = (mode) => dispatch({ type: "UPDATE_MATCH", payload: { matchId, changes: { wagonMode: mode, wagonWheel: mode !== "off" } } });
  const setWheelOn = (on) => setWheelMode(on ? "all" : "off");
  const setHand = (h) =>
    dispatch({ type: "UPDATE_MATCH", payload: { matchId, changes: { batterHand: { ...(match.batterHand || {}), [summary.striker]: h } } } });

  const record = (input) => {
    setUndoNote(null);
    afterBall(updateInnings((inn) => recordBall(inn, input)));
  };

  // Runs off the bat: with the wheel on, ask where the ball went first.
  const score = (runs) => {
    if (wantsShot(runs)) {
      setShotSel({ shot: null, zone: null });
      setShotSheet({ runs });
      return;
    }
    record({ runs });
  };

  const commitShot = (sel) => {
    const runs = shotSheet.runs;
    setShotSheet(null);
    record({ runs, shot: sel.shot, zone: sel.zone });
  };

  // ---- Overthrow ----
  const openOverthrow = () => {
    setOtType("bat");
    setOtBase(0);
    setOtRuns(null);
    setShotSel({ shot: null, zone: null });
    setOtOpen(true);
  };
  const commitOverthrow = () => {
    if (!otRuns) {
      Alert.alert("Choose the overthrow runs");
      return;
    }
    setOtOpen(false);
    record({
      runs: otBase,
      extraType: otType === "bat" ? null : otType,
      overthrow: otRuns,
      overthrowType: otType,
      ...(otType === "bat" && wheelOn ? { shot: shotSel.shot, zone: shotSel.zone } : {}),
    });
  };

  // Extras can carry more than 1 run: tap the extra, then choose how many runs.
  const openExtra = (type) => {
    setNbRunType("bat");
    setExtraPicker(type);
  };

  const commitExtra = (n) => {
    const type = extraPicker;
    if (!type) return;
    setExtraPicker(null);
    setUndoNote(null);
    const input = type === "noball" ? { runs: n, extraType: "noball", noBallRunType: nbRunType } : { runs: n, extraType: type };
    afterBall(updateInnings((inn) => recordBall(inn, input)));
  };

  const openWicketModal = () => {
    setDismissalType(null);
    setNewBatsmanId(null);
    setFielderId(null);
    setWicketModal(true);
  };

  // Choosing "Stumped" pre-selects the wicketkeeper (if one is set).
  const chooseDismissal = (d) => {
    setDismissalType(d);
    setFielderId(d === "Stumped" && innings.keeperId ? innings.keeperId : null);
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
    setUndoNote(null);
    const updated = updateInnings((inn) =>
      recordBall(inn, {
        runs: 0,
        isWicket: true,
        dismissalType,
        fielderId: FIELDER_PROMPT[dismissalType] ? fielderId : null,
        newBatsmanId: needsNewBatsman ? newBatsmanId : null,
      })
    );
    setWicketModal(false);
    afterBall(updated);
  };

  // ---- Bowler: pick after an over, or change at any time ----
  const openChangeBowler = () => {
    setPendingBowlerId(null);
    setChangeBowlerOpen(true);
  };
  const closeChangeBowler = () => {
    setPendingBowlerId(null);
    setChangeBowlerOpen(false);
  };
  const confirmBowler = () => {
    if (!pendingBowlerId) {
      Alert.alert("Select a bowler");
      return;
    }
    // Choosing the bowler already bowling (when changing) does nothing.
    if (mustPickBowler || pendingBowlerId !== summary.currentBowlerId) {
      setUndoNote(null);
      updateInnings((inn) => setBowler(inn, pendingBowlerId));
    }
    closeChangeBowler();
  };

  // ---- Strike ----
  // The scorer can change strike at any time. A reason is optional.
  const openChangeStrike = () => {
    setStrikeChip(null);
    setStrikeNote("");
    setStrikeModal(true);
  };
  const confirmStrike = () => {
    const reason = [strikeChip, strikeNote.trim()].filter(Boolean).join(": ");
    setStrikeModal(false);
    setUndoNote(null);
    updateInnings((inn) => swapStrike(inn, reason));
  };

  // ---- Undo ----
  const undo = () => {
    const last = innings.balls[innings.balls.length - 1];
    if (!last) {
      Alert.alert("Nothing to undo");
      return;
    }
    setUndoNote(describeEntry(last, nameOf));
    updateInnings((inn) => undoLastBall(inn));
  };

  const startSecondInnings = () => {
    if (!ni2Striker || !ni2NonStriker || ni2Striker === ni2NonStriker || !ni2Bowler) {
      Alert.alert("Pick two openers and a bowler");
      return;
    }
    const innings2 = createInnings({
      battingTeamId: innings.bowlingTeamId,
      bowlingTeamId: innings.battingTeamId,
      strikerId: ni2Striker,
      nonStrikerId: ni2NonStriker,
      bowlerId: ni2Bowler,
      totalOvers: match.overs,
      target: computeInningsSummary(match.innings1).totalRuns + 1,
      keeperId: keeperOf(match, innings.battingTeamId),
    });
    dispatch({ type: "UPDATE_MATCH", payload: { matchId, changes: { currentInnings: 2, innings2 } } });
    setNi2Striker(null);
    setNi2NonStriker(null);
    setNi2Bowler(null);
  };

  const inn2BattingSquad = squadIds(match, teams, innings.bowlingTeamId);
  const inn2BowlingSquad = squadIds(match, teams, innings.battingTeamId);
  const inn2BattingRoster = poolOf(inn2BattingSquad, inn2BowlingSquad);
  const inn2BowlingRoster = poolOf(inn2BowlingSquad, inn2BattingSquad);

  return (
    <View style={styles.container}>
      <SponsorBanner tournament={tournament} />

      <ScrollView contentContainerStyle={{ padding: spacing.sm }}>
        <Card style={[styles.scoreCard, styles.tight]}>
          <Text style={styles.matchLabel}>
            {battingTeam?.name} vs {bowlingTeam?.name} · {match.overs} overs
          </Text>
          <Text style={styles.bigScore}>
            {summary.totalRuns}/{summary.wickets} <Text style={styles.oversText}>({summary.oversDisplay} ov)</Text>
          </Text>
          {innings.target != null && (
            <Text style={styles.target}>
              Target {innings.target} · Need {Math.max(innings.target - summary.totalRuns, 0)} runs from{" "}
              {Math.max(match.overs * 6 - summary.legalBallCount, 0)} balls
            </Text>
          )}
        </Card>

        <Card style={styles.tight}>
          <Row label="🏏 Striker" name={`${strikerName} *`} extra={`${strikerStats.runs} (${strikerStats.balls})`} />
          <Row label="Non-striker" name={nonStrikerName} extra={`${nonStrikerStats.runs} (${nonStrikerStats.balls})`} />
          <Row
            label="🎯 Bowler"
            name={bowlerName}
            extra={`${bowlerStats.wickets}/${bowlerStats.runs} (${Math.floor(bowlerStats.balls / 6)}.${bowlerStats.balls % 6})`}
          />
          <View style={styles.quickRow}>
            <QuickButton label="⇄ Change Strike" onPress={openChangeStrike} />
            <QuickButton label="🎯 Change Bowler" onPress={openChangeBowler} />
            {access.correctionSides(match).length ? (
              <QuickButton label="🛠 Fix an over" onPress={() => navigation.navigate("Corrections", { matchId, tab: "bowler", innings: match.currentInnings })} />
            ) : null}
          </View>
          {lastStrikeChange ? (
            <Text style={styles.strikeLine}>
              ⇄ Strike changed by scorer{lastStrikeChange.reason ? `: ${lastStrikeChange.reason}` : ""}
            </Text>
          ) : null}
        </Card>

        {undoNote ? (
          <View style={[styles.undoNote, { flexDirection: "row", alignItems: "center" }]}>
            <Text style={[styles.undoNoteText, { flex: 1 }]}>↩️ Undid: {undoNote}. Check striker and bowler above.</Text>
            <Pressable onPress={() => setUndoNote(null)} hitSlop={8}>
              <Text style={{ color: colors.textMuted, fontWeight: "700" }}>Dismiss</Text>
            </Pressable>
          </View>
        ) : null}

        <Card style={styles.tight}>
          <Text style={styles.overLine} numberOfLines={1}>
            {overLines.length ? (
              <>
                <Text style={styles.overNo}>Ov {overLines[0].over}: </Text>
                {overLines[0].tokens.length > MAX_TOKENS ? "… " : ""}
                {overLines[0].tokens.slice(-MAX_TOKENS).map((t, j, arr) => (
                  <Text key={j} style={j === arr.length - 1 ? styles.lastBall : undefined}>
                    {t}{j < arr.length - 1 ? ", " : ""}
                  </Text>
                ))}
              </>
            ) : (
              <Text style={styles.overNo}>Ov 1: no balls yet</Text>
            )}
          </Text>
        </Card>

        <Card style={styles.tight}>
          <View style={styles.modeRow}>
            <Text style={styles.wheelToggleText}>🎯 Shots:</Text>
            {[["all", "All"], ["boundaries", "4 & 6"], ["off", "Off"]].map(([k, label]) => (
              <Pressable key={k} onPress={() => setWheelMode(k)} style={[styles.wheelToggle, wheelMode === k && styles.wheelToggleOn]}>
                <Text style={[styles.wheelToggleText, wheelMode === k && { color: "#fff" }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.runBlock}>
            {[[0, 1, 2], [3, 4, 6]].map((row) => (
              <View key={row.join("")} style={styles.runRow}>
                {row.map((r) => (
                  <Pressable key={r} onPress={() => score(r)} style={[styles.runButtonBig, (r === 4 || r === 6) && styles.boundaryButton]}>
                    <Text style={[styles.runButtonBigText, (r === 4 || r === 6) && { color: "#fff" }]}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.extrasRow}>
            <ExtraButton label="Wide" onPress={() => openExtra("wide")} />
            <ExtraButton label="No Ball" onPress={() => openExtra("noball")} />
            <ExtraButton label="Bye" onPress={() => openExtra("bye")} />
            <ExtraButton label="Leg Bye" onPress={() => openExtra("legbye")} />
            <ExtraButton label="Overthrow" onPress={openOverthrow} />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
            <Button title="🔴 Wicket" variant="danger" onPress={openWicketModal} style={{ flex: 1, paddingVertical: 12 }} />
            <Button title="↩️ Undo" variant="outline" onPress={undo} style={{ flex: 1, paddingVertical: 12 }} />
          </View>
        </Card>
      </ScrollView>

      {/* Wicket */}
      <Modal visible={wicketModal} transparent animationType="slide" onRequestClose={() => setWicketModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <ScrollView>
              <Text style={typography.h3}>How was {strikerName} out?</Text>
              <View style={styles.chipRow}>
                {DISMISSAL_TYPES.map((d) => (
                  <Pressable key={d} onPress={() => chooseDismissal(d)} style={[styles.chip, dismissalType === d && styles.chipActive]}>
                    <Text style={[styles.chipText, dismissalType === d && { color: "#fff" }]}>{d}</Text>
                  </Pressable>
                ))}
              </View>

              {FIELDER_PROMPT[dismissalType] ? (
                <>
                  <Text style={[typography.h3, { marginTop: spacing.md }]}>{FIELDER_PROMPT[dismissalType]}</Text>
                  <View style={styles.chipRow}>
                    {bowlingRoster.map((p) => (
                      <Pressable key={p.id} onPress={() => setFielderId(fielderId === p.id ? null : p.id)} style={[styles.chip, fielderId === p.id && styles.chipActive]}>
                        <Text style={[styles.chipText, fielderId === p.id && { color: "#fff" }]}>{p.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {dismissalType === "Caught" && fielderId && fielderId === summary.currentBowlerId ? (
                    <Text style={[typography.muted, { marginTop: spacing.xs }]}>Caught and bowled</Text>
                  ) : null}
                </>
              ) : null}

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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Wicketkeeper */}
      <Modal visible={keeperModal} transparent animationType="slide" onRequestClose={() => setKeeperModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={typography.h3}>Who is the wicketkeeper?</Text>
            <Text style={typography.muted}>Used for stumpings and keeping stats. You can change it any time.</Text>
            <View style={styles.chipRow}>
              {bowlingRoster.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    updateInnings((inn) => setKeeper(inn, p.id));
                    setKeeperModal(false);
                  }}
                  style={[styles.chip, innings.keeperId === p.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, innings.keeperId === p.id && { color: "#fff" }]}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ height: spacing.md }} />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button
                title="No keeper"
                variant="outline"
                onPress={() => {
                  updateInnings((inn) => setKeeper(inn, null));
                  setKeeperModal(false);
                }}
                style={{ flex: 1 }}
              />
              <Button title="Close" onPress={() => setKeeperModal(false)} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Change strike: reason is optional */}
      <Modal visible={strikeModal} transparent animationType="slide" onRequestClose={() => setStrikeModal(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalSheet}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={typography.h3}>Change strike</Text>
              <Text style={[typography.body, { marginTop: spacing.xs }]}>
                {strikerName} <Text style={typography.muted}>(on strike)</Text>  →  {nonStrikerName}
              </Text>

              <Text style={[typography.label, { marginTop: spacing.md }]}>REASON (OPTIONAL)</Text>
              <View style={styles.chipRow}>
                {STRIKE_REASONS.map((r) => (
                  <Pressable key={r} onPress={() => setStrikeChip(strikeChip === r ? null : r)} style={[styles.chip, strikeChip === r && styles.chipActive]}>
                    <Text style={[styles.chipText, strikeChip === r && { color: "#fff" }]}>{r}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.noteInput}
                value={strikeNote}
                onChangeText={setStrikeNote}
                maxLength={90}
                placeholder="Add a note (optional)"
                placeholderTextColor={colors.textMuted}
              />

              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                <Button title="Cancel" variant="outline" onPress={() => setStrikeModal(false)} style={{ flex: 1 }} />
                <Button title="Change Strike" onPress={confirmStrike} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Shot + direction for runs off the bat (scorer can skip, or switch this off) */}
      <Modal visible={!!shotSheet} transparent animationType="slide" onRequestClose={() => setShotSheet(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <ScrollView>
              <Text style={typography.h3}>{shotSheet ? `${shotSheet.runs} run${shotSheet.runs === 1 ? "" : "s"}` : ""} · {strikerName}</Text>
              <Text style={[typography.muted, { marginBottom: spacing.sm }]}>
                Tap a direction to save. Pick the shot first if you want it recorded too.{shotSel.shot || shotSel.zone ? `  ${shotLabel(shotSel.shot, shotSel.zone)}` : ""}
              </Text>
              <ShotPicker value={shotSel} onChange={setShotSel} hand={hand} onHand={setHand} onZonePress={(zone) => commitShot({ shot: shotSel.shot, zone })} />
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                <Button title="Skip" variant="outline" onPress={() => commitShot({ shot: null, zone: null })} style={{ flex: 1 }} />
                <Button title="Save shot only" onPress={() => commitShot(shotSel)} disabled={!shotSel.shot} style={{ flex: 1 }} />
              </View>
              <Pressable onPress={() => { setWheelMode("off"); commitShot({ shot: null, zone: null }); }} style={{ alignItems: "center", paddingVertical: spacing.md }}>
                <Text style={{ color: colors.textMuted, fontWeight: "700" }}>Turn off for the rest of the match (save time)</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Overthrow: runs run before it, the overthrow runs, and how they are credited */}
      <Modal visible={otOpen} transparent animationType="slide" onRequestClose={() => setOtOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <ScrollView>
              <Text style={typography.h3}>Overthrow</Text>
              <Text style={typography.muted}>The runs after a misfield or bad throw are added to the runs already run. Choose how they are credited.</Text>

              <Text style={[typography.label, { marginTop: spacing.md }]}>OVERTHROW RUNS COME FROM</Text>
              <View style={styles.chipRow}>
                {[["bat", "Off the bat"], ["bye", "Byes"], ["legbye", "Leg byes"]].map(([k, label]) => (
                  <Pressable key={k} onPress={() => setOtType(k)} style={[styles.chip, otType === k && styles.chipActive]}>
                    <Text style={[styles.chipText, otType === k && { color: "#fff" }]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[typography.label, { marginTop: spacing.md }]}>RUNS RUN BEFORE THE OVERTHROW</Text>
              <View style={styles.chipRow}>
                {[0, 1, 2, 3, 4].map((n) => (
                  <Pressable key={n} onPress={() => setOtBase(n)} style={[styles.chip, otBase === n && styles.chipActive]}>
                    <Text style={[styles.chipText, otBase === n && { color: "#fff" }]}>{n}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[typography.label, { marginTop: spacing.md }]}>OVERTHROW RUNS</Text>
              <View style={styles.chipRow}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Pressable key={n} onPress={() => setOtRuns(n)} style={[styles.chip, otRuns === n && styles.chipActive]}>
                    <Text style={[styles.chipText, otRuns === n && { color: "#fff" }]}>+{n}</Text>
                  </Pressable>
                ))}
              </View>
              {otRuns ? (
                <Text style={[typography.body, { marginTop: spacing.md, fontWeight: "700" }]}>
                  {otBase + otRuns} runs in total ({otType === "bat" ? "to the batter" : otType === "bye" ? "byes" : "leg byes"})
                </Text>
              ) : null}

              {otType === "bat" && wheelOn ? (
                <View style={{ marginTop: spacing.md }}>
                  <ShotPicker value={shotSel} onChange={setShotSel} hand={hand} onHand={setHand} />
                </View>
              ) : null}

              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                <Button title="Cancel" variant="outline" onPress={() => setOtOpen(false)} style={{ flex: 1 }} />
                <Button title="Add runs" onPress={commitOverthrow} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Extras: choose how many runs */}
      <Modal visible={!!extraPicker} transparent animationType="slide" onRequestClose={() => setExtraPicker(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {extraPicker ? (
              <>
                <Text style={typography.h3}>{EXTRA_INFO[extraPicker].title}</Text>
                <Text style={typography.muted}>{EXTRA_INFO[extraPicker].hint}</Text>

                {extraPicker === "noball" ? (
                  <View style={[styles.chipRow, { marginTop: spacing.md }]}>
                    {NB_TYPES.map((o) => (
                      <Pressable key={o.value} onPress={() => setNbRunType(o.value)} style={[styles.chip, nbRunType === o.value && styles.chipActive]}>
                        <Text style={[styles.chipText, nbRunType === o.value && { color: "#fff" }]}>{o.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <View style={[styles.runGrid, { marginTop: spacing.md }]}>
                  {extraOptions(extraPicker, nbRunType).map((n) => {
                    const penalty = EXTRA_INFO[extraPicker].penalty;
                    return (
                      <Pressable key={n} onPress={() => commitExtra(n)} style={styles.extraChoice}>
                        <Text style={styles.runButtonText}>{penalty ? `+${n}` : n}</Text>
                        <Text style={styles.chipSub}>
                          {n + penalty} {n + penalty === 1 ? "run" : "runs"} total
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
            <View style={{ height: spacing.md }} />
            <Button title="Cancel" variant="outline" onPress={() => setExtraPicker(null)} />
          </View>
        </View>
      </Modal>

      {/* Bowler: required after every over, optional "change" any other time */}
      <Modal visible={bowlerModalOpen} transparent animationType="slide" onRequestClose={() => !mustPickBowler && closeChangeBowler()}>
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalSheet} contentContainerStyle={{ paddingBottom: spacing.md }}>
            {mustPickBowler ? (
              <>
                <Text style={typography.h3}>Over {summary.currentOverIndex} complete: who bowls next?</Text>
                <Text style={typography.muted}>
                  {summary.totalRuns}/{summary.wickets} after {summary.oversDisplay} overs
                </Text>
              </>
            ) : (
              <>
                <Text style={typography.h3}>Change bowler</Text>
                <Text style={typography.muted}>
                  Currently {bowlerName}. The new bowler takes the remaining balls of this over; balls already bowled stay with the original bowler.
                </Text>
              </>
            )}

            {bowlingListMissing ? (
              <Text style={[styles.undoNoteText, { marginTop: spacing.sm }]}>
                No players are listed for {bowlingTeam?.name || "the bowling side"} in this match, so everyone else is shown. Pick the bowler, or add the squad later with Edit match details.
              </Text>
            ) : null}
            <View style={styles.chipRow}>
              {bowlingRoster.map((p) => {
                const blocked = bowlerOpts[p.id].blocked;
                const st = summary.bowlerStats[p.id];
                const ov = st ? `${Math.floor(st.balls / 6)}.${st.balls % 6} ov` : "0 ov";
                const active = pendingBowlerId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    disabled={blocked}
                    onPress={() => setPendingBowlerId(p.id)}
                    style={[styles.bowlerChip, active && styles.chipActive, blocked && styles.chipDisabled]}
                  >
                    <Text style={[styles.chipText, active && { color: "#fff" }]}>{p.name}</Text>
                    <Text style={[styles.chipSub, active && { color: "#E3F1E9" }]}>{blocked ? bowlerOpts[p.id].why : ov}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: spacing.md }} />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {!mustPickBowler && <Button title="Cancel" variant="outline" onPress={closeChangeBowler} style={{ flex: 1 }} />}
              <Button title="Confirm Bowler" onPress={confirmBowler} style={{ flex: 1 }} />
            </View>
            {mustPickBowler && (
              <Pressable onPress={undo} style={{ alignItems: "center", marginTop: spacing.md }}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>↩️ Undo last ball instead</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Innings break: shown whenever innings 1 is over */}
      <Modal visible={inningsBreak} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalSheet}>
            <Text style={typography.h3}>Innings 1 complete: set up innings 2</Text>
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
            <Pressable onPress={undo} style={{ alignItems: "center", marginTop: spacing.md, marginBottom: spacing.md }}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>↩️ Undo last ball instead</Text>
            </Pressable>
          </ScrollView>
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
      <Text style={styles.extraButtonText} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </Pressable>
  );
}

function QuickButton({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.quickBtn}>
      <Text style={styles.quickBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs },
  overLine: { fontSize: 14, color: colors.text, lineHeight: 20, height: 20 },
  overNo: { fontWeight: "800", color: colors.textMuted },
  lastBall: { fontWeight: "900", color: colors.primary, textDecorationLine: "underline" },
  container: { flex: 1, backgroundColor: colors.background },
  scoreCard: { alignItems: "center", backgroundColor: colors.primary },
  matchLabel: { color: "#CFE3D8", fontSize: 13, fontWeight: "600" },
  bigScore: { color: "#fff", fontSize: 32, fontWeight: "800" },
  oversText: { fontSize: 16, fontWeight: "600" },
  target: { color: "#fff", fontSize: 12 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 },
  tight: { padding: spacing.sm, marginBottom: spacing.xs },
  quickRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  quickBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm, alignItems: "center" },
  quickBtnText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  keeperRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  strikeLine: { marginTop: spacing.sm, color: colors.textMuted, fontSize: 12, fontStyle: "italic" },
  noteInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, fontSize: 15, color: colors.text, marginTop: spacing.md },
  undoNote: { backgroundColor: "#FFF6DB", borderColor: colors.accent, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs },
  undoNoteText: { color: colors.text, fontSize: 13 },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.xs },
  wheelToggle: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  wheelToggleOn: { backgroundColor: colors.primary },
  wheelToggleText: { color: colors.primary, fontWeight: "700", fontSize: 11 },
  runBlock: { gap: spacing.xs },
  runRow: { flexDirection: "row", gap: spacing.xs },
  runButtonBig: { flex: 1, height: 58, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  runButtonBigText: { fontSize: 26, fontWeight: "800", color: colors.text },
  runGrid: { flexDirection: "row", gap: spacing.xs },
  runButton: { flex: 1, height: 52, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  boundaryButton: { backgroundColor: colors.accent, borderColor: colors.accent },
  runButtonText: { fontSize: 22, fontWeight: "800", color: colors.text },
  extraChoice: { width: "30%", paddingVertical: spacing.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  extrasRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
  extraButton: { flex: 1, borderWidth: 1, borderColor: colors.info, borderRadius: radius.pill, paddingHorizontal: 2, paddingVertical: 9, alignItems: "center", justifyContent: "center" },
  extraButtonText: { color: colors.info, fontWeight: "700", fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: "85%" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bowlerChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: "center", minWidth: 96 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDisabled: { opacity: 0.35 },
  chipText: { color: colors.text, fontWeight: "600" },
  chipSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
});
