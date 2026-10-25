import React, { useCallback, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthContext";
import { listUsers } from "../../admin/store";
import AdminGuard from "./AdminGuard";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { colors, spacing, typography, radius } from "../../utils/theme";

export default function AdminUsersScreen({ navigation }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listUsers(user.id).then((r) => alive && r.ok && setUsers(r.users));
      return () => {
        alive = false;
      };
    }, [user.id])
  );

  const q = query.trim().toLowerCase();
  const shown = q ? users.filter((u) => u.name.toLowerCase().includes(q) || u.identifier.toLowerCase().includes(q)) : users;

  return (
    <AdminGuard>
      <View style={styles.container}>
        <View style={{ padding: spacing.md, paddingBottom: 0 }}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, mobile or email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          <Text style={[typography.muted, { marginTop: spacing.xs }]}>{shown.length} of {users.length} registered users</Text>
        </View>
        <FlatList
          data={shown}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>No users found.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate("AdminUserEdit", { userId: item.id })}>
              <Card>
                <View style={styles.row}>
                  <Text style={typography.h3}>{item.name}</Text>
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>Edit ›</Text>
                </View>
                <Text style={typography.muted}>{item.identifier}</Text>
                <Text style={[typography.body, { marginTop: 2 }]}>{item.role}</Text>
                <View style={{ flexDirection: "row", marginTop: spacing.sm, flexWrap: "wrap" }}>
                  {item.isAdmin ? <Badge label="ADMIN" color={colors.accent} /> : null}
                  {item.blocked ? <Badge label="BLOCKED" color={colors.danger} /> : null}
                  {!item.verified ? <Badge label="UNVERIFIED" color={colors.textMuted} /> : null}
                  {item.verified && !item.blocked ? <Badge label="ACTIVE" color={colors.success} /> : null}
                </View>
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
  search: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, fontSize: 15, color: colors.text },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
