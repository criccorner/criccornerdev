import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthContext";
import { listAllFeedback, STATUSES } from "../../admin/store";
import AdminGuard from "./AdminGuard";
import Card from "../../components/Card";
import Badge, { STATUS_COLORS } from "../../components/Badge";
import { colors, spacing, typography, radius } from "../../utils/theme";

const FILTERS = ["All", ...STATUSES];

export default function AdminFeedbackScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listAllFeedback(user.id).then((r) => alive && r.ok && setItems(r.items));
      return () => {
        alive = false;
      };
    }, [user.id])
  );

  const shown = filter === "All" ? items : items.filter((i) => i.status === filter);

  return (
    <AdminGuard>
      <View style={styles.container}>
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
              <Text style={[styles.chipText, filter === f && { color: "#fff" }]}>{f}</Text>
            </Pressable>
          ))}
        </View>
        <FlatList
          data={shown}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>Nothing here yet.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate("AdminFeedbackDetail", { id: item.id })}>
              <Card>
                <View style={styles.row}>
                  <View style={{ flexDirection: "row" }}>
                    <Badge label={item.type.toUpperCase()} color={item.type === "Issue" ? colors.danger : colors.info} />
                    <Badge label={item.status.toUpperCase()} color={STATUS_COLORS[item.status]} />
                  </View>
                  <Text style={typography.muted}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={[typography.muted, { marginTop: spacing.xs }]}>{item.userName} · {item.userContact}</Text>
                <Text style={[typography.body, { marginTop: spacing.xs }]} numberOfLines={2}>{item.detail}</Text>
                {item.reply ? <Text style={[typography.muted, { marginTop: spacing.xs }]}>✔ Replied</Text> : null}
              </Card>
            </Pressable>
          )}
        />
      </View>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, padding: spacing.md, paddingBottom: 0 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600", fontSize: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
