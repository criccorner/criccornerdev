import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthContext";
import { listAllFeedback, listUsers } from "../../admin/store";
import AdminGuard from "./AdminGuard";
import Card from "../../components/Card";
import { colors, spacing, typography } from "../../utils/theme";

function Stat({ label, value }) {
  return (
    <Card style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={typography.muted}>{label}</Text>
    </Card>
  );
}

function Row({ label, hint, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={typography.h3}>{label}</Text>
        <Text style={typography.muted}>{hint}</Text>
      </View>
      <Text style={{ color: colors.textMuted }}>›</Text>
    </Pressable>
  );
}

export default function AdminHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ open: 0, users: 0, blocked: 0 });

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const f = await listAllFeedback(user.id);
        const u = await listUsers(user.id);
        if (!alive || !f.ok || !u.ok) return;
        setStats({
          open: f.items.filter((i) => i.status === "Open").length,
          users: u.users.length,
          blocked: u.users.filter((x) => x.blocked).length,
        });
      })();
      return () => {
        alive = false;
      };
    }, [user.id])
  );

  return (
    <AdminGuard>
      <View style={styles.container}>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Stat label="Open items" value={stats.open} />
          <Stat label="Users" value={stats.users} />
          <Stat label="Blocked" value={stats.blocked} />
        </View>
        <Card>
          <Row label="💬 Issues & Suggestions" hint="Review, set status, and reply" onPress={() => navigation.navigate("AdminFeedback")} />
          <Row label="👥 Registered Users" hint="View, edit, make admin, or block" onPress={() => navigation.navigate("AdminUsers")} />
        </Card>
      </View>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
});
