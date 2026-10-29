import React, { useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, TextInput } from "react-native";
import { useAccess } from "../context/AppContext";
import { contactLine } from "../access/mask";
import { useAuth } from "../auth/AuthContext";
import { playerMatchesUser, contactOf } from "../auth/identity";
import { colors, spacing, typography, radius } from "../utils/theme";
import Button from "../components/Button";
import Card from "../components/Card";
import Badge from "../components/Badge";

export default function PlayersScreen({ navigation }) {
  const { mine, canEdit, isAdmin } = useAccess();
  const players = mine.players;
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () => (q ? players.filter((p) => `${p.name || ""} ${p.role || ""}`.toLowerCase().includes(q)) : players),
    [players, q]
  );
  const sharing = user.isAdmin && user.phone ? players.filter((p) => playerMatchesUser(p, contactOf(user))).length : 0;

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Button title="+ Add / Join Player" onPress={() => navigation.navigate("AddPlayer")} />
        {sharing > 1 ? (
          <Pressable onPress={() => navigation.navigate("Profile", { screen: "FixContacts" })} style={styles.warn}>
            <Text style={styles.warnText}>⚠️ {sharing} players share your number ({user.phone}). Tap to fix.</Text>
          </Pressable>
        ) : null}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search players by name"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>
          {q ? `${shown.length} of ${players.length} players` : isAdmin ? "All players. Tap one to see their profile and stats." : "The players you added, and you. Tap one to see their profile and stats."}
        </Text>
      </View>
      <FlatList
        data={shown}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.md }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>
            {q ? `No players match “${query.trim()}”.` : "No players yet. Add your first player to get started."}
          </Text>
        }
        renderItem={({ item }) => {
          const isMe = playerMatchesUser(item, user);
          const editable = canEdit("players", item.id);
          return (
            <Pressable onPress={() => navigation.navigate("PlayerStats", { playerId: item.id })}>
              <Card style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                    <Text style={[typography.h3, { marginRight: spacing.sm }]}>{item.name}</Text>
                    {isMe ? <Badge label="YOU" color={colors.primary} /> : null}
                  </View>
                  <Text style={typography.muted}>{contactLine(item, editable || isAdmin) || (editable ? "No contact: use Edit to add a mobile number" : "No contact")}</Text>
                  {item.role && item.role !== "Player" ? <Text style={typography.muted}>{item.role}</Text> : null}
                </View>
                {editable ? (
                  <Pressable onPress={() => navigation.navigate("EditPlayer", { playerId: item.id })} hitSlop={8} style={styles.editPill}>
                    <Text style={styles.editPillText}>✏️ Edit</Text>
                  </Pressable>
                ) : (
                  <Text style={{ color: colors.textMuted }}>›</Text>
                )}
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { padding: spacing.md, paddingBottom: 0 },
  warn: { marginTop: spacing.sm, backgroundColor: "#FFF6DB", borderColor: colors.accent, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  warnText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: spacing.sm },
  searchBox: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md },
  searchIcon: { fontSize: 15, marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: spacing.sm + 2, fontSize: 15, color: colors.text },
  searchClear: { color: colors.textMuted, fontSize: 16, fontWeight: "700", paddingLeft: spacing.sm },
  editPill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  editPillText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
});
