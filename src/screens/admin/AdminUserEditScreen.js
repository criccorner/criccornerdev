import React, { useCallback, useState } from "react";
import { View, Text, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthContext";
import { listUsers, updateUser, setAdmin, setBlocked } from "../../admin/store";
import { ROLES } from "../../auth/validators";
import { BLOCKED_MESSAGE } from "../../auth/db";
import AdminGuard from "./AdminGuard";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import FormField from "../../components/FormField";
import { colors, spacing, typography, radius } from "../../utils/theme";

export default function AdminUserEditScreen({ route }) {
  const { userId } = route.params;
  const { user: me, refreshUser } = useAuth();
  const [target, setTarget] = useState(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await listUsers(me.id);
    if (!r.ok) return;
    const found = r.users.find((u) => u.id === userId);
    if (found) {
      setTarget(found);
      setName(found.name);
      setRole(found.role);
    }
  }, [me.id, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const run = async (fn, successMsg) => {
    setError("");
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    await load();
    if (userId === me.id) await refreshUser(); // keep own header/badge in sync
    if (successMsg) Alert.alert("Done", successMsg);
  };

  const saveProfile = () => run(() => updateUser(me.id, userId, { name, role }), "Profile updated.");

  const toggleAdmin = () => {
    const making = !target.isAdmin;
    Alert.alert(
      making ? "Make administrator?" : "Remove administrator?",
      making
        ? `${target.name} will be able to view all users, manage feedback, and block players.`
        : `${target.name} will lose administrator access.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: making ? "Make Admin" : "Remove Admin", onPress: () => run(() => setAdmin(me.id, userId, making), making ? "Player is now an administrator." : "Administrator access removed.") },
      ]
    );
  };

  const toggleBlock = () => {
    const blocking = !target.blocked;
    Alert.alert(
      blocking ? "Block this player?" : "Unblock this player?",
      blocking ? `${target.name} won't be able to log in. They will see: "${BLOCKED_MESSAGE}"` : `${target.name} will be able to log in again.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: blocking ? "Block" : "Unblock", style: blocking ? "destructive" : "default", onPress: () => run(() => setBlocked(me.id, userId, blocking), blocking ? "Player blocked." : "Player unblocked.") },
      ]
    );
  };

  if (!target) return <AdminGuard><View /></AdminGuard>;

  const isSelf = target.id === me.id;

  return (
    <AdminGuard>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Card>
            <Text style={typography.muted}>{target.identifier}</Text>
            <View style={{ flexDirection: "row", marginTop: spacing.sm, flexWrap: "wrap" }}>
              {target.isAdmin ? <Badge label="ADMIN" color={colors.accent} /> : null}
              {target.blocked ? <Badge label="BLOCKED" color={colors.danger} /> : null}
              {!target.verified ? <Badge label="UNVERIFIED" color={colors.textMuted} /> : null}
            </View>
          </Card>

          <Text style={typography.h3}>Edit profile</Text>
          <View style={{ height: spacing.sm }} />
          <FormField label="Full Name" value={name} onChangeText={setName} />
          <Text style={typography.label}>PLAYING ROLE</Text>
          <View style={styles.chips}>
            {ROLES.map((r) => (
              <Pressable key={r} onPress={() => setRole(r)} style={[styles.chip, role === r && styles.chipActive]}>
                <Text style={[styles.chipText, role === r && { color: "#fff" }]}>{r}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Save Changes" onPress={saveProfile} loading={busy} />

          <View style={styles.divider} />
          <Text style={typography.h3}>Administrator access</Text>
          {target.isPrimaryAdmin ? (
            <Text style={[typography.muted, { marginVertical: spacing.sm }]}>This is the primary administrator and can't be changed.</Text>
          ) : isSelf ? (
            <Text style={[typography.muted, { marginVertical: spacing.sm }]}>You can't remove your own administrator access.</Text>
          ) : (
            <Button
              title={target.isAdmin ? "Remove Admin" : "Make Admin"}
              variant={target.isAdmin ? "outline" : "primary"}
              onPress={toggleAdmin}
              disabled={busy}
              style={{ marginTop: spacing.sm }}
            />
          )}

          <View style={styles.divider} />
          <Text style={typography.h3}>Block player</Text>
          {target.isPrimaryAdmin || isSelf ? (
            <Text style={[typography.muted, { marginVertical: spacing.sm }]}>{isSelf ? "You can't block yourself." : "The primary administrator can't be blocked."}</Text>
          ) : (
            <>
              <Text style={[typography.muted, { marginVertical: spacing.sm }]}>
                A blocked player can't log in and sees: "{BLOCKED_MESSAGE}"
              </Text>
              <Button title={target.blocked ? "Unblock Player" : "Block Player"} variant={target.blocked ? "outline" : "danger"} onPress={toggleBlock} disabled={busy} />
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  error: { color: colors.danger, marginTop: spacing.md },
});
