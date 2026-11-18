import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, Linking, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Card from "../../components/Card";
import { colors, spacing, typography, radius } from "../../utils/theme";
import { fetchApproved, groupByCategory, CATEGORIES, CATEGORY_ICON } from "../../marketplace/store";

// "Available Cricket Marketplace": approved listings, organised by category.
export default function MarketplaceBrowseScreen() {
  const [items, setItems] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);
  const [only, setOnly] = useState(null);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      fetchApproved().then((r) => { if (alive) { setItems(r); setFailed(false); } }).catch(() => { if (alive) { setItems([]); setFailed(true); } });
      return () => { alive = false; };
    }, [])
  );
  const groups = useMemo(() => groupByCategory(items || []).filter((g) => !only || g.category === only), [items, only]);
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[null, ...CATEGORIES].map((c) => (
          <Pressable key={c || "all"} onPress={() => setOnly(c)} style={[styles.chip, only === c && styles.chipOn]}>
            <Text style={[styles.chipText, only === c && { color: "#fff" }]}>{c ? `${CATEGORY_ICON[c]} ${c}` : "All"}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {items === null ? <Text style={[typography.muted, { marginTop: spacing.md }]}>Loading…</Text> : null}
      {failed ? <Text style={[typography.muted, { marginTop: spacing.md }]}>Couldn't load the marketplace. Check your internet connection.</Text> : null}
      {items && !failed && groups.length === 0 ? <Text style={[typography.muted, { marginTop: spacing.md }]}>Nothing listed here yet.</Text> : null}
      {groups.map((g) => (
        <View key={g.category} style={{ marginTop: spacing.md }}>
          <Text style={typography.h3}>{CATEGORY_ICON[g.category]} {g.category}</Text>
          {g.items.map((l) => (
            <Card key={l.id} style={{ marginTop: spacing.sm }}>
              <View style={{ flexDirection: "row" }}>
                <Image source={{ uri: l.imageUrl }} style={styles.image} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={typography.h3}>{l.title}</Text>
                  {l.description ? <Text style={typography.body}>{l.description}</Text> : null}
                  <Text style={typography.muted}>📍 {l.address}, {l.city}</Text>
                  <Pressable onPress={() => Linking.openURL(`tel:${l.contact.replace(/[^\d+]/g, "")}`).catch(() => {})} hitSlop={6}>
                    <Text style={styles.call}>📞 {l.contact}</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}
        </View>
      ))}
      <Text style={styles.note}>CricCorner only lists these businesses and services. It does not endorse them or take part in any dealing between you and the seller.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginRight: 6 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text, fontWeight: "600" },
  image: { width: 84, height: 84, borderRadius: radius.md || 8, backgroundColor: colors.border },
  call: { color: colors.primary, fontWeight: "800", marginTop: 4 },
  note: { marginTop: spacing.lg, marginBottom: spacing.xl, fontSize: 12, fontStyle: "italic", color: colors.textMuted },
});
