import React, { useState } from "react";
import { Text, ScrollView, Alert, StyleSheet } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormField from "../../components/FormField";
import { colors, spacing, typography } from "../../utils/theme";

// Change my password (needs the current one).
export default function ChangePasswordScreen({ navigation }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!current) return setError("Enter your current password.");
    if (next !== confirm) return setError("The new passwords do not match.");
    setBusy(true);
    const r = await changePassword(current, next);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setCurrent("");
    setNext("");
    setConfirm("");
    Alert.alert("Password changed", "Use your new password the next time you log in.", [{ text: "OK", onPress: () => navigation.goBack() }]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={typography.h2}>Change password</Text>
        <Text style={[typography.muted, { marginVertical: spacing.sm }]}>Choose a password with at least 8 characters, including letters and a number.</Text>
        <FormField label="Current Password" value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" autoComplete="off" />
        <FormField label="New Password" value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" autoComplete="off" placeholder="Min 8 characters, letters + a number" />
        <FormField label="Confirm New Password" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" autoComplete="off" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Change Password" onPress={submit} loading={busy} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ error: { color: colors.danger, marginBottom: spacing.md } });
