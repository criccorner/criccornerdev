import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Card from "../components/Card";
import Button from "../components/Button";

export default function TeamDetailScreen({ route }) {
  const { teamId } = route.params;
  const { teams, players } = useAppState();
  const dispatch = useAppDispatch();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState("add");

  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  const roster = players.filter((p) => team.playerIds.includes(p.id));
  const nonRosterPlayers = players.filter((p) => !team.playerIds.includes(p.id));
  const pendingRequests = team.joinRequests.filter((r) => r.status === "pending");

  const openPicker = (mode) => {
    if (nonRosterPlayers.length === 0) {
      Alert.alert("No players available", "Add more players first from the Players tab.");
      return;
    }
    setPickerMode(mode);
    setPickerOpen(true);
  };

  const handlePick = (playerId) => {
    if (pickerMode === "add") {
      dispatch({ type: "ADD_PLAYER_TO_TEAM", payload: { teamId, playerId } });
    } else {
      dispatch({ type: "REQUEST_PLAYER_JOIN", payload: { teamId, playerId } });
    }
    setPickerOpen(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={typography.h2}>{team.name}</Text>
      <Text style={typography.muted}>{roster.length} player{roster.length === 1 ? "" : "s"} on roster</Text>
      <View style={{ height: spacing.md }} />

      <View style={styles.actionsRow}>
        <Button title="+ Add Player" onPress={() => openPicker("add")} style={{ flex: 1 }} />
        <Button title="✉️ Request to Join" variant="outline" onPress={() => openPicker("request")} style={{ flex: 1 }} />
      </View>

      {pickerOpen && (
        <Card>
          <Text style={typography.h3}>{pickerMode === "add" ? "Add player directly" : "Send join request"}</Text>
          <View style={{ height: spacing.sm }} />
          {nonRosterPlayers.map((p) => (
            <Pressable key={p.id} style={styles.pickRow} onPress={() => handlePick(p.id)}>
              <Text style={typography.body}>{p.name}</Text>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Select</Text>
            </Pressable>
          ))}
          <Button title="Cancel" variant="outline" onPress={() => setPickerOpen(false)} style={{ marginTop: spacing.sm }} />
        </Card>
      )}

      {pendingRequests.length > 0 && (
        <Card>
          <Text style={typography.h3}>Pending Join Requests</Text>
          <Text style={[typography.muted, { marginBottom: spacing.sm }]}>
            The invited player would accept/decline from their own device — simulated here for demo purposes.
          </Text>
          {pendingRequests.map((r) => {
            const p = players.find((pl) => pl.id === r.playerId);
            return (
              <View key={r.id} style={styles.requestRow}>
                <Text style={typography.body}>{p?.name}</Text>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Pressable onPress={() => dispatch({ type: "RESPOND_JOIN_REQUEST", payload: { teamId, requestId: r.id, accept: true } })}>
                    <Text style={{ color: colors.success, fontWeight: "700" }}>Accept</Text>
                  </Pressable>
                  <Pressable onPress={() => dispatch({ type: "RESPOND_JOIN_REQUEST", payload: { teamId, requestId: r.id, accept: false } })}>
                    <Text style={{ color: colors.danger, fontWeight: "700" }}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </Card>
      )}

      <Card>
        <Text style={typography.h3}>Roster</Text>
        {roster.length === 0 ? (
          <Text style={typography.muted}>No players yet.</Text>
        ) : (
          roster.map((p) => (
            <View key={p.id} style={styles.rosterRow}>
              <View style={styles.avatar}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{p.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={typography.body}>{p.name}</Text>
              {team.ownerId === p.id && <Text style={styles.ownerBadge}>Owner</Text>}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  pickRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  requestRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rosterRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  avatar: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: spacing.sm },
  ownerBadge: { marginLeft: "auto", backgroundColor: colors.accent, color: "#fff", fontSize: 11, fontWeight: "700", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
});
