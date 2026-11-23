import React, { useEffect } from "react";
import { matchWhen } from "../utils/datetime";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { STATUSES } from "../utils/availability";
import { pendingAttendance, confirmedFor, isLocked } from "../utils/attendance";
import Card from "../components/Card";
import { useAuth } from "../auth/AuthContext";
import { notifKey, markSeen, useSeen } from "../notifications/seen";
import { colors, spacing, typography, radius } from "../utils/theme";

// What needs you: matches waiting for your attendance, your squad to confirm, and matches you were picked for.
export function notificationsFor({ matches, teams, players, access, now, seen }) {
  const ids = [...(access.myPlayerIds || [])];
  const pending = pendingAttendance({ matches, teams, myPlayerIds: ids, players, now });
  const picked = confirmedFor({ matches, myPlayerIds: ids, now });
  // Matches whose XI you manage and have not confirmed yet.
  const toConfirm = [];
  for (const m of matches) {
    if (m.status !== "scheduled" || !m.attendance) continue;
    const sides = access.correctionSides(m).filter((s) => !isLocked(m, s));
    if (sides.length) toConfirm.push({ match: m, sides });
  }
  const isNew = (kind, matchId, playerId) => !(seen && seen.has(notifKey(kind, matchId, playerId)));
  // The number on the bell: only the ones you haven't opened yet.
  const count = pending.filter((x) => isNew("ask", x.match.id, x.playerId)).length + toConfirm.filter((x) => isNew("xi", x.match.id)).length;
  return { pending, picked, toConfirm, count };
}

export default function NotificationsScreen({ navigation }) {
  const { matches, teams, players } = useAppState();
  const dispatch = useAppDispatch();
  const access = useAccess();
  const { user } = useAuth();
  const seen = useSeen(user && user.id);
  const n = notificationsFor({ matches, teams, players, access, seen });
  const fresh = (kind, m, pid) => !seen.has(notifKey(kind, m.id, pid));
  const nameOf = (id) => (teams.find((t) => t.id === id) || {}).name || "Team";
  const title = (m) => `${nameOf(m.teamAId)} vs ${nameOf(m.teamBId)}`;
  const when = (m) => `${matchWhen(m)}${m.venue ? ` · ${m.venue}` : ""}`;
  // Opening a notification's details marks it read, so the bell number drops by one.
  const open = (m, kind, pid) => {
    markSeen(user && user.id, notifKey(kind, m.id, pid));
    navigation.navigate("Matches", { screen: "Attendance", params: { matchId: m.id } });
  };
  const answer = (playerId, matchId, status) => {
    markSeen(user && user.id, notifKey("ask", matchId, playerId));
    dispatch({ type: "SET_AVAILABILITY", payload: { playerId, matchId, status } });
  };
  const empty = !n.pending.length && !n.picked.length && !n.toConfirm.length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }}>
      {empty ? (
        <Card>
          <Text style={typography.h3}>You're all caught up 🎉</Text>
          <Text style={[typography.muted, { marginTop: spacing.xs }]}>When your captain schedules a match and asks who's available, it shows up here.</Text>
        </Card>
      ) : null}

      {n.pending.length ? <Text style={typography.label}>ARE YOU AVAILABLE?</Text> : null}
      {n.pending.map(({ match, playerId, side }) => (
        <Card key={`${match.id}-${playerId}`}>
          <Pressable onPress={() => open(match, "ask", playerId)}>
            <Text style={styles.title}>{fresh("ask", match, playerId) ? "🔵 " : ""}{title(match)}</Text>
            <Text style={typography.muted}>{when(match)}</Text>
          </Pressable>
          <View style={styles.chips}>
            {STATUSES.map((st) => (
              <Pressable key={st.key} onPress={() => answer(playerId, match.id, st.key)} style={styles.chip} accessibilityRole="button">
                <Text style={styles.chipText}>{st.icon} {st.label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ))}

      {n.toConfirm.length ? <Text style={[typography.label, { marginTop: spacing.md }]}>PICK YOUR XI</Text> : null}
      {n.toConfirm.map(({ match }) => (
        <Pressable key={match.id} onPress={() => open(match, "xi")}>
          <Card>
            <Text style={styles.title}>{fresh("xi", match) ? "🔵 " : ""}{title(match)}</Text>
            <Text style={typography.muted}>{when(match)}</Text>
            <Text style={styles.action}>See who's available and confirm the XI ›</Text>
          </Card>
        </Pressable>
      ))}

      {n.picked.length ? <Text style={[typography.label, { marginTop: spacing.md }]}>YOU'RE IN THE XI</Text> : null}
      {n.picked.map(({ match, playerId }) => (
        <Pressable key={`${match.id}-${playerId}`} onPress={() => open(match, "in", playerId)}>
          <Card>
            <Text style={styles.title}>✅ {title(match)}</Text>
            <Text style={typography.muted}>{when(match)}</Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontWeight: "800", fontSize: 15 },
  action: { color: colors.primary, fontWeight: "800", marginTop: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.sm + 4 },
  chipText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
});
