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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.toggleRow}>
          <ToggleButton label="Add Player" active={mode === MODES.ADD} onPress={() => setMode(MODES.ADD)} />
          <ToggleButton label="Join via Phone/Email" active={mode === MODES.JOIN} onPress={() => setMode(MODES.JOIN)} />
        </View>

        <Text style={typography.muted}>
          {mode === MODES.ADD
            ? "Add a player to your roster manually. They can claim their profile later."
            : "A player enters their own mobile number or email to join the app directly (an OTP / verification link would be sent here in production)."}
        </Text>
        <View style={{ height: spacing.md }} />

        <FormField label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Virat Sharma" />
        <FormField label="Mobile Number" value={phone} onChangeText={setPhone} placeholder="e.g. +91 98765 43210" keyboardType="phone-pad" />
        <FormField label="Email Address" value={email} onChangeText={setEmail} placeholder="e.g. player@email.com" keyboardType="email-address" autoCapitalize="none" />

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
  toggleRow: { flexDirection: "row", backgroundColor: colors.border, borderRadius: radius.pill, marginBottom: spacing.md, padding: 4 },
  toggle: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: "center" },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontWeight: "600", color: colors.textMuted, fontSize: 13 },
  toggleTextActive: { color: "#fff" },
});
