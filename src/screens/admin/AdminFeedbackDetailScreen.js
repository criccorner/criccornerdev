import React, { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthContext";
import { listAllFeedback, updateFeedback, STATUSES } from "../../admin/store";
import AdminGuard from "./AdminGuard";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { colors, spacing, typography, radius } from "../../utils/theme";

export default function AdminFeedbackDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [status, setStatus] = useState("Open");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listAllFeedback(user.id).then((r) => {
        if (!alive || !r.ok) return;
        const found = r.items.find((i) => i.id === id);
        if (found) {
          setItem(found);
          setStatus(found.status);
          setReply(found.reply || "");
        }
      });
      return () => {
        alive = false;
      };
    }, [user.id, id])
  );

  const save = async () => {
    setError("");
    setBusy(true);
    const r = await updateFeedback(user.id, id, { status, reply });
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    Alert.alert("Saved", "Status and reply updated. The player will see them under My Submissions.", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  };

  if (!item) return <AdminGuard><View /></AdminGuard>;

  return (
    <AdminGuard>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Card>
            <View style={{ flexDirection: "row" }}>
              <Badge label={item.type.toUpperCase()} color={item.type === "Issue" ? colors.danger : colors.info} />
            </View>
            <Text style={[typography.muted, { marginTop: spacing.sm }]}>
              From {item.userName} ({item.userContact}) · {new Date(item.createdAt).toLocaleString()}
            </Text>
            <Text style={[typography.body, { marginTop: spacing.sm }]}>{item.detail}</Text>
          </Card>

          <Text style={typography.label}>STATUS</Text>
          <View style={styles.chips}>
            {STATUSES.map((s) => (
              <Pressable key={s} onPress={() => setStatus(s)} style={[styles.chip, status === s && styles.chipActive]}>
                <Text style={[styles.chipText, status === s && { color: "#fff" }]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[typography.label, { marginTop: spacing.md }]}>REPLY / COMMENT</Text>
          <TextInput
            style={styles.input}
            value={reply}
            onChangeText={setReply}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            placeholder="Write a reply the player will see"
            placeholderTextColor={colors.textMuted}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Save" onPress={save} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, fontSize: 15, color: colors.text, minHeight: 120, marginTop: spacing.xs, marginBottom: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.md },
});
