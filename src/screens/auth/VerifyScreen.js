import React, { useState } from "react";
import { Text, Pressable, Alert, StyleSheet } from "react-native";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import Button from "../../components/Button";
import { useAuth } from "../../auth/AuthContext";
import { colors, spacing } from "../../utils/theme";

export default function VerifyScreen({ route, navigation }) {
  const { identifier } = route.params;
  const { verify, resendCode } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    const r = await verify(identifier, code);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    Alert.alert("Verified!", "Welcome to CricCorner."); // the app opens automatically
  };

  const resend = async () => {
    setError("");
    setInfo("");
    const r = await resendCode(identifier);
    if (!r.ok) setError(r.error);
    else setInfo("A new code has been sent.");
  };

  return (
    <AuthLayout title="Verify your account" subtitle={`Enter the 6-digit code we emailed to ${identifier}. Check your spam folder too.`}>
      <FormField label="Verification Code" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" maxLength={6} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <Button title="Verify" onPress={submit} loading={busy} />
      <Pressable onPress={resend} style={styles.link}>
        <Text style={styles.linkText}>Didn't get a code? Resend</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: spacing.md },
  info: { color: colors.success, marginBottom: spacing.md },
  link: { alignItems: "center", marginTop: spacing.lg },
  linkText: { color: colors.primary, fontWeight: "700" },
});
