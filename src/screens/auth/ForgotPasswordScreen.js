import React, { useState } from "react";
import { Text, StyleSheet } from "react-native";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import Button from "../../components/Button";
import { useAuth } from "../../auth/AuthContext";
import { colors, spacing } from "../../utils/theme";

export default function ForgotPasswordScreen({ navigation, route }) {
  const { requestReset } = useAuth();
  const [identifier, setIdentifier] = useState(route.params?.identifier || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    const r = await requestReset(identifier);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    navigation.navigate("ResetPassword", { identifier: r.identifier });
  };

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email. If an account exists, we'll email you a reset code.">
      <FormField label="Email" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Send Reset Code" onPress={submit} loading={busy} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({ error: { color: colors.danger, marginBottom: spacing.md } });
