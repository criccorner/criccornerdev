import React, { useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from "react-native";
import { useAllState } from "../context/AppContext";
import Card from "../components/Card";
import { colors, spacing, typography, radius } from "../utils/theme";
import { availableTeams, windowOf } from "../utils/find";

// Teams with no unfinished match scheduled in the next 7 days.
export default function FindTeamsScreen({ navigation }) {
  const all = useAllState();
  const [q, setQ] = useState("");
  const list = useMemo(() => availableTeams(all), [all.teams, all.matches]);
  const w = windowOf();
  const needle = q.trim().toLowerCase();
  const shown = needle ? list.filter((t) => `${t.name} ${t.city || ""}`.toLowerCase().includes(needle)) : list;
  return (
    <View style={styles.container}>
      <Text style={typography.muted}>Teams with no match scheduled from {w.from} to {w.to} ({shown.length})</Text>
      <TextInput value={q} onChangeText={setQ} placeholder="Search by team or city" placeholderTextColor={colors.textMuted} style={styles.input} />
      <FlatList
        data={shown}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={<Text style={[typography.muted, { marginTop: spacing.md }]}>No available teams found.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate("Teams", { screen: "TeamDetail", params: { teamId: item.id } })}>
            <Card style={{ marginTop: spacing.sm }}>
              <Text style={typography.h3}>{item.name}</Text>
              <Text style={typography.muted}>{item.city || "City not set"} · {(item.playerIds || []).length} players</Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, color: colors.text, backgroundColor: colors.surface },
});
