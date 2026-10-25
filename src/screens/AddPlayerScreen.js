import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useAppDispatch } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import FormField from "../components/FormField";
import Button from "../components/Button";

const MODES = { ADD: "add", JOIN: "join" };

export default function AddPlayerScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState(MODES.ADD);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const submit = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter the player's name.");
      return;
    }
    if (mode === MODES.JOIN && !phone.trim() && !email.trim()) {
      Alert.alert("Contact required", "Enter a mobile number or email to join.");
      return;
    }

    if (mode === MODES.ADD) {
      dispatch({ type: "ADD_PLAYER", payload: { name: name.trim(), phone: phone.trim() || null, email: email.trim() || null } });
    } else {
      dispatch({ type: "JOIN_PLAYER_BY_CONTACT", payload: { name: name.trim(), phone: phone.trim() || null, email: email.trim() || null } });
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.heroBadge}>Roster</Text>
          <Text style={styles.heroTitle}>Player profile</Text>
          <Text style={styles.heroText}>
            {mode === MODES.ADD
              ? "Add a player to your roster manually. They can claim their profile later."
              : "Invite a player in by collecting their mobile number or email for direct join."}
          </Text>
        </View>

        <View style={styles.toggleRow}>
          <ToggleButton label="Add Player" active={mode === MODES.ADD} onPress={() => setMode(MODES.ADD)} />
          <ToggleButton label="Join via Phone/Email" active={mode === MODES.JOIN} onPress={() => setMode(MODES.JOIN)} />
        </View>

        <View style={styles.formCard}>
          <FormField label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Virat Sharma" />
          <FormField label="Mobile Number" value={phone} onChangeText={setPhone} placeholder="e.g. +91 98765 43210" keyboardType="phone-pad" />
          <FormField label="Email Address" value={email} onChangeText={setEmail} placeholder="e.g. player@email.com" keyboardType="email-address" autoCapitalize="none" />
        </View>

        <Button title={mode === MODES.ADD ? "Add Player" : "Join"} onPress={submit} />
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
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: "#0E7A52",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D9F0E5",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: spacing.xs },
  heroText: { fontSize: 13, color: "#D9F0E5", lineHeight: 20 },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggle: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: "center" },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontWeight: "700", color: colors.textMuted, fontSize: 12 },
  toggleTextActive: { color: "#fff" },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
});
