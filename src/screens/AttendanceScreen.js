import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { useAuth } from "../auth/AuthContext";
import { playerMatchesUser } from "../auth/identity";
import { STATUSES, statusInfo, availabilityOf } from "../utils/availability";
import { XI_SIZE, attendanceOf, isLocked, squadOfSide, inConfirmedXI, validateXI } from "../utils/attendance";
import Card from "../components/Card";
import Button from "../components/Button";
import { colors, spacing, typography, radius } from "../utils/theme";

function Side({ match, side, team, players, teams, canManage, mineIds, dispatch }) {
  const att = useMemo(() => attendanceOf(match, side, teams, players), [match, side, teams, players]);
  const locked = isLocked(match, side);
  const current = squadOfSide(match, side);
  const [editing, setEditing] = useState(!locked);
  const [ids, setIds] = useState(() => (current.length ? current : []));
  const [captainId, setCaptainId] = useState((side === "A" ? match.captainA : match.captainB) || null);
  const [keeperId, setKeeperId] = useState((side === "A" ? match.keeperA : match.keeperB) || null);
  const [error, setError] = useState("");
  if (!team) return null;

  const roster = [...att.yes, ...att.maybe, ...att.none, ...att.no];
  const answerFor = (p, status) => dispatch({ type: "SET_AVAILABILITY", payload: { playerId: p.id, matchId: match.id, status } });
  const toggle = (id) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= XI_SIZE ? ids : [...ids, id]);

  const confirm = () => {
    const other = squadOfSide(match, side === "A" ? "B" : "A");
    const both = ids.filter((id) => other.includes(id));
    if (both.length) return setError(`${both.map((id) => (players.find((p) => p.id === id) || {}).name).join(", ")} is already in the other team's XI.`);
    const err = validateXI({ ids, captainId, keeperId });
    if (err) return setError(err);
    setError("");
    const k = side === "A" ? { squadA: ids, captainA: captainId, keeperA: keeperId, lockedA: true } : { squadB: ids, captainB: captainId, keeperB: keeperId, lockedB: true };
    dispatch({ type: "UPDATE_MATCH", payload: { matchId: match.id, changes: k } });
    setEditing(false);
    Alert.alert("XI confirmed", `${ids.length} players are in for ${team.name}. They can no longer withdraw themselves; only the captain can change the XI.`);
  };

  const RolePick = ({ label, value, onPick }) => (
    <View style={{ marginTop: spacing.sm }}>
      <Text style={typography.label}>{label}</Text>
      <View style={styles.chips}>
        {ids.map((id) => {
          const p = players.find((x) => x.id === id);
          return p ? (
            <Pressable key={id} onPress={() => onPick(id)} style={[styles.chip, value === id && styles.chipOn]}>
              <Text style={[styles.chipText, value === id && { color: "#fff" }]}>{p.name}</Text>
            </Pressable>
          ) : null;
        })}
      </View>
    </View>
  );

  return (
    <Card>
      <Text style={typography.h3}>{team.name}</Text>
      <Text style={typography.muted}>✅ {att.yes.length} available · ❓ {att.maybe.length} maybe · ❌ {att.no.length} not available · no reply {att.none.length}</Text>

      {mineIds.map((pid) => {
        const p = roster.find((x) => x.id === pid);
        if (!p) return null;
        const lockedIn = inConfirmedXI(match, pid) && !canManage;
        return (
          <View key={pid} style={styles.mine}>
            <Text style={styles.mineTitle}>{lockedIn ? `You're in the XI, ${p.name}` : `Are you available, ${p.name}?`}</Text>
            {lockedIn ? (
              <Text style={typography.muted}>The captain has confirmed the XI, so you can't withdraw yourself. Contact your captain if something has come up.</Text>
            ) : (
              <View style={styles.chips}>
                {STATUSES.map((st) => {
                  const on = availabilityOf(p, match.id) === st.key;
                  return (
                    <Pressable key={st.key} onPress={() => answerFor(p, on ? null : st.key)} style={[styles.chip, on && styles.chipOn]}>
                      <Text style={[styles.chipText, on && { color: "#fff" }]}>{st.icon} {st.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {roster.length ? (
        <View style={{ marginTop: spacing.sm }}>
          {roster.map((p) => {
            const st = statusInfo(availabilityOf(p, match.id));
            const inXI = current.includes(p.id) && locked;
            return (
              <View key={p.id} style={styles.row}>
                <Text style={{ width: 28 }}>{st ? st.icon : "·"}</Text>
                <Text style={[typography.body, { flex: 1 }]}>{p.name}</Text>
                {inXI ? <Text style={styles.xi}>XI</Text> : null}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>This team has no players yet.</Text>
      )}

      {canManage ? (
        <View style={styles.manage}>
          <Text style={typography.label}>{locked ? "FINAL XI (CONFIRMED)" : `PICK THE FINAL XI (${ids.length}/${XI_SIZE})`}</Text>
          {locked && !editing ? (
            <>
              <Text style={typography.muted}>{current.map((id) => (players.find((p) => p.id === id) || {}).name).filter(Boolean).join(", ")}</Text>
              <Button title="Change the XI" variant="outline" onPress={() => { setIds(current); setEditing(true); }} style={{ marginTop: spacing.sm }} />
            </>
          ) : (
            <>
              <Text style={[typography.muted, { marginBottom: spacing.xs }]}>Tap players to pick up to {XI_SIZE}. Players who said Available are shown first.</Text>
              <View style={styles.chips}>
                {roster.map((p) => {
                  const on = ids.includes(p.id);
                  const st = statusInfo(availabilityOf(p, match.id));
                  return (
                    <Pressable key={p.id} onPress={() => toggle(p.id)} style={[styles.chip, on && styles.chipOn]}>
                      <Text style={[styles.chipText, on && { color: "#fff" }]}>{on ? "✓ " : ""}{st ? `${st.icon} ` : ""}{p.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <RolePick label="CAPTAIN" value={captainId} onPick={setCaptainId} />
              <RolePick label="WICKETKEEPER" value={keeperId} onPick={setKeeperId} />
              {error ? <Text style={{ color: colors.danger, marginTop: spacing.sm }}>{error}</Text> : null}
              <Button title={locked ? "Update the XI" : "Confirm the XI"} onPress={confirm} style={{ marginTop: spacing.md }} />
            </>
          )}
        </View>
      ) : null}
    </Card>
  );
}

// Who is available for a scheduled match, each player's own answer, and the captain's final XI.
export default function AttendanceScreen({ route }) {
  const { matchId } = route.params;
  const { matches, teams, players } = useAppState();
  const dispatch = useAppDispatch();
  const access = useAccess();
  const { user } = useAuth();
  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;
  const sides = access.correctionSides(match);
  const mineIn = (team) => (team ? (team.playerIds || []).filter((pid) => players.some((p) => p.id === pid && playerMatchesUser(p, user))) : []);
  const A = teams.find((t) => t.id === match.teamAId);
  const B = teams.find((t) => t.id === match.teamBId);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }}>
      <Card>
        <Text style={typography.h3}>{A ? A.name : "Team A"} vs {B ? B.name : "Team B"}</Text>
        <Text style={typography.muted}>{match.overs} overs · {match.venue || "Venue TBD"} · {new Date(match.date).toDateString()}</Text>
      </Card>
      <Side key={`A${match.lockedA}`} match={match} side="A" team={A} players={players} teams={teams} canManage={sides.includes("A")} mineIds={mineIn(A)} dispatch={dispatch} />
      <Side key={`B${match.lockedB}`} match={match} side="B" team={B} players={players} teams={teams} canManage={sides.includes("B")} mineIds={mineIn(B)} dispatch={dispatch} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: spacing.sm + 2 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  xi: { backgroundColor: colors.success, color: "#fff", fontWeight: "800", fontSize: 11, paddingHorizontal: 8, paddingVertical: 1, borderRadius: radius.pill, overflow: "hidden" },
  mine: { backgroundColor: colors.primary + "12", borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  mineTitle: { color: colors.text, fontWeight: "800" },
  manage: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
