import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Share } from "react-native";
import { useAppState, useAppDispatch, useAllState, useAccess, useSync } from "../context/AppContext";
import { makeInviteCode, buildInviteLinks } from "../invite/links";
import { useAuth } from "../auth/AuthContext";
import { playerMatchesUser } from "../auth/identity";
import { colors, spacing, typography, radius } from "../utils/theme";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import { searchPlayers } from "../players/search";
import { contactLine } from "../access/mask";
import * as ImagePicker from "expo-image-picker";
import { TeamLogo, RecordRow, HallOfFameCard } from "../components/TeamExtras";
import { teamRecord, hallOfFame } from "../stats/awards";
import { uploadTeamLogo } from "../teams/logo";

const BY_LABEL = { mobile: "matched by mobile", email: "matched by email", name: "matched by name" };

export default function TeamDetailScreen({ route, navigation }) {
  const { teamId } = route.params;
  const { teams, players, matches } = useAppState();
  const everyone = useAllState().players; // search looks through ALL players
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { canEdit, isAdmin, mine } = useAccess();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState("add"); // "add" | "request"
  const [query, setQuery] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const { syncNow } = useSync();

  const team = teams.find((t) => t.id === teamId);
  const inTeam = team ? team.playerIds : [];
  const results = useMemo(() => searchPlayers(everyone, query, inTeam), [everyone, query, inTeam]);
  // Shown before you type: players you added and your teammates who aren't in this team yet.
  const record = useMemo(() => teamRecord(matches, teamId), [matches, teamId]);
  const hall = useMemo(() => hallOfFame(matches, teams, teamId), [matches, teams, teamId]);
  const suggestions = mine.players.filter((p) => !inTeam.includes(p.id));
  if (!team) return null;

  const canManage = canEdit("teams", teamId);
  const roster = players.filter((p) => team.playerIds.includes(p.id));
  const pendingRequests = team.joinRequests.filter((r) => r.status === "pending");

  const removePlayer = (p) => {
    Alert.alert(
      `Remove ${p.name}?`,
      `${p.name} will be taken off ${team.name}'s roster and out of the squads of its matches that haven't started. Past and live matches are not changed.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => dispatch({ type: "REMOVE_PLAYER_FROM_TEAM", payload: { teamId, playerId: p.id } }) },
      ]
    );
  };

  const nameOf = (id) => (everyone.find((p) => p.id === id) || {}).name || "Unknown";

  const changeLogo = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 });
      if (r.canceled || !r.assets || !r.assets[0]) return;
      setLogoBusy(true);
      const url = await uploadTeamLogo(user.id, teamId, r.assets[0].uri);
      dispatch({ type: "SET_TEAM_LOGO", payload: { teamId, logoUrl: url } });
      syncNow();
    } catch (e) {
      Alert.alert("Couldn't set the logo", e && e.status === 0 ? "No internet connection." : "Please try again.");
    } finally {
      setLogoBusy(false);
    }
  };
  const removeLogo = () => {
    dispatch({ type: "SET_TEAM_LOGO", payload: { teamId, logoUrl: null } });
    syncNow();
  };

  // Share a link on WhatsApp, email, SMS... The player taps it, opens the app and joins himself.
  const shareInvite = async () => {
    let t = team;
    if (!t.inviteCode) {
      const code = makeInviteCode();
      dispatch({ type: "SET_TEAM_INVITE", payload: { teamId, code } });
      t = { ...team, inviteCode: code };
      syncNow(); // the code must reach the server before anyone taps the link
    }
    const links = buildInviteLinks(t);
    try {
      await Share.share({ message: links.message, title: `Join ${t.name} on CricCorner` });
    } catch (e) {
      Alert.alert("Couldn't open sharing", "Please try again.");
    }
  };

  const resetInvite = () => {
    Alert.alert("Reset the invite link?", "Links you already shared will stop working. Players who already joined stay in the team.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          dispatch({ type: "SET_TEAM_INVITE", payload: { teamId, code: makeInviteCode() } });
          syncNow();
          Alert.alert("Link reset", "Tap \"Share invite link\" to send the new one.");
        },
      },
    ]);
  };

  const openPicker = (mode) => {
    setPickerMode(mode);
    setQuery("");
    setPickerOpen(true);
  };

  const handlePick = (playerId) => {
    dispatch({ type: pickerMode === "add" ? "ADD_PLAYER_TO_TEAM" : "REQUEST_PLAYER_JOIN", payload: { teamId, playerId } });
    setQuery("");
    setPickerOpen(false);
  };

  const q = query.trim();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TeamLogo team={team} size={64} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={typography.h2}>{team.name}</Text>
          <Text style={typography.muted}>{roster.length} player{roster.length === 1 ? "" : "s"} on roster</Text>
          {canManage ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: 2 }}>
              <Pressable onPress={() => navigation.navigate("EditTeam", { teamId })} hitSlop={6}>
                <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 12 }}>✏️ Edit name</Text>
              </Pressable>
              <Pressable onPress={changeLogo} disabled={logoBusy}>
                <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 12 }}>{logoBusy ? "Uploading…" : team.logoUrl ? "Change logo" : "Add logo"}</Text>
              </Pressable>
              {team.logoUrl ? (
                <Pressable onPress={removeLogo}><Text style={{ color: colors.textMuted, fontWeight: "700", fontSize: 12 }}>Remove</Text></Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
      <Card style={{ marginTop: spacing.md }}>
        <Text style={typography.label}>TEAM RECORD</Text>
        <RecordRow record={record} />
      </Card>
      <HallOfFameCard hall={hall} nameOf={nameOf} onPlayerPress={(playerId) => navigation.navigate("PlayerStats", { playerId })} />
      <View style={{ height: spacing.xs }} />

      {canManage ? (
        <View style={styles.actionsRow}>
          <Button title="+ Add Player" onPress={() => openPicker("add")} style={{ flex: 1 }} />
          <Button title="✉️ Invite" variant="outline" onPress={() => openPicker("request")} style={{ flex: 1 }} />
        </View>
      ) : null}
      {canManage ? (
        <View style={{ marginBottom: spacing.md }}>
          <Button title="🔗 Share invite link (WhatsApp, email…)" onPress={shareInvite} />
          <Text style={[typography.muted, { marginTop: spacing.xs }]}>
            The player taps the link, opens CricCorner and joins the team himself.
          </Text>
          {team.inviteCode ? (
            <Pressable onPress={resetInvite} style={{ paddingVertical: spacing.xs }}>
              <Text style={{ color: colors.textMuted, fontWeight: "700", fontSize: 12 }}>Reset invite link</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {!canManage ? (
        <Card>
          <Text style={typography.muted}>You are in this team. Only its owner or an admin can change it.</Text>
        </Card>
      ) : null}

      {canManage && pickerOpen && (
        <Card>
          <Text style={typography.h3}>{pickerMode === "add" ? "Add a player to the team" : "Invite a player to join"}</Text>
          <View style={{ height: spacing.sm }} />
          <FormField label="Search by name, mobile number or email" value={query} onChangeText={setQuery} placeholder="e.g. Rahul, 0434 916 595 or rahul@mail.com" autoCapitalize="none" autoFocus />
          {q.length < 2 ? (
            <View>
              <Text style={typography.muted}>
                {suggestions.length ? "Your players are listed below. To find anyone else, type at least 2 letters or 3 digits." : "Type at least 2 letters or 3 digits to search."}
              </Text>
              {suggestions.map((p) => (
                <Pressable key={p.id} style={styles.pickRow} onPress={() => handlePick(p.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.body}>{p.name}</Text>
                    <Text style={typography.muted}>{contactLine(p, isAdmin || canEdit("players", p.id)) || "No contact"}</Text>
                  </View>
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>{pickerMode === "add" ? "Add" : "Invite"}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => navigation.navigate("Players", { screen: "AddPlayer" })} style={{ marginTop: spacing.sm }}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>+ Add a new player</Text>
              </Pressable>
            </View>
          ) : results.length === 0 ? (
            <View>
              <Text style={typography.muted}>No player found. Players already in this team are not listed.</Text>
              <Pressable onPress={() => navigation.navigate("Players", { screen: "AddPlayer" })} style={{ marginTop: spacing.sm }}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>+ Add a new player instead</Text>
              </Pressable>
            </View>
          ) : (
            results.map(({ player: p, by, exact }) => (
              <Pressable key={p.id} style={styles.pickRow} onPress={() => handlePick(p.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>{p.name}</Text>
                  <Text style={typography.muted}>
                    {contactLine(p, isAdmin || canEdit("players", p.id)) || "No contact"} · {BY_LABEL[by]}{exact ? " (exact)" : ""}
                  </Text>
                </View>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>{pickerMode === "add" ? "Add" : "Invite"}</Text>
              </Pressable>
            ))
          )}
          <Button title="Cancel" variant="outline" onPress={() => setPickerOpen(false)} style={{ marginTop: spacing.sm }} />
        </Card>
      )}

      {pendingRequests.length > 0 && (
        <Card>
          <Text style={typography.h3}>Pending Join Requests</Text>
          {pendingRequests.map((r) => {
            const p = everyone.find((pl) => pl.id === r.playerId);
            // The invited player answers their own invitation; the team's manager can answer too.
            const mayAnswer = canManage || (p && playerMatchesUser(p, user));
            return (
              <View key={r.id} style={styles.requestRow}>
                <Text style={typography.body}>{p?.name}</Text>
                {mayAnswer ? (
                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <Pressable onPress={() => dispatch({ type: "RESPOND_JOIN_REQUEST", payload: { teamId, requestId: r.id, accept: true } })}>
                      <Text style={{ color: colors.success, fontWeight: "700" }}>Accept</Text>
                    </Pressable>
                    <Pressable onPress={() => dispatch({ type: "RESPOND_JOIN_REQUEST", payload: { teamId, requestId: r.id, accept: false } })}>
                      <Text style={{ color: colors.danger, fontWeight: "700" }}>Decline</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={typography.muted}>Waiting</Text>
                )}
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
              <Pressable onPress={() => navigation.navigate("PlayerStats", { playerId: p.id })} style={{ flex: 1, flexDirection: "row", alignItems: "center" }} hitSlop={4}>
                <View style={styles.avatar}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{p.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.primary, fontWeight: "700" }]}>{p.name}</Text>
                  <Text style={typography.muted}>View stats ›</Text>
                </View>
              </Pressable>
              {team.ownerId === p.id ? (
                <Text style={styles.ownerBadge}>Owner</Text>
              ) : canManage ? (
                <Pressable onPress={() => removePlayer(p)} style={styles.removeBtn} hitSlop={8}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              ) : null}
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
  pickRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  requestRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rosterRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  avatar: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: spacing.sm },
  removeBtn: { marginLeft: "auto", borderWidth: 1, borderColor: colors.danger, borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 3 },
  removeText: { color: colors.danger, fontWeight: "700", fontSize: 12 },
  ownerBadge: { marginLeft: "auto", backgroundColor: colors.accent, color: "#fff", fontSize: 11, fontWeight: "700", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
});
