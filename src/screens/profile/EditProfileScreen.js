import React, { useState } from "react";
import { View, Text, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../auth/AuthContext";
import { useAppState, useAppDispatch } from "../../context/AppContext";
import { ROLES } from "../../auth/validators";
import { playerMatchesUser } from "../../auth/identity";
import { updateMyProfile, photoUriFor, BATTING_STYLES, BOWLING_STYLES } from "../../profile/store";
import Avatar from "../../components/Avatar";
import FormField from "../../components/FormField";
import Button from "../../components/Button";
import { colors, spacing, typography, radius } from "../../utils/theme";

function Chips({ options, value, onChange, allowClear }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(allowClear && value === o ? null : o)} style={[styles.chip, value === o && styles.chipActive]}>
          <Text style={[styles.chipText, value === o && { color: "#fff" }]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function EditProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { players } = useAppState();
  const dispatch = useAppDispatch();

  const [name, setName] = useState(user.name || "");
  const [role, setRole] = useState(user.role || null);
  const [battingStyle, setBattingStyle] = useState(user.battingStyle || null);
  const [bowlingStyle, setBowlingStyle] = useState(user.bowlingStyle || null);
  const [city, setCity] = useState(user.city || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [pendingUri, setPendingUri] = useState(null); // newly chosen, not saved yet
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const savedUri = photoUriFor(user);
  const shownUri = pendingUri || (removePhoto ? null : savedUri);
  const hasPhoto = !!shownUri;

  const choose = (result) => {
    if (!result.canceled && result.assets && result.assets[0]) {
      setPendingUri(result.assets[0].uri);
      setRemovePhoto(false);
    }
  };

  const fromGallery = async () => {
    try {
      choose(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 }));
    } catch (e) {
      Alert.alert("Couldn't open photos", "Please try again.");
    }
  };

  const fromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Camera permission needed", "Allow camera access in your phone's settings to take a photo.");
        return;
      }
      choose(await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6 }));
    } catch (e) {
      Alert.alert("Couldn't open camera", "Please try again.");
    }
  };

  const removeCurrent = () => {
    setPendingUri(null);
    setRemovePhoto(true);
  };

  const save = async () => {
    setError("");
    setBusy(true);
    const r = await updateMyProfile(user.id, { name, role, battingStyle, bowlingStyle, city, phone, newPhotoUri: pendingUri, removePhoto });
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    // Keep this person's entry in the Players tab (used when scoring) in sync.
    const changes = { name: name.trim(), role, battingStyle, bowlingStyle, city: city.trim() || null };
    const newPhone = phone.trim() || null;
    const updated = players.map((p) => (playerMatchesUser(p, user) ? { ...p, ...changes, ...(newPhone ? { phone: newPhone } : {}) } : p));
    dispatch({ type: "HYDRATE", payload: { players: updated } });
    await refreshUser();
    Alert.alert("Saved", "Your profile has been updated.", [{ text: "OK", onPress: () => navigation.goBack() }]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
          <Avatar uri={shownUri} name={name || user.name} size={110} />
          <View style={styles.photoButtons}>
            <Pressable onPress={fromCamera} style={styles.photoBtn}>
              <Text style={styles.photoBtnText}>📷 Camera</Text>
            </Pressable>
            <Pressable onPress={fromGallery} style={styles.photoBtn}>
              <Text style={styles.photoBtnText}>🖼️ Gallery</Text>
            </Pressable>
          </View>
          {hasPhoto ? (
            <Pressable onPress={removeCurrent} style={{ marginTop: spacing.sm }}>
              <Text style={{ color: colors.danger, fontWeight: "700" }}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>

        <FormField label="Full Name" value={name} onChangeText={setName} maxLength={60} />

        <Text style={typography.label}>EMAIL (YOUR LOGIN)</Text>
        <Text style={[typography.body, { marginTop: spacing.xs }]}>{user.email || user.identifier}</Text>
        <Text style={[typography.muted, { marginBottom: spacing.md }]}>Can't be changed here because it's used to verify your account.</Text>

        <FormField label="Mobile Number (optional)" value={phone} onChangeText={setPhone} placeholder="e.g. +61434916595" keyboardType="phone-pad" />
        <Text style={[typography.muted, { marginTop: -spacing.sm, marginBottom: spacing.md }]}>Used to link your stats to your player entry.</Text>

        <Text style={typography.label}>PLAYING ROLE</Text>
        <Chips options={ROLES} value={role} onChange={setRole} />

        <Text style={typography.label}>BATTING STYLE (OPTIONAL)</Text>
        <Chips options={BATTING_STYLES} value={battingStyle} onChange={setBattingStyle} allowClear />

        <Text style={typography.label}>BOWLING STYLE (OPTIONAL)</Text>
        <Chips options={BOWLING_STYLES} value={bowlingStyle} onChange={setBowlingStyle} allowClear />

        <FormField label="City (optional)" value={city} onChangeText={setCity} maxLength={60} placeholder="e.g. Melbourne" />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Save Changes" onPress={save} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  photoButtons: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  photoBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  photoBtnText: { color: colors.primary, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  error: { color: colors.danger, marginBottom: spacing.md },
});
