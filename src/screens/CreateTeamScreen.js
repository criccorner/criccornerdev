import { useAuth } from "../auth/AuthContext";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAppDispatch, useAllState, useSync } from "../context/AppContext";
import { playerMatchesUser } from "../auth/identity";
import { newId } from "../utils/id";
import { uploadTeamLogo } from "../teams/logo";
import { colors, spacing, typography, radius } from "../utils/theme";
import FormField from "../components/FormField";
import Button from "../components/Button";
import CityPicker from "../components/CityPicker";
import Avatar from "../components/Avatar";

// The person who creates a team is its owner, so there is nothing to choose here.
export default function CreateTeamScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const { players } = useAllState();
  const { user } = useAuth();
  const { syncNow } = useSync();
  const [name, setName] = useState("");
  const [place, setPlace] = useState(null);
  const [logoUri, setLogoUri] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pickLogo = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 });
      if (!r.canceled && r.assets && r.assets[0]) setLogoUri(r.assets[0].uri);
    } catch (e) {
      setError("Couldn't open your photos.");
    }
  };

  const submit = async () => {
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) {
      setError("Please enter the team name.");
      return;
    }
    setError("");
    setBusy(true);
    const id = newId("team");
    const me = (players || []).find((p) => playerMatchesUser(p, user));
    let logoUrl = null;
    let logoFailed = false;
    if (logoUri && user) {
      try {
        logoUrl = await uploadTeamLogo(user.id, id, logoUri);
      } catch (e) {
        logoFailed = true;
      }
    }
    dispatch({
      type: "ADD_TEAM",
      payload: {
        id,
        name: clean,
        ownerId: me ? me.id : null,
        createdByName: (user && user.name) || null,
        ...(logoUrl ? { logoUrl } : {}),
        ...(place ? { city: place.name, cityLabel: place.label || place.name, cityLat: place.lat, cityLng: place.lng } : {}),
      },
    });
    syncNow();
    setBusy(false);
    Alert.alert(
      "Team created",
      `${clean} has been created.${logoFailed ? " The logo couldn't be uploaded (check your internet); you can add it from the team page." : ""}`,
      [{ text: "OK", onPress: () => navigation.replace("TeamDetail", { teamId: id }) }]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <FormField label="Team Name" value={name} onChangeText={setName} placeholder="e.g. Mumbai Strikers" />

      <Text style={typography.label}>TEAM LOGO (OPTIONAL)</Text>
      <View style={styles.logoRow}>
        <Avatar uri={logoUri} name={name || "Team"} size={64} />
        <View style={{ marginLeft: spacing.md }}>
          <Pressable onPress={pickLogo} style={styles.pick}>
            <Text style={styles.pickText}>{logoUri ? "Change logo" : "Upload logo"}</Text>
          </Pressable>
          {logoUri ? (
            <Pressable onPress={() => setLogoUri(null)} hitSlop={6}>
              <Text style={{ color: colors.textMuted, fontWeight: "700", marginTop: 6 }}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <CityPicker label="City" value={place} onChange={setPlace} />

      <Text style={typography.muted}>You will be the owner of this team.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ height: spacing.lg }} />
      <Button title={busy ? "Creating…" : "Create Team"} onPress={submit} disabled={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  logoRow: { flexDirection: "row", alignItems: "center", marginVertical: spacing.sm, marginBottom: spacing.md },
  pick: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pickText: { color: colors.primary, fontWeight: "800" },
  error: { color: colors.danger, marginTop: spacing.sm },
});
