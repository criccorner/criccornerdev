import React from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useAccess } from "../context/AppContext";
import { contactLine } from "../access/mask";
import { useAuth } from "../auth/AuthContext";
import { playerMatchesUser, contactOf } from "../auth/identity";
import { Alert } from "react-native";
import { colors, spacing, typography, radius } from "../utils/theme";
import Button from "../components/Button";
import Card from "../components/Card";
import Badge from "../components/Badge";

export default function PlayersScreen({ navigation }) {
  const { mine, canEdit, isAdmin } = useAccess();
  const players = mine.players;
  const { user } = useAuth();
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
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>{isAdmin ? "All players. Tap one to edit their details." : "The players you added, and you. Tap one to edit."}</Text>
      </View>
      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={<Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>No players yet. Add your first player to get started.</Text>}
        renderItem={({ item }) => {
          const isMe = playerMatchesUser(item, user);
          const editable = canEdit("players", item.id);
          return (
            <Pressable
              onPress={() =>
                editable
                  ? navigation.navigate("EditPlayer", { playerId: item.id })
                  : Alert.alert(item.name, "You can only edit your own details and the players you added.")
              }
            >
              <Card style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                    <Text style={[typography.h3, { marginRight: spacing.sm }]}>{item.name}</Text>
                    {isMe ? <Badge label="YOU" color={colors.primary} /> : null}
                  </View>
                  <Text style={typography.muted}>{contactLine(item, editable || isAdmin) || (editable ? "No contact: tap to add a mobile number" : "No contact")}</Text>
                  {item.role && item.role !== "Player" ? <Text style={typography.muted}>{item.role}</Text> : null}
                </View>
                <Text style={{ color: colors.textMuted }}>{editable ? "›" : "🔒"}</Text>
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
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
});
