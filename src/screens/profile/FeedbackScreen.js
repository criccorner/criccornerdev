import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { submitFeedback, FEEDBACK_TYPES } from "../../admin/store";
import Button from "../../components/Button";
import { colors, spacing, typography, radius } from "../../utils/theme";

const MAX = 1000;

export default function FeedbackScreen({ navigation }) {
  const { user } = useAuth();
  const [type, setType] = useState(null);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    const r = await submitFeedback(user.id, { type, detail });
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    Alert.alert("Thank you!", "Your submission has been sent to the administrator.", [
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
        <Button title="Submit" onPress={submit} loading={busy} />
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
