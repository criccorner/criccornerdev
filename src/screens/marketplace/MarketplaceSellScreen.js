import React, { useCallback, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../auth/AuthContext";
import Card from "../../components/Card";
import Button from "../../components/Button";
import FormField from "../../components/FormField";
import { colors, spacing, typography } from "../../utils/theme";
import { CATEGORIES, CATEGORY_ICON, fetchMine, saveListing, deleteListing, validateListing, isExpired } from "../../marketplace/store";
import { uploadMarketImage } from "../../marketplace/images";

const STATUS_TEXT = {
  pending: "⏳ Waiting for admin approval. It will appear in the marketplace once approved.",
  approved: "✅ Approved - your listing is live in the Cricket Marketplace.",
  rejected: "❌ Not approved. Please fix it and submit again.",
};

// Sell: one product / service listing per person, with a picture, category, contact number, address and city.
export default function MarketplaceSellScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState(null);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ title: "", description: "", category: null, imageUrl: null, contact: "", address: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      fetchMine(user.id).then((l) => { if (alive) { setMine(l); setLoading(false); } }).catch(() => { if (alive) setLoading(false); });
      return () => { alive = false; };
    }, [user.id])
  );

  const startEdit = (l) => {
    setF(l ? { title: l.title, description: l.description, category: l.category, imageUrl: l.imageUrl, contact: l.contact, address: l.address, city: l.city } : { title: "", description: "", category: null, imageUrl: null, contact: user.phone || "", address: "", city: "" });
    setError("");
    setEditing(true);
  };

  const pick = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 });
      if (r.canceled || !r.assets || !r.assets[0]) return;
      setBusy(true);
      set("imageUrl")(await uploadMarketImage(user.id, r.assets[0].uri));
    } catch (e) {
      Alert.alert("Couldn't add the picture", e && e.status === 0 ? "No internet connection." : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const err = validateListing(f);
    if (err) { setError(err); return; }
    setError("");
    setBusy(true);
    try {
      const saved = await saveListing({ ...f, ownerName: user.name || user.email || "" }, user.id, mine && mine.id);
      setMine(saved);
      setEditing(false);
      Alert.alert("Submitted", "Your listing has been sent to the admin for approval.");
    } catch (e) {
      setError(e && e.message && !/fetch|network/i.test(e.message) ? e.message : "Couldn't save your listing. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert("Delete your listing?", "It will be removed from the marketplace. You can add a new one afterwards.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await deleteListing(mine.id); setMine(null); } catch (e) { Alert.alert("Couldn't delete", "Please try again."); } } },
    ]);

  if (loading) return <View style={styles.container}><Text style={typography.muted}>Loading…</Text></View>;

  if (mine && !editing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
        <Card>
          <Text style={typography.h3}>{mine.title}</Text>
          <Text style={typography.muted}>{CATEGORY_ICON[mine.category]} {mine.category}</Text>
          <Image source={{ uri: mine.imageUrl }} style={styles.preview} />
          {mine.description ? <Text style={typography.body}>{mine.description}</Text> : null}
          <Text style={typography.body}>📞 {mine.contact}</Text>
          <Text style={typography.body}>📍 {mine.address}, {mine.city}</Text>
          <Text style={[typography.body, { marginTop: spacing.sm, fontWeight: "700" }]}>{isExpired(mine) ? `⌛ Expired on ${String(mine.expiresAt).slice(0, 10)} - it is hidden until an admin approves it again.` : STATUS_TEXT[mine.status] + (mine.status === "approved" && mine.expiresAt ? ` Live until ${String(mine.expiresAt).slice(0, 10)}.` : "")}</Text>
          {mine.status === "rejected" && mine.rejectReason ? <Text style={typography.muted}>Reason: {mine.rejectReason}</Text> : null}
        </Card>
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>You can have one listing. Editing it sends it for approval again.</Text>
        <Button title="Edit listing" onPress={() => startEdit(mine)} style={{ marginTop: spacing.sm }} />
        <Button title="Delete listing" variant="outline" onPress={remove} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    );
  }

  if (!mine && !editing) {
    return (
      <View style={styles.container}>
        <Card>
          <Text style={typography.h3}>Sell on the Cricket Marketplace</Text>
          <Text style={typography.muted}>List one product or service - a store, gear, physio, gym, club or coaching. An admin approves it before anyone else can see it.</Text>
        </Card>
        <Button title="Add my listing" onPress={() => startEdit(null)} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <View style={styles.imageRow}>
        {f.imageUrl ? <Image source={{ uri: f.imageUrl }} style={styles.thumb} /> : <View style={[styles.thumb, styles.noImage]}><Text style={{ fontSize: 24 }}>🖼️</Text></View>}
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Button title={busy ? "Uploading…" : f.imageUrl ? "Change picture" : "Add picture"} variant="outline" onPress={pick} disabled={busy} />
        </View>
      </View>
      <FormField label="Product / service name" value={f.title} onChangeText={set("title")} placeholder="e.g. Kookaburra bats" />
      <FormField label="Description (optional)" value={f.description} onChangeText={set("description")} placeholder="A line or two about it" />
      <Text style={styles.label}>CATEGORY</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Pressable key={c} onPress={() => set("category")(c)} style={[styles.chip, f.category === c && styles.chipOn]}>
            <Text style={[styles.chipText, f.category === c && { color: "#fff" }]}>{CATEGORY_ICON[c]} {c}</Text>
          </Pressable>
        ))}
      </View>
      <FormField label="Contact number" value={f.contact} onChangeText={set("contact")} placeholder="e.g. 0434 916 595" keyboardType="phone-pad" />
      <FormField label="Address" value={f.address} onChangeText={set("address")} placeholder="Street address" />
      <FormField label="City" value={f.city} onChangeText={set("city")} placeholder="City" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={busy ? "Please wait…" : "Submit for approval"} onPress={submit} disabled={busy} style={{ marginTop: spacing.sm }} />
      <Button title="Cancel" variant="outline" onPress={() => (mine ? setEditing(false) : navigation.goBack())} style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  preview: { width: "100%", height: 200, borderRadius: 8, marginVertical: spacing.sm, backgroundColor: colors.border },
  imageRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  noImage: { backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "800", color: colors.textMuted, marginTop: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginRight: 6, marginBottom: 6 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text, fontWeight: "600" },
  error: { color: colors.danger || "#C0392B", marginTop: spacing.sm, fontWeight: "600" },
});
