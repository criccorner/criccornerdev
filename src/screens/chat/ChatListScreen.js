import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthContext";
import Card from "../../components/Card";
import Avatar from "../../components/Avatar";
import { colors, spacing, typography } from "../../utils/theme";
import { fetchMine, people, conversations } from "../../chat/store";

// Messages: your conversations, newest first. Unread ones are in bold.
export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [names, setNames] = useState({});
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const load = async () => {
        try {
          const c = conversations(await fetchMine(user.id), user.id);
          const n = await people(c.map((x) => x.otherId));
          if (alive) { setRows(c); setNames(n); setFailed(false); }
        } catch (e) { if (alive) { setRows((r) => r || []); setFailed(true); } }
      };
      load();
      const t = setInterval(load, 15000);
      return () => { alive = false; clearInterval(t); };
    }, [user.id])
  );

  return (
    <View style={styles.container}>
      {rows === null ? <Text style={typography.muted}>Loading…</Text> : null}
      {failed ? <Text style={typography.muted}>Couldn't load your messages. Check your connection.</Text> : null}
      {rows && !failed && rows.length === 0 ? (
        <Text style={typography.muted}>No messages yet. Use Find → Looking for a player / a team to join, then tap Message.</Text>
      ) : null}
      <FlatList
        data={rows || []}
        keyExtractor={(c) => c.otherId}
        renderItem={({ item }) => {
          const p = names[item.otherId] || { name: "Player" };
          return (
            <Pressable onPress={() => navigation.navigate("Chat", { otherId: item.otherId, name: p.name })}>
              <Card style={{ marginTop: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Avatar uri={p.photoUrl} name={p.name} size={44} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.h3, item.unread ? { color: colors.primary } : null]}>{p.name}</Text>
                    <Text style={[typography.muted, item.unread ? { fontWeight: "800", color: colors.text } : null]} numberOfLines={1}>
                      {item.last.from === user.id ? "You: " : ""}{item.last.body}
                    </Text>
                  </View>
                  {item.unread ? <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View> : null}
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
