import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormField from "../../components/FormField";
import { colors, spacing, typography } from "../../utils/theme";

// Delete my account. Google Play requires apps with sign-up to offer this inside the app.
export default function DeleteAccountScreen() {
  const { deleteAccount, user } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready = text.trim().toUpperCase() === "DELETE";

  const go = async () => {
    setError("");
    setBusy(true);
    const r = await deleteAccount(); // on success the app returns to the login screen by itself
    setBusy(false);
    if (r && !r.ok) setError(r.error);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={typography.h2}>Delete my account</Text>
        <Text style={[typography.body, { marginTop: spacing.sm }]}>
          This permanently deletes the account {user && user.email ? `(${user.email})` : ""} and cannot be undone.
        </Text>
        <Text style={[typography.label, { marginTop: spacing.md }]}>WHAT IS DELETED</Text>
        <Text style={styles.line}>• Your login, profile, photo, mobile number and email</Text>
        <Text style={styles.line}>• Your player entry's name and contact details (it becomes “Deleted player”)</Text>
        <Text style={styles.line}>• Your name and contact on any issue or suggestion you sent</Text>
        <Text style={[typography.label, { marginTop: spacing.md }]}>WHAT STAYS</Text>
        <Text style={styles.line}>• Match scorecards, scores and team lists, so other players' records stay correct. Your name is replaced by “Deleted player”.</Text>
        <Text style={styles.line}>• Teams and matches you created stay for the other players; an administrator can manage them.</Text>
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>
          You can also ask us to delete it from the web page linked in the app store listing.
        </Text>
      </Card>
      <Card>
        <FormField label="Type DELETE to confirm" value={text} onChangeText={setText} autoCapitalize="characters" autoCorrect={false} placeholder="DELETE" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Delete my account forever" variant="danger" onPress={go} disabled={!ready || busy} loading={busy} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  line: { color: colors.text, marginTop: 4, lineHeight: 20 },
  error: { color: colors.danger, marginBottom: spacing.md },
});
