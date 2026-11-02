import React, { useCallback, useState } from "react";
import { View, Text, Image, ScrollView, Pressable, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthContext";
import { fetchSponsors, saveSponsor, deleteSponsor } from "../../sponsors/store";
import AdminGuard from "./AdminGuard";
import Card from "../../components/Card";
import Button from "../../components/Button";
import SponsorEditor from "../../components/SponsorEditor";
import { colors, spacing, typography, radius } from "../../utils/theme";

// Admin: sponsors that appear on every match in their city (or in every city when no city is set).
export default function AdminSponsorsScreen() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // sponsor, or "new"
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      fetchSponsors().then((l) => alive && setList(l));
      return () => { alive = false; };
    }, [])
  );

  const save = async (sp) => {
    setError("");
    try {
      const next = await saveSponsor(editing && editing !== "new" ? { ...editing, ...sp } : sp);
      setList(next);
      setEditing(null);
    } catch (e) {
      setError(e && e.message && !/^Request failed|^HTTP/i.test(e.message) ? e.message : "Couldn't save. Check your internet connection and that the sponsors SQL has been run in Supabase.");
    }
  };
  const toggle = async (sp) => {
    try { setList(await saveSponsor({ ...sp, active: !sp.active })); } catch (e) { setError("Couldn't update."); }
  };
  const remove = (sp) =>
    Alert.alert(`Delete ${sp.name}?`, "It will disappear from every match.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { setList(await deleteSponsor(sp.id)); } catch (e) { setError("Couldn't delete."); } } },
    ]);

  return (
    <AdminGuard>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
        <Text style={[typography.muted, { marginBottom: spacing.sm }]}>
          Sponsors you add here show above every match in their city, one after another every 5 seconds. A sponsor with no city shows everywhere.
        </Text>
        {error ? <Text style={{ color: colors.danger, marginBottom: spacing.sm }}>{error}</Text> : null}
        {editing ? (
          <Card>
            <Text style={typography.h3}>{editing === "new" ? "New app sponsor" : "Edit sponsor"}</Text>
            <View style={{ height: spacing.sm }} />
            <SponsorEditor
              key={editing === "new" ? "new" : editing.id}
              userId={user && user.id}
              initial={editing === "new" ? null : editing}
              withCity
              onSave={save}
              onCancel={() => setEditing(null)}
              saveLabel={editing === "new" ? "+ Add sponsor" : "Save sponsor"}
            />
          </Card>
        ) : (
          <Button title="+ Add app sponsor" onPress={() => setEditing("new")} />
        )}
        <View style={{ height: spacing.md }} />
        {list.length === 0 ? <Text style={[typography.muted, { textAlign: "center" }]}>No app sponsors yet.</Text> : null}
        {list.map((sp) => (
          <Card key={sp.id} style={!sp.active ? { opacity: 0.55 } : null}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {sp.imageUrl ? <Image source={{ uri: sp.imageUrl }} style={styles.img} /> : <View style={[styles.img, { alignItems: "center", justifyContent: "center" }]}><Text>🏷️</Text></View>}
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={typography.h3}>{sp.name}</Text>
                {sp.tagline ? <Text style={typography.muted}>{sp.tagline}</Text> : null}
                <Text style={typography.muted}>{sp.city ? `📍 ${sp.city}` : "📍 Every city"}{sp.contact ? ` · ${sp.contact}` : ""}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => setEditing(sp)}><Text style={styles.link}>Edit</Text></Pressable>
              <Pressable onPress={() => toggle(sp)}><Text style={styles.link}>{sp.active ? "Hide" : "Show"}</Text></Pressable>
              <Pressable onPress={() => remove(sp)}><Text style={[styles.link, { color: colors.danger }]}>Delete</Text></Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  img: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.border },
  actions: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm },
  link: { color: colors.primary, fontWeight: "800" },
});
