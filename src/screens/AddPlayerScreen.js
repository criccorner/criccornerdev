import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useAppDispatch, useAllState } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import FormField from "../components/FormField";
import Button from "../components/Button";
import { validatePlayerEdit, findDuplicates } from "../players/playerOps";
import { checkAccountExists } from "../auth/duplicates";

const MODES = {
  ADD: "add",
  JOIN: "join",
};

export default function AddPlayerScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const all = useAllState();
  const [mode, setMode] = useState(MODES.ADD);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [dupPlayer, setDupPlayer] = useState(null); // an existing player with the same number / email
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const clearForm = () => {
    setName("");
    setPhone("");
    setEmail("");
  };

  const submit = async () => {
    setError("");
    setDupPlayer(null);
    setDone("");
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter the player's name.");
      return;
    }
    if (mode === MODES.JOIN && !phone.trim() && !email.trim()) {
      Alert.alert("Contact required", "Enter a mobile number or email to join.");
      return;
    }

    // Check the details are valid and tidy them (spaces, capitals).
    const v = validatePlayerEdit({ name: name.replace(/\s+/g, " ").trim(), phone, email, role: "Player" }, all.players || [], null);
    if (!v.ok) {
      setError(v.error);
      return;
    }

    if (mode === MODES.ADD) {
      // Is somebody already on CricCorner with this mobile number or email?
      const dup = findDuplicates(all.players || [], { phone: v.values.phone, email: v.values.email });
      if (dup.byPhone || dup.byEmail) {
        const who = dup.byPhone || dup.byEmail;
        const what = dup.byPhone && dup.byEmail ? "mobile number and email" : dup.byPhone ? "mobile number" : "email";
        setError(`The ${what} you entered is already registered (${who.name}). Please use a different one, or search for ${who.name} when you add players to a team.`);
        setDupPlayer(who);
        return;
      }
      setBusy(true);
      const remote = await checkAccountExists(v.values.email, v.values.phone); // someone registered whose entry hasn't reached this phone yet
      setBusy(false);
      if (remote.email || remote.phone) {
        const what = remote.email && remote.phone ? "mobile number and email" : remote.phone ? "mobile number" : "email";
        setError(`The ${what} you entered is already registered with CricCorner. Please use a different one.`);
        return;
      }
      dispatch({ type: "ADD_PLAYER", payload: { name: v.values.name, phone: v.values.phone, email: v.values.email } });
      // Confirm it, and leave every box empty, ready for the next player.
      setDone(`✅ ${v.values.name} has been added.`);
      clearForm();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(""), 6000);
    } else {
      // In production: send an OTP/magic link to phone/email, then call
      // JOIN_PLAYER_BY_CONTACT only after verification succeeds.
      dispatch({ type: "JOIN_PLAYER_BY_CONTACT", payload: { name: v.values.name, phone: v.values.phone, email: v.values.email } });
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.toggleRow}>
          <ToggleButton label="Add Player" active={mode === MODES.ADD} onPress={() => { setMode(MODES.ADD); setError(""); setDupPlayer(null); }} />
          <ToggleButton label="Join via Phone/Email" active={mode === MODES.JOIN} onPress={() => { setMode(MODES.JOIN); setError(""); setDupPlayer(null); }} />
        </View>

        <Text style={typography.muted}>
          {mode === MODES.ADD
            ? "Add a player to your roster manually. They can claim their profile later."
            : "A player enters their own mobile number or email to join the app directly (an OTP / verification link would be sent here in production)."}
        </Text>
        <View style={{ height: spacing.md }} />

        {done ? (
          <View style={styles.doneBox}>
            <Text style={styles.doneText}>{done}</Text>
          </View>
        ) : null}

        <FormField label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Virat Sharma" />
        <FormField
          label="Mobile Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. +91 98765 43210"
          keyboardType="phone-pad"
        />
        <FormField
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. player@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {dupPlayer ? (
          <Pressable onPress={() => navigation.navigate("PlayerStats", { playerId: dupPlayer.id })} style={styles.linkBtn} accessibilityLabel="View the existing player">
            <Text style={styles.linkText}>View {dupPlayer.name}</Text>
          </Pressable>
        ) : null}

        <Button title={busy ? "Checking…" : mode === MODES.ADD ? "Add Player" : "Join"} onPress={submit} disabled={busy} />
        {done ? <Button title="Done" variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ToggleButton({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.toggle, active && styles.toggleActive]}>
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, flexGrow: 1, backgroundColor: colors.background },
  toggleRow: { flexDirection: "row", backgroundColor: colors.border, borderRadius: radius.pill, marginBottom: spacing.md, padding: 4 },
  toggle: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: "center" },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontWeight: "600", color: colors.textMuted, fontSize: 13 },
  toggleTextActive: { color: "#fff" },
  error: { color: colors.danger, marginBottom: spacing.sm, lineHeight: 20 },
  doneBox: { backgroundColor: "#E6F4EA", borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  doneText: { color: "#1B5E20", fontWeight: "700" },
  linkBtn: { alignSelf: "flex-start", marginBottom: spacing.sm },
  linkText: { color: colors.primary, fontWeight: "800" },
});
