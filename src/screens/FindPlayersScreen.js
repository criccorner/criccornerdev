import React, { useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { useAllState } from "../context/AppContext";
import { playerMatchesUser } from "../auth/identity";
import Card from "../components/Card";
import { colors, spacing, typography, radius } from "../utils/theme";
import { availablePlayers, LOOKING_FOR } from "../utils/finder";

// Looking for a player: people who ticked "Available to join a team" in their profile.
export default function FindPlayersScreen({ navigation }) {
  const { user } = useAuth();
  const all = useAllState();
  const [strength, setStrength] = useState("Any");
  const [city, setCity] = useState("");
  const me = all.players.find((p) => playerMatchesUser(p, user));
  const list = useMemo(
    () => availablePlayers(all.players, { strength, city, excludeIds: me ? [me.id] : [] }),
    [all.players, strength, city, me && me.id]
  );
  return (
    <View style={styles.container}>
      <Text style={typography.muted}>Registered players who are available to join a team ({list.length})</Text>
      <View style={styles.chips}>
        {LOOKING_FOR.map((o) => (
          <Pressable key={o} onPress={() => setStrength(o)} style={[styles.chip, strength === o && styles.chipOn]}>
            <Text style={[styles.chipText, strength === o && { color: "#fff" }]}>{o}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput value={city} onChangeText={setCity} placeholder="Filter by city (optional)" placeholderTextColor={colors.textMuted} style={styles.input} />
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        ListEmptyComponent={<Text style={[typography.muted, { marginTop: spacing.md }]}>No available players found. Players appear here after they tick "Available to join a team" in Edit Profile.</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginTop: spacing.sm }}>
            <Text style={typography.h3}>{item.name}</Text>
            <Text style={typography.muted}>{[item.role, item.battingStyle, item.bowlingStyle].filter(Boolean).join(" · ") || "Role not set"}</Text>
            {item.city ? <Text style={typography.muted}>📍 {item.city}</Text> : null}
            <Pressable onPress={() => navigation.navigate("Chat", { kind: "players", id: item.id, name: item.name })} style={styles.msg}>
              <Text style={styles.msgText}>💬 Message</Text>
            </Pressable>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, color: colors.text, backgroundColor: colors.surface },
  msg: { alignSelf: "flex-start", marginTop: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16 },
  msgText: { color: "#fff", fontWeight: "800" },
});
