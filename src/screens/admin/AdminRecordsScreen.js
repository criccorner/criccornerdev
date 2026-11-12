import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from "react-native";
import AdminGuard from "./AdminGuard";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useAllState } from "../../context/AppContext";
import { TYPES, searchRecords, openRecord } from "../../admin/records";
import { colors, spacing, typography, radius } from "../../utils/theme";

const ICON = { Player: "🧑", Team: "👥", Tournament: "🏆" };
const MAX = 200;

// Admin: find any player, team or tournament in the system, then open it to edit or delete it.
export default function AdminRecordsScreen({ navigation }) {
  const state = useAllState();
  const [text, setText] = useState("");
  const [type, setType] = useState("All");
  const [results, setResults] = useState(null);

  const search = () => setResults(searchRecords(state, text, type));

  return (
    <AdminGuard>
      <View style={styles.container}>
        <Card>
          <Text style={typography.label}>SEARCH TEXT</Text>
          <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Name, mobile, email or city" placeholderTextColor={colors.textMuted} autoCapitalize="none" onSubmitEditing={search} returnKeyType="search" />
          <Text style={[typography.label, { marginTop: spacing.md }]}>TYPE</Text>
          <View style={styles.chips}>
            {TYPES.map((t) => (
              <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, type === t && styles.chipOn]}>
                <Text style={[styles.chipText, type === t && { color: "#fff" }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="🔍 Search" onPress={search} />
        </Card>
        {results ? (
          <>
            <Text style={[typography.muted, { marginVertical: spacing.sm }]}>
              {results.length} record{results.length === 1 ? "" : "s"} found{results.length > MAX ? ` (showing the first ${MAX})` : ""}
            </Text>
            <FlatList
              data={results.slice(0, MAX)}
              keyExtractor={(r) => r.type + r.id}
              contentContainerStyle={{ paddingBottom: spacing.xl }}
              ListEmptyComponent={<Text style={[typography.muted, { textAlign: "center", marginTop: spacing.lg }]}>Nothing matches.</Text>}
              renderItem={({ item }) => (
                <Pressable onPress={() => openRecord(navigation, item)}>
                  <Card>
                    <View style={styles.row}>
                      <Text style={{ fontSize: 22, marginRight: spacing.sm }}>{ICON[item.type]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={typography.h3}>{item.title}</Text>
                        <Text style={typography.muted}>{item.type}{item.sub ? ` · ${item.sub}` : ""}</Text>
                      </View>
                      <Text style={{ color: colors.textMuted }}>›</Text>
                    </View>
                  </Card>
                </Pressable>
              )}
            />
          </>
        ) : null}
      </View>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, backgroundColor: colors.surface, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginVertical: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center" },
});
