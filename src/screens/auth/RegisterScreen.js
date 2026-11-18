import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import Button from "../../components/Button";
import SocialButtons from "../../components/SocialButtons";
import { useAuth } from "../../auth/AuthContext";
import { ROLES } from "../../auth/validators";
import { colors, spacing, typography, radius } from "../../utils/theme";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [exists, setExists] = useState(false); // the email already has an account

  const submit = async () => {
    setError("");
    setExists(false);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const r = await register({ name, identifier, password, role, phone });
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      setExists(!!r.exists);
      return;
    }
    if (r.signedIn) return; // email confirmation is off: the app opens automatically
    navigation.navigate("Verify", { identifier: r.identifier });
  };

  return (
    <AuthLayout title="Create your account" subtitle="Register with your email. We'll send a code to verify it.">
      <FormField label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Virat Sharma" autoComplete="off" textContentType="none" autoCapitalize="words" autoCorrect={false} importantForAutofill="no" spellCheck={false} />
      <FormField label="Email" value={identifier} onChangeText={setIdentifier} placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoCorrect={false} importantForAutofill="yes" />
      <FormField label="Mobile Number (optional)" value={phone} onChangeText={setPhone} placeholder="e.g. +61434916595" keyboardType="phone-pad" autoComplete="off" textContentType="none" importantForAutofill="no" />

      <Text style={typography.label}>PLAYING ROLE</Text>
      <View style={styles.chips}>
        {ROLES.map((r) => (
          <Pressable key={r} onPress={() => setRole(r)} style={[styles.chip, role === r && styles.chipActive]}>
            <Text style={[styles.chipText, role === r && { color: "#fff" }]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      <FormField label="Password" value={password} onChangeText={setPassword} placeholder="Min 8 characters, letters + a number" secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" importantForAutofill="yes" />
      <FormField label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" importantForAutofill="yes" />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {exists ? (
        <View style={styles.existsRow}>
          <Pressable onPress={() => navigation.navigate("Login")} style={styles.existsBtn} accessibilityLabel="Go to log in">
            <Text style={styles.existsText}>Log in</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("ForgotPassword")} style={styles.existsBtn} accessibilityLabel="Forgot password">
            <Text style={styles.existsText}>Forgot password</Text>
          </Pressable>
        </View>
      ) : null}
      <Button title="Register" onPress={submit} loading={busy} />

      <SocialButtons />

      <Pressable onPress={() => navigation.navigate("Login")} style={styles.link}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  existsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  existsBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 10, alignItems: "center" },
  existsText: { color: colors.primary, fontWeight: "800" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  error: { color: colors.danger, marginBottom: spacing.md },
  link: { alignItems: "center", marginTop: spacing.lg },
  linkText: { color: colors.primary, fontWeight: "700" },
});
