import React, { useCallback, useState } from "react";
import { View, Text, Image, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AdminGuard from "../admin/AdminGuard";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { colors, spacing, typography, radius } from "../../utils/theme";
import { fetchByStatus, reviewListing, deleteListing, expiryFromDay, isExpired, CATEGORY_ICON } from "../../marketplace/store";

const pad = (n) => String(n).padStart(2, "0");
const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const PRESETS = [["30 days", 30], ["3 months", 90], ["6 months", 180], ["1 year", 365]];
const TABS = [["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]];

// Cricket Marketplace Requests (administrators only): approve or reject what people submitted.
export default function AdminMarketplaceScreen() {
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState(null);
  const [reasons, setReasons] = useState({});
  const [expiry, setExpiry] = useState({}); // listing id -> "YYYY-MM-DD"
  const [busyId, setBusyId] = useState(null);

  const load = useCallback((t) => {
    setItems(null);
    fetchByStatus(t).then(setItems).catch(() => { setItems([]); Alert.alert("Couldn't load", "Please check your connection."); });
  }, []);
  useFocusEffect(useCallback(() => { load(tab); }, [tab, load]));

  const act = async (l, status) => {
    let until = null;
    if (status === "approved") {
      until = expiryFromDay(expiry[l.id] || inDays(90));
      if (!until) { Alert.alert("Expiry date needed", "Enter a future expiry date as YYYY-MM-DD, or tap one of the shortcuts."); return; }
    }
    setBusyId(l.id);
    try {
      await reviewListing(l.id, status, reasons[l.id], until);
      setItems((cur) => (cur || []).filter((x) => x.id !== l.id));
    } catch (e) {
      Alert.alert("Couldn't update", "Please try again.");
    } finally {
      setBusyId(null);
    }
  };
  const remove = (l) =>
    Alert.alert("Delete this listing?", `${l.title} will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await deleteListing(l.id); setItems((cur) => (cur || []).filter((x) => x.id !== l.id)); } catch (e) { Alert.alert("Couldn't delete", "Please try again."); } } },
    ]);

  return (
    <AdminGuard>
      <View style={styles.container}>
        <View style={styles.tabs}>
          {TABS.map(([k, label]) => (
            <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabOn]}>
              <Text style={[styles.tabText, tab === k && { color: "#fff" }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
          {items === null ? <Text style={typography.muted}>Loading…</Text> : null}
          {items && items.length === 0 ? <Text style={typography.muted}>No {tab} requests.</Text> : null}
          {(items || []).map((l) => (
            <Card key={l.id} style={{ marginTop: spacing.sm }}>
              <View style={{ flexDirection: "row" }}>
                <Image source={{ uri: l.imageUrl }} style={styles.image} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={typography.h3}>{l.title}</Text>
                  <Text style={typography.muted}>{CATEGORY_ICON[l.category]} {l.category}</Text>
                  {l.description ? <Text style={typography.body}>{l.description}</Text> : null}
                  <Text style={typography.body}>📞 {l.contact}</Text>
                  <Text style={typography.body}>📍 {l.address}, {l.city}</Text>
                  <Text style={typography.muted}>By {l.ownerName || "Unknown"} · {String(l.createdAt || "").slice(0, 10)}</Text>
                  {isExpired(l) ? <Text style={{ color: colors.danger, fontWeight: "700" }}>⌛ Expired on {String(l.expiresAt).slice(0, 10)} - approve again to show it</Text> : null}
                  {l.status === "approved" && !isExpired(l) && l.expiresAt ? <Text style={typography.muted}>Live until {String(l.expiresAt).slice(0, 10)}</Text> : null}
                  {l.status === "rejected" && l.rejectReason ? <Text style={typography.muted}>Reason: {l.rejectReason}</Text> : null}
                </View>
              </View>
              {tab !== "rejected" ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={typography.label}>EXPIRY DATE (REQUIRED TO APPROVE)</Text>
                  <TextInput
                    value={expiry[l.id] !== undefined ? expiry[l.id] : inDays(90)}
                    onChangeText={(v) => setExpiry((e) => ({ ...e, [l.id]: v }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {PRESETS.map(([label, n]) => (
                      <Pressable key={label} onPress={() => setExpiry((e) => ({ ...e, [l.id]: inDays(n) }))} style={styles.tab}>
                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
              {tab !== "rejected" ? (
                <TextInput
                  value={reasons[l.id] || ""}
                  onChangeText={(v) => setReasons((r) => ({ ...r, [l.id]: v }))}
                  placeholder="Reason if rejecting (optional)"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              ) : null}
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                {tab !== "approved" || isExpired(l) ? <View style={{ flex: 1 }}><Button title={isExpired(l) ? "Approve again" : "Approve"} onPress={() => act(l, "approved")} disabled={busyId === l.id} /></View> : null}
                {tab !== "rejected" ? <View style={{ flex: 1 }}><Button title="Reject" variant="outline" onPress={() => act(l, "rejected")} disabled={busyId === l.id} /></View> : null}
                <View style={{ flex: 1 }}><Button title="Delete" variant="outline" onPress={() => remove(l)} disabled={busyId === l.id} /></View>
              </View>
            </Card>
          ))}
        </ScrollView>
      </View>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  tabs: { flexDirection: "row", gap: 6, marginBottom: spacing.sm },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontWeight: "700", color: colors.text },
  image: { width: 84, height: 84, borderRadius: radius.md || 8, backgroundColor: colors.border },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, marginTop: spacing.sm, color: colors.text },
});
