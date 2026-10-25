import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useAllState, useAppDispatch, useSync } from "../context/AppContext";
import { useAuth } from "../auth/AuthContext";
import { findMyPlayer } from "../auth/identity";
import { rest } from "../cloud/api";
import { newId } from "../utils/id";
import { colors, spacing, typography } from "../utils/theme";
import Card from "../components/Card";
import Button from "../components/Button";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Opened from a team invite link. The player taps Join and is added to the team.
export default function JoinTeamScreen({ route, navigation }) {
  const { teamId, code } = route.params || {};
  const all = useAllState();
  const { user } = useAuth();
  const { syncNow, lastSync } = useSync();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const team = all.teams.find((t) => t.id === teamId);
  const me = findMyPlayer(all.players, user);
  const isMember = !!(team && me && (team.playerIds || []).includes(me.id));
  const valid = !!(team && team.inviteCode && team.inviteCode === code);
  const owner = team && all.players.find((p) => p.id === team.ownerId);
  const size = team ? (team.playerIds || []).length : 0;

  const join = async () => {
    setBusy(true);
    setError("");
    try {
      let playerId = me && me.id;
      if (!playerId) {
        playerId = newId("player");
        dispatch({
          type: "ADD_PLAYER",
          payload: { id: playerId, name: user.name, phone: user.phone || null, email: user.email || user.identifier, role: user.role || "Player" },
        });
      }
      // The server only accepts a player entry that has been saved there.
      let lastErr = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        await syncNow();
        await wait(attempt === 0 ? 400 : 1500);
        try {
          await rest("rpc/join_team_by_invite", { method: "POST", body: { p_team: teamId, p_code: code, p_player: playerId } });
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          if (!(e && /not been saved yet/i.test(e.message || ""))) break;
        }
      }
      if (lastErr) throw lastErr;
      await syncNow();
    } catch (e) {
      setError((e && e.message) || "Couldn't join the team. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  let body;
  if (!team) {
    body = lastSync ? (
      <>
        <Text style={typography.h3}>Team not found</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>This team may have been deleted, or your data is still loading.</Text>
        <Button title="Check again" variant="outline" onPress={syncNow} style={{ marginTop: spacing.md }} />
      </>
    ) : (
      <Text style={typography.muted}>Loading the team…</Text>
    );
  } else if (isMember) {
    body = (
      <>
        <Text style={typography.h3}>You're in {team.name} 🎉</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>You can now see its matches and be picked in its squads.</Text>
        <Button title="Open team" onPress={() => navigation.replace("TeamDetail", { teamId })} style={{ marginTop: spacing.md }} />
      </>
    );
  } else if (!valid) {
    body = (
      <>
        <Text style={typography.h3}>This invite link isn't valid</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>The captain may have reset it. Ask for a new link.</Text>
      </>
    );
  } else {
    body = (
      <>
        <Text style={typography.h2}>Join {team.name}?</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>
          {owner ? `${owner.name} invited you. ` : ""}
          {size} player{size === 1 ? "" : "s"} on the roster.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={busy ? "Joining…" : "Join team"} onPress={join} loading={busy} style={{ marginTop: spacing.md }} />
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>
          You will be added as {me ? me.name : user.name}. Only the team's own captain or an admin can remove you.
        </Text>
      </>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }}>
      <Card>{body}</Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  error: { color: "#C62828", fontWeight: "700", marginTop: spacing.md },
});
