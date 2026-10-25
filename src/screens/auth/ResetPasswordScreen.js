import React, { useState } from "react";
import { Text, Alert, StyleSheet } from "react-native";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import Button from "../../components/Button";
import { useAuth } from "../../auth/AuthContext";
import { colors, spacing } from "../../utils/theme";

export default function ResetPasswordScreen({ navigation, route }) {
  const { identifier } = route.params;
  const { resetPassword } = useAuth();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const r = await resetPassword(identifier, code, password);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    Alert.alert("Password updated", "You can now log in with your new password.");
    navigation.navigate("Login", { identifier });
  };

  return (
    <AuthLayout title="Reset password" subtitle={`Enter the code we emailed to ${identifier} and choose a new password.`}>
      <FormField label="Reset Code" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" maxLength={6} />
      <FormField label="New Password" value={password} onChangeText={setPassword} placeholder="Min 8 characters, letters + a number" secureTextEntry autoCapitalize="none" />
      <FormField label="Confirm New Password" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Update Password" onPress={submit} loading={busy} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({ error: { color: colors.danger, marginBottom: spacing.md } });
