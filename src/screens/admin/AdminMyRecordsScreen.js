import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import AdminGuard from "./AdminGuard";
import Card from "../../components/Card";
import { useAccess } from "../../context/AppContext";
import { asRecords, openRecord } from "../../admin/records";
import { colors, spacing, typography } from "../../utils/theme";

// Admin: only the players, teams and tournaments this admin created (is the owner of).
export default function AdminMyRecordsScreen({ navigation }) {
  const { createdByMe } = useAccess();
  const rec = asRecords(createdByMe);
  const groups = [
    { title: `🧑 Players I created (${rec.Player.length})`, data: rec.Player },
    { title: `👥 Teams I created (${rec.Team.length})`, data: rec.Team },
    { title: `🏆 Tournaments I created (${rec.Tournament.length})`, data: rec.Tournament },
  ];
  const rows = [];
  for (const g of groups) {
    rows.push({ key: "h" + g.title, header: g.title });
    if (!g.data.length) rows.push({ key: "n" + g.title, none: true });
    for (const r of g.data) rows.push({ key: r.type + r.id, rec: r });
  }
  return (
    <AdminGuard>
      <FlatList
        style={styles.container}
        contentContainerStyle={{ padding: spacing.md }}
        data={rows}
        keyExtractor={(r) => r.key}
        renderItem={({ item }) =>
          item.header ? (
            <Text style={[typography.h3, { marginTop: spacing.md, marginBottom: spacing.xs }]}>{item.header}</Text>
          ) : item.none ? (
            <Text style={typography.muted}>None yet.</Text>
          ) : (
            <Pressable onPress={() => openRecord(navigation, item.rec)}>
              <Card>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.h3}>{item.rec.title}</Text>
                    {item.rec.sub ? <Text style={typography.muted}>{item.rec.sub}</Text> : null}
                  </View>
                  <Text style={{ color: colors.textMuted }}>›</Text>
                </View>
              </Card>
            </Pressable>
          )
        }
      />
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: "row", alignItems: "center" },
});
