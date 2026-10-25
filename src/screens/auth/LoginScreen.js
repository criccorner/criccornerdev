import React, { useState } from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import Button from "../../components/Button";
import SocialButtons from "../../components/SocialButtons";
import { useAuth } from "../../auth/AuthContext";
import { colors, spacing } from "../../utils/theme";

export default function LoginScreen({ navigation, route }) {
  const { login, resendCode, notice } = useAuth();
  const [identifier, setIdentifier] = useState(route.params?.identifier || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    const r = await login(identifier, password);
    setBusy(false);
    if (r.ok) return; // App switches to the main app automatically
    if (r.needsVerification) {
      await resendCode(r.identifier);
      navigation.navigate("Verify", { identifier: r.identifier });
      return;
    }
    setError(r.error);
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in with your email and password.">
      <FormField label="Email" value={identifier} onChangeText={setIdentifier} placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" autoComplete="username" textContentType="username" autoCorrect={false} />
      <FormField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" />
      {notice ? <Text style={styles.error}>{notice}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Log In" onPress={submit} loading={busy} />

      <Pressable onPress={() => navigation.navigate("ForgotPassword", { identifier })} style={styles.link}>
        <Text style={styles.linkText}>Forgot password?</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Register")} style={styles.link}>
        <Text style={styles.linkText}>New here? Create an account</Text>
      </Pressable>
      <SocialButtons />
      <Pressable onPress={() => navigation.navigate("Help")} style={styles.link}>
        <Text style={styles.linkText}>❓ Help — how to use CricCorner</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: spacing.md },
  link: { alignItems: "center", marginTop: spacing.lg },
  linkText: { color: colors.primary, fontWeight: "700" },
});
