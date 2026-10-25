import React, { useState } from "react";
import { View, Text, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { useAuth } from "../auth/AuthContext";
import { playerMatchesUser } from "../auth/identity";
import { ROLES } from "../auth/validators";
import { validatePlayerEdit, applyPlayerEdit, playerUsage } from "../players/playerOps";
import FormField from "../components/FormField";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { colors, spacing, typography, radius } from "../utils/theme";

export default function EditPlayerScreen({ route, navigation }) {
  const { playerId } = route.params;
  const { players, teams, matches } = useAppState();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { canEdit } = useAccess();

  const player = players.find((p) => p.id === playerId);
  const [name, setName] = useState(player?.name || "");
  const [phone, setPhone] = useState(player?.phone || "");
  const [email, setEmail] = useState(player?.email || "");
  const [role, setRole] = useState(player?.role && player.role !== "Player" ? player.role : null);
  const [error, setError] = useState("");

  if (!player) return null;
  if (!canEdit("players", playerId)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: colors.background }}>
        <Text style={typography.h3}>{player.name}</Text>
        <Text style={[typography.muted, { textAlign: "center", marginTop: spacing.sm }]}>You can only edit your own details and the players you added.</Text>
      </View>
    );
  }
  const usage = playerUsage(playerId, { teams, matches });
  const isMe = playerMatchesUser(player, user);
  const canUseMyNumber = !!user.phone && phone.replace(/[\s\-().]/g, "") !== user.phone.replace(/[\s\-().]/g, "");

  const commit = (nextPlayers) => {
    dispatch({ type: "HYDRATE", payload: { players: nextPlayers } });
    navigation.goBack();
  };

  const save = () => {
    setError("");
    const v = validatePlayerEdit({ name, phone, email, role }, players, playerId);
    if (!v.ok) {
      setError(v.error);
      return;
    }
    const edited = applyPlayerEdit(players, playerId, v.values);
    if (!v.duplicate) {
      commit(edited);
      return;
    }
    // Another player already has this number/email.
    const dupUsage = playerUsage(v.duplicate.id, { teams, matches });
    if (dupUsage.used) {
      setError(`"${v.duplicate.name}" already has this number and is in ${dupUsage.teams.length ? "a team" : "a match"}. Edit that player instead, or use Profile → Fix duplicate contacts.`);
      return;
    }
    Alert.alert(
      "Remove the duplicate?",
      `Another player, "${v.duplicate.name}", already has this number and isn't in any team or match. Remove that empty entry and keep this one?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove duplicate", style: "destructive", onPress: () => commit(edited.filter((p) => p.id !== v.duplicate.id)) },
      ]
    );
  };

  const remove = () => {
    if (usage.used) return;
    Alert.alert("Delete player?", `${player.name} isn't in any team or match, so nothing else is affected.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => commit(players.filter((p) => p.id !== playerId)) },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {isMe ? (
          <View style={styles.me}>
            <Badge label="YOU" color={colors.primary} />
            <Text style={[typography.muted, { flex: 1 }]}>This is your player. My Stats and Analytics use this entry.</Text>
          </View>
        ) : null}

        <FormField label="Full Name" value={name} onChangeText={setName} maxLength={60} />
        <FormField label="Mobile Number" value={phone} onChangeText={setPhone} placeholder="e.g. +61434916595" keyboardType="phone-pad" />
        {canUseMyNumber ? (
          <Pressable onPress={() => setPhone(user.phone)} style={{ marginTop: -spacing.sm, marginBottom: spacing.md }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>🔗 This is me: use my mobile number ({user.phone})</Text>
          </Pressable>
        ) : (
          <Text style={[typography.muted, { marginTop: -spacing.sm, marginBottom: spacing.md }]}>Dashes and spaces are fine. Include the country code.</Text>
        )}
        <FormField label="Email (optional)" value={email} onChangeText={setEmail} placeholder="e.g. player@email.com" keyboardType="email-address" autoCapitalize="none" />

        <Text style={typography.label}>PLAYING ROLE (OPTIONAL)</Text>
        <View style={styles.chips}>
          {ROLES.map((r) => (
            <Pressable key={r} onPress={() => setRole(role === r ? null : r)} style={[styles.chip, role === r && styles.chipActive]}>
              <Text style={[styles.chipText, role === r && { color: "#fff" }]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[typography.muted, { marginBottom: spacing.md }]}>
          {usage.used ? `In ${usage.teams.length} team${usage.teams.length === 1 ? "" : "s"} and ${usage.matches} match${usage.matches === 1 ? "" : "es"}.` : "Not in any team or match yet."}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Save Changes" onPress={save} />
        {!usage.used ? <Button title="Delete Player" variant="danger" onPress={remove} style={{ marginTop: spacing.md }} /> : null}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  me: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: "#EEF7F2", borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  error: { color: colors.danger, marginBottom: spacing.md },
});
