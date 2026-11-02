import React, { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import FormField from "../components/FormField";
import Button from "../components/Button";
import CityPicker from "../components/CityPicker";
import { colors, spacing, typography } from "../utils/theme";

export const isIsoDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ""))) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

// Change a tournament's name, dates, city and contact. Sponsors are edited on the tournament page.
export default function EditTournamentScreen({ route, navigation }) {
  const { tournamentId } = route.params;
  const { tournaments } = useAppState();
  const dispatch = useAppDispatch();
  const { canEdit } = useAccess();
  const t = tournaments.find((x) => x.id === tournamentId);
  const [name, setName] = useState((t && t.name) || "");
  const [startDate, setStartDate] = useState((t && t.startDate) || "");
  const [endDate, setEndDate] = useState((t && t.endDate) || "");
  const [contact, setContact] = useState((t && t.contact) || "");
  const [place, setPlace] = useState(t && t.city ? { name: t.city, label: t.cityLabel || t.city, lat: t.cityLat, lng: t.cityLng } : null);
  const [error, setError] = useState("");

  if (!t) return null;
  if (!canEdit("tournaments", tournamentId)) {
    return (
      <View style={styles.center}>
        <Text style={typography.h3}>Only the organiser can change this tournament</Text>
      </View>
    );
  }

  const save = () => {
    setError("");
    const nm = name.trim().replace(/\s+/g, " ");
    if (!nm) return setError("Tournament name is required.");
    if (nm.length > 60) return setError("The name must be 60 characters or fewer.");
    if (startDate.trim() && !isIsoDate(startDate.trim())) return setError("Start date must look like 2026-08-15.");
    if (endDate.trim() && !isIsoDate(endDate.trim())) return setError("End date must look like 2026-08-30, or leave it empty.");
    if (startDate.trim() && endDate.trim() && endDate.trim() < startDate.trim()) return setError("The end date can't be before the start date.");
    if (!place) return setError("Please pick the city from the list.");
    dispatch({
      type: "UPDATE_TOURNAMENT",
      payload: {
        tournamentId,
        changes: {
          name: nm,
          startDate: startDate.trim() || null,
          endDate: endDate.trim() || null,
          contact: contact.trim() || null,
          city: place.name,
          cityLabel: place.label || place.name,
          cityLat: Number.isFinite(place.lat) ? place.lat : null,
          cityLng: Number.isFinite(place.lng) ? place.lng : null,
        },
      },
    });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <FormField label="Tournament name" value={name} onChangeText={setName} />
        <FormField label="From (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2026-08-15" />
        <FormField label="To (YYYY-MM-DD, optional)" value={endDate} onChangeText={setEndDate} placeholder="2026-08-30" />
        <CityPicker label="City" value={place} onChange={setPlace} />
        <FormField label="Contact for people who want to join (optional)" value={contact} onChangeText={setContact} placeholder="Phone, email or WhatsApp" autoCapitalize="none" />
        {error ? <Text style={{ color: colors.danger, marginBottom: spacing.sm }}>{error}</Text> : null}
        <Button title="Save changes" onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: colors.background },
});
