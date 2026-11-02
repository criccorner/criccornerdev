import React, { useState } from "react";
import { View, Text, Image, Pressable, Alert, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import FormField from "./FormField";
import Button from "./Button";
import CityPicker from "./CityPicker";
import { uploadSponsorImage } from "../sponsors/images";
import { colors, spacing, typography, radius } from "../utils/theme";

// Add or edit one sponsor: name, tagline, contact details and a picture (logo).
// withCity: also pick the city its banner is shown in (app sponsors).
export default function SponsorEditor({ userId, initial, onSave, onCancel, withCity = false, saveLabel = "Save sponsor" }) {
  const [name, setName] = useState((initial && initial.name) || "");
  const [tagline, setTagline] = useState((initial && initial.tagline) || "");
  const [contact, setContact] = useState((initial && initial.contact) || "");
  const [imageUrl, setImageUrl] = useState((initial && initial.imageUrl) || null);
  const [place, setPlace] = useState(initial && initial.city ? { name: initial.city, label: initial.city, lat: initial.cityLat, lng: initial.cityLng } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 });
      if (r.canceled || !r.assets || !r.assets[0]) return;
      setBusy(true);
      setImageUrl(await uploadSponsorImage(userId, r.assets[0].uri));
    } catch (e) {
      Alert.alert("Couldn't add the picture", e && e.status === 0 ? "No internet connection." : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!name.trim()) {
      setError("Please enter the sponsor's name.");
      return;
    }
    setError("");
    const out = { name: name.trim(), tagline: tagline.trim() || null, contact: contact.trim() || null, imageUrl: imageUrl || null };
    if (withCity) Object.assign(out, { city: place ? place.name : null, cityLat: place ? place.lat : null, cityLng: place ? place.lng : null });
    onSave(out);
  };

  return (
    <View>
      <View style={styles.imageRow}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : <View style={[styles.image, styles.noImage]}><Text style={{ fontSize: 22 }}>🖼️</Text></View>}
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Button title={busy ? "Uploading…" : imageUrl ? "Change picture" : "Add picture"} variant="outline" onPress={pick} disabled={busy} />
          {imageUrl ? (
            <Pressable onPress={() => setImageUrl(null)} style={{ marginTop: spacing.xs }}>
              <Text style={{ color: colors.textMuted, fontWeight: "700", fontSize: 12 }}>Remove picture</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <FormField label="Sponsor name" value={name} onChangeText={setName} placeholder="e.g. Acme Sports" />
      <FormField label="Tagline (optional)" value={tagline} onChangeText={setTagline} placeholder="e.g. Official Kit Partner" />
      <FormField label="Contact details (optional)" value={contact} onChangeText={setContact} placeholder="Phone, email or website" autoCapitalize="none" />
      {withCity ? <CityPicker label="Show in city (leave empty for every city)" value={place} onChange={setPlace} /> : null}
      {error ? <Text style={{ color: colors.danger, marginBottom: spacing.sm }}>{error}</Text> : null}
      <Button title={saveLabel} onPress={save} disabled={busy} />
      {onCancel ? <Button title="Cancel" variant="outline" onPress={onCancel} style={{ marginTop: spacing.sm }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  imageRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  image: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.border },
  noImage: { alignItems: "center", justifyContent: "center" },
});
