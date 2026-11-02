import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { submitFeedback, updateMyFeedback, FEEDBACK_TYPES } from "../../admin/store";
import Button from "../../components/Button";
import { colors, spacing, typography, radius } from "../../utils/theme";

const MAX = 1000;

export default function FeedbackScreen({ navigation, route }) {
  const edit = route && route.params && route.params.edit ? route.params.edit : null; // an item being changed
  const { user } = useAuth();
  const [type, setType] = useState(edit ? edit.type : null);
  const [detail, setDetail] = useState(edit ? edit.detail : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    const r = edit ? await updateMyFeedback(user.id, edit.id, { type, detail }) : await submitFeedback(user.id, { type, detail });
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    Alert.alert(edit ? "Updated" : "Thank you!", edit ? "Your changes have been saved." : "Your submission has been sent to the administrator.", [
      { text: "OK", onPress: () => navigation.replace("MyFeedback") },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={typography.label}>TYPE</Text>
        <View style={styles.chips}>
          {FEEDBACK_TYPES.map((t) => (
            <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, type === t && styles.chipActive]}>
              <Text style={[styles.chipText, type === t && { color: "#fff" }]}>{t === "Issue" ? "🐞 Issue" : "💡 Suggestion"}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[typography.label, { marginTop: spacing.md }]}>
          {type === "Suggestion" ? "DESCRIBE YOUR SUGGESTION" : "ENTER DETAIL OF THE ISSUE"}
        </Text>
        <TextInput
          style={styles.input}
          value={detail}
          onChangeText={setDetail}
          multiline
          maxLength={MAX}
          textAlignVertical="top"
          placeholder={type === "Suggestion" ? "What would make CricCorner better?" : "What went wrong? What were you doing when it happened?"}
          placeholderTextColor={colors.textMuted}
        />
        <Text style={[typography.muted, { textAlign: "right", marginBottom: spacing.md }]}>{detail.length}/{MAX}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={edit ? "Save changes" : "Submit"} onPress={submit} loading={busy} />
        {edit ? <Text style={[typography.muted, { marginTop: spacing.sm }]}>You can change this until the administrator replies or starts working on it.</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  chips: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, fontSize: 15, color: colors.text, minHeight: 160, marginTop: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.md },
});
