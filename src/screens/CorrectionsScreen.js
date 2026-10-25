import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import { squadIds, keeperOf, roleTag } from "../utils/squads";
import {
  replacePlayer, replacementCandidates, sideOfPlayer,
  wicketsOf, allowedDismissals, needsFielder, canHaveFielder, changeDismissal,
  oversOf, validateOverBowler, changeOverBowler, bowlersUsed, replaceBowler,
} from "../utils/corrections";

const TABS = [["player", "Replace player"], ["wicket", "Wickets"], ["bowler", "Bowlers"]];

function Chip({ label, sub, active, disabled, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}>
      <Text style={[styles.chipText, active && { color: "#fff" }]}>{label}</Text>
      {sub ? <Text style={[styles.chipSub, active && { color: "#fff" }]}>{sub}</Text> : null}
    </Pressable>
  );
}

// Captain corrections: replace a player in the whole match, change how a batter
// was out (and who caught or stumped him), and change who bowled an over.
// Works while the match is live and after it has finished.
export default function CorrectionsScreen({ route }) {
  const { matchId } = route.params;
  const { matches, teams, players } = useAppState();
  const dispatch = useAppDispatch();
  const access = useAccess();
  const [tab, setTab] = useState(route.params.tab || "player");
  const [innNo, setInnNo] = useState(route.params.innings || 1);

  const match = matches.find((m) => m.id === matchId);
  const sides = match ? access.correctionSides(match) : [];
  if (!match || !match.innings1 || !sides.length) {
    return (
      <View style={styles.page}>
        <Card><Text style={typography.body}>Only a team captain, the person who scores the match, or an admin can correct a match.</Text></Card>
      </View>
    );
  }

  const nameOf = (id) => (players.find((p) => p.id === id) || {}).name || "Unknown";
  const tagged = (id) => nameOf(id) + roleTag(match, id);
  const teamOfSide = (side) => teams.find((t) => t.id === (side === "A" ? match.teamAId : match.teamBId));
  const save = (changes, done) => {
    dispatch({ type: "UPDATE_MATCH", payload: { matchId: match.id, changes } });
    if (done) Alert.alert("Saved", done);
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={[typography.muted, { marginBottom: spacing.sm }]}>
          {match.status === "completed" ? "This match is finished. Corrections update the scorecard and everyone's stats." : "Corrections apply straight away, even while the match is live."}
          {" "}Runs and the result never change.
        </Text>
        <View style={styles.tabs}>
          {TABS.map(([k, label]) => (
            <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabActive]}>
              <Text style={[styles.tabText, tab === k && { color: "#fff" }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === "player" ? (
          <ReplaceTab {...{ match, teams, players, sides, access, tagged, nameOf, teamOfSide, save }} />
        ) : (
          <>
            {match.innings1 && match.innings2 ? (
              <View style={styles.tabs}>
                {[1, 2].map((n) => {
                  const inn = n === 1 ? match.innings1 : match.innings2;
                  const t = teams.find((x) => x.id === inn.battingTeamId);
                  return (
                    <Pressable key={n} onPress={() => setInnNo(n)} style={[styles.tab, innNo === n && styles.tabActive]}>
                      <Text style={[styles.tabText, innNo === n && { color: "#fff" }]} numberOfLines={1}>{t ? t.name : `Innings ${n}`} batting</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <InningsTab {...{ match, teams, tab, innNo: match.innings2 ? innNo : 1, sides, nameOf, tagged, save }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ReplaceTab({ match, teams, players, sides, access, tagged, nameOf, teamOfSide, save }) {
  const [fromId, setFromId] = useState(null);
  const [toId, setToId] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const squads = sides.map((s) => ({ side: s, team: teamOfSide(s), ids: squadIds(match, teams, s === "A" ? match.teamAId : match.teamBId) }));
  const side = fromId ? sideOfPlayer(match, fromId, teams) : null;
  const team = side ? teamOfSide(side) : null;
  // Stand-ins: the team's other players first, then the players this account added.
  const pool = [];
  const seen = new Set();
  const add = (p) => { if (p && !seen.has(p.id)) { seen.add(p.id); pool.push(p); } };
  ((team && team.playerIds) || []).forEach((id) => add(players.find((p) => p.id === id)));
  (access.mine.players || []).forEach((p) => add(players.find((x) => x.id === p.id) || p));
  let candidates = replacementCandidates(match, pool);
  if (q.trim()) candidates = candidates.filter((p) => (p.name || "").toLowerCase().includes(q.trim().toLowerCase()));

  const apply = () => {
    const r = replacePlayer(match, fromId, toId, teams);
    if (r.error) return setError(r.error);
    setError("");
    save(r.changes, `${nameOf(toId)} now plays in place of ${nameOf(fromId)} for the whole match.`);
    setFromId(null);
    setToId(null);
  };

  return (
    <>
      <Card>
        <Text style={typography.h3}>1. Who is being replaced?</Text>
        {squads.map((s) => (
          <View key={s.side} style={{ marginTop: spacing.sm }}>
            <Text style={typography.label}>{(s.team ? s.team.name : `Team ${s.side}`).toUpperCase()}</Text>
            <View style={styles.chipRow}>
              {s.ids.map((id) => (
                <Chip key={id} label={tagged(id)} active={fromId === id} onPress={() => { setFromId(fromId === id ? null : id); setToId(null); setError(""); }} />
              ))}
            </View>
          </View>
        ))}
      </Card>
      {fromId ? (
        <Card>
          <Text style={typography.h3}>2. Who takes {nameOf(fromId)}'s place?</Text>
          <Text style={[typography.muted, { marginTop: 2 }]}>Players already in this match are not listed, so nobody plays for both teams.</Text>
          <FormField placeholder="Search by name" value={q} onChangeText={setQ} style={{ marginTop: spacing.sm }} />
          <View style={styles.chipRow}>
            {candidates.map((p) => (
              <Chip key={p.id} label={p.name} active={toId === p.id} onPress={() => { setToId(toId === p.id ? null : p.id); setError(""); }} />
            ))}
            {candidates.length === 0 ? <Text style={typography.muted}>No one else is available.</Text> : null}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {toId ? (
            <Button
              title={`Replace ${nameOf(fromId)} with ${nameOf(toId)}`}
              onPress={() =>
                Alert.alert("Replace player?", `${nameOf(toId)} takes over everything ${nameOf(fromId)} did in this match: squad place, batting, bowling and catches.`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Replace", onPress: apply },
                ])
              }
              style={{ marginTop: spacing.md }}
            />
          ) : null}
        </Card>
      ) : null}
    </>
  );
}

function InningsTab({ match, teams, tab, innNo, sides, nameOf, tagged, save }) {
  const key = innNo === 1 ? "innings1" : "innings2";
  const innings = match[key];
  const [wicketIdx, setWicketIdx] = useState(null);
  const [type, setType] = useState(null);
  const [fielder, setFielder] = useState(null);
  const [error, setError] = useState("");
  const [repFrom, setRepFrom] = useState(null);
  const [repTo, setRepTo] = useState(null);
  if (!innings) return null;

  const bowlingTeamId = innings.bowlingTeamId;
  const fieldingSide = bowlingTeamId === match.teamAId ? "A" : "B";
  const bowlingIds = squadIds(match, teams, bowlingTeamId);
  const ctx = { bowlingIds, keeperId: innings.keeperId || keeperOf(match, bowlingTeamId) };
  const bowlingTeam = teams.find((t) => t.id === bowlingTeamId);

  if (!sides.includes(fieldingSide)) {
    return (
      <Card>
        <Text style={typography.body}>
          Bowling and fielding in this innings belong to {bowlingTeam ? bowlingTeam.name : "the other team"}. Only its captain can change them.
        </Text>
      </Card>
    );
  }

  if (tab === "wicket") {
    const wickets = wicketsOf(innings);
    const openW = wickets.find((w) => w.index === wicketIdx);
    const ball = openW ? innings.balls[openW.index] : null;
    const pick = (w) => {
      setWicketIdx(wicketIdx === w.index ? null : w.index);
      setType(w.type);
      setFielder(w.fielderId);
      setError("");
    };
    const apply = () => {
      const r = changeDismissal(innings, openW.index, type, fielder, ctx);
      if (r.error) return setError(r.error);
      setError("");
      save({ [key]: r.innings }, `${nameOf(openW.outId)} is now out ${type}.`);
      setWicketIdx(null);
    };
    return (
      <Card>
        <Text style={typography.h3}>Wickets</Text>
        {wickets.length === 0 ? <Text style={[typography.muted, { marginTop: spacing.xs }]}>No wickets fell in this innings.</Text> : null}
        {wickets.map((w, i) => (
          <View key={w.index}>
            <Pressable onPress={() => pick(w)} style={styles.rowItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{i + 1}. {tagged(w.outId)}</Text>
                <Text style={styles.sub}>
                  {w.type || "Out"}{w.fielderId ? ` · ${nameOf(w.fielderId)}` : ""} · b {nameOf(w.bowlerId)} · {w.overs} ov
                </Text>
              </View>
              <Text style={styles.edit}>{openW && openW.index === w.index ? "Close" : "Change"}</Text>
            </Pressable>
            {openW && openW.index === w.index ? (
              <View style={styles.panel}>
                <Text style={typography.label}>HOW WAS HE OUT?</Text>
                <View style={styles.chipRow}>
                  {allowedDismissals(ball).map((d) => (
                    <Chip key={d} label={d} active={type === d} onPress={() => { setType(d); if (!canHaveFielder(d)) setFielder(null); setError(""); }} />
                  ))}
                </View>
                {type && canHaveFielder(type) ? (
                  <>
                    <Text style={[typography.label, { marginTop: spacing.md }]}>
                      {type === "Caught" ? "CAUGHT BY" : type === "Stumped" ? "STUMPED BY (WICKETKEEPER)" : "RUN OUT BY (OPTIONAL)"}
                    </Text>
                    <View style={styles.chipRow}>
                      {bowlingIds.map((id) => (
                        <Chip key={id} label={tagged(id)} active={fielder === id} onPress={() => { setFielder(fielder === id ? null : id); setError(""); }} />
                      ))}
                    </View>
                    {type === "Caught" && fielder && fielder === w.bowlerId ? <Text style={styles.sub}>Caught and bowled</Text> : null}
                  </>
                ) : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button title="Save change" onPress={apply} style={{ marginTop: spacing.md }} />
              </View>
            ) : null}
          </View>
        ))}
      </Card>
    );
  }

  // Bowlers
  const overs = oversOf(innings);
  const used = bowlersUsed(innings);
  const doReplace = () => {
    const r = replaceBowler(innings, repFrom, repTo, ctx);
    if (r.error) return setError(r.error);
    setError("");
    save({ [key]: r.innings }, `${nameOf(repTo)} now has every over ${nameOf(repFrom)} bowled.`);
    setRepFrom(null);
    setRepTo(null);
  };
  return (
    <>
    <Card>
      <Text style={typography.h3}>Picked the wrong bowler?</Text>
      <Text style={[typography.muted, { marginTop: 2 }]}>Swap him for anyone in the playing squad, in all the overs he bowled.</Text>
      <Text style={[styles.sub, { marginTop: spacing.sm }]}>WRONG BOWLER</Text>
      <View style={styles.chipRow}>
        {used.map((b) => (
          <Chip key={b.id} label={tagged(b.id)} sub={`${b.overs} over${b.overs === 1 ? "" : "s"}`} active={repFrom === b.id} onPress={() => { setRepFrom(b.id); setError(""); }} />
        ))}
      </View>
      {repFrom ? (
        <>
          <Text style={[styles.sub, { marginTop: spacing.sm }]}>REPLACE WITH</Text>
          <View style={styles.chipRow}>
            {bowlingIds.filter((id) => id !== repFrom).map((id) => (
              <Chip key={id} label={tagged(id)} active={repTo === id} onPress={() => { setRepTo(id); setError(""); }} />
            ))}
          </View>
        </>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {repFrom && repTo ? <Button title={`Replace ${nameOf(repFrom)} with ${nameOf(repTo)}`} onPress={doReplace} style={{ marginTop: spacing.md }} /> : null}
    </Card>
    <Card>
      <Text style={typography.h3}>Who bowled each over</Text>
      <Text style={[typography.muted, { marginTop: 2 }]}>A bowler cannot bowl two overs in a row.</Text>
      {overs.map((o) => (
        <View key={o.over} style={styles.overBlock}>
          <Text style={styles.name}>
            Over {o.over + 1} · {o.bowlerIds.map(nameOf).join(" / ")}
            <Text style={styles.sub}>  ({o.balls} ball{o.balls === 1 ? "" : "s"}{o.split ? ", bowler changed mid-over" : ""})</Text>
          </Text>
          <View style={styles.chipRow}>
            {bowlingIds.map((id) => {
              const err = validateOverBowler(innings, o.over, id, ctx);
              const current = o.bowlerIds.length === 1 && o.bowlerId === id;
              return (
                <Chip
                  key={id}
                  label={tagged(id)}
                  active={current}
                  disabled={!!err && !current}
                  onPress={() => {
                    if (current) return;
                    if (err) return Alert.alert("Not allowed", err);
                    const r = changeOverBowler(innings, o.over, id, ctx);
                    if (r.error) return Alert.alert("Not allowed", r.error);
                    save({ [key]: r.innings });
                  }}
                />
              );
            })}
          </View>
        </View>
      ))}
    </Card>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  tab: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: spacing.sm, alignItems: "center" },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDisabled: { opacity: 0.35 },
  chipText: { color: colors.text, fontWeight: "600" },
  chipSub: { color: colors.textMuted, fontSize: 11 },
  rowItem: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  edit: { color: colors.primary, fontWeight: "800" },
  panel: { paddingVertical: spacing.sm },
  overBlock: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  error: { color: "#C62828", fontWeight: "700", marginTop: spacing.sm },
});
