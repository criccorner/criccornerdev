import React, { useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet } from "react-native";
import { useAllState } from "../context/AppContext";
import Card from "../components/Card";
import { colors, spacing, typography, radius } from "../utils/theme";
import { availableGrounds, windowOf, GROUND_NOTE } from "../utils/find";

// Grounds with no unfinished match scheduled in the next 7 days, with the council / booking note underneath.
export default function FindGroundsScreen() {
  const all = useAllState();
  const [q, setQ] = useState("");
  const list = useMemo(() => availableGrounds(all), [all.matches]);
  const w = windowOf();
  const needle = q.trim().toLowerCase();
  const shown = needle ? list.filter((g) => `${g.name} ${g.city}`.toLowerCase().includes(needle)) : list;
  return (
    <View style={styles.container}>
      <Text style={typography.muted}>Grounds with no match scheduled from {w.from} to {w.to} ({shown.length})</Text>
      <TextInput value={q} onChangeText={setQ} placeholder="Search by ground or city" placeholderTextColor={colors.textMuted} style={styles.input} />
      <FlatList
        data={shown}
        keyExtractor={(g) => g.name}
        ListEmptyComponent={<Text style={[typography.muted, { marginTop: spacing.md }]}>No available grounds found.</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginTop: spacing.sm }}>
            <Text style={typography.h3}>{item.name}</Text>
            {item.city ? <Text style={typography.muted}>{item.city}</Text> : null}
          </Card>
        )}
        ListFooterComponent={<Text style={styles.note}>{GROUND_NOTE}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, color: colors.text, backgroundColor: colors.surface },
  note: { marginTop: spacing.lg, marginBottom: spacing.xl, fontSize: 12, fontStyle: "italic", color: colors.textMuted, lineHeight: 18 },
});
