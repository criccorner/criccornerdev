import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import AdminGuard from "./AdminGuard";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { searchActivity, dayText } from "../../admin/activity";
import { colors, spacing, typography, radius } from "../../utils/theme";

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dayText(d); };
const fmt = (ms) => {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function AdminActivityScreen() {
  const [from, setFrom] = useState(daysAgo(0));
  const [to, setTo] = useState(daysAgo(0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const quick = (n) => { setFrom(daysAgo(n)); setTo(daysAgo(0)); };

  const search = async () => {
    setError("");
    setBusy(true);
    const r = await searchActivity(from, to);
    setBusy(false);
    if (!r.ok) { setError(r.error); setResult(null); return; }
    setResult(r);
  };

  return (
    <AdminGuard>
      <View style={styles.container}>
        <Card>
          <View style={styles.dates}>
            <View style={{ flex: 1 }}>
              <Text style={typography.label}>FROM DATE</Text>
              <TextInput style={styles.input} value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.label}>TO DATE</Text>
              <TextInput style={styles.input} value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            </View>
          </View>
          <View style={styles.chips}>
            {[["Today", 0], ["Last 7 days", 6], ["Last 30 days", 29]].map(([label, n]) => (
              <Pressable key={label} onPress={() => quick(n)} style={styles.chip}>
                <Text style={styles.chipText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title={busy ? "Searching…" : "🔍 Search"} onPress={search} disabled={busy} />
        </Card>

        {busy ? <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.primary} /> : null}

        {result && !busy ? (
          <>
            <View style={styles.totals}>
              <Text style={styles.totalText}>Total users: {result.totalUsers}</Text>
              <Text style={typography.muted}>{result.loggedInUsers} logged in · {result.items.length} activities</Text>
            </View>
            <FlatList
              data={result.items}
              keyExtractor={(i) => String(i.id)}
              contentContainerStyle={{ paddingBottom: spacing.xl }}
              ListEmptyComponent={<Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>No activity in this period.</Text>}
              renderItem={({ item }) => (
                <Card>
                  <View style={styles.row}>
                    <Text style={[typography.h3, { flex: 1 }]}>{item.name}</Text>
                    <Text style={typography.muted}>{fmt(item.at)}</Text>
                  </View>
                  <Text style={typography.muted}>{[item.phone, item.email].filter(Boolean).join(" · ") || "No contact details"}</Text>
                  <Text style={[typography.body, { marginTop: 4 }]}>{item.detail}</Text>
                </Card>
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
  dates: { flexDirection: "row", gap: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, backgroundColor: colors.surface, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginVertical: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surface },
  chipText: { color: colors.text, fontWeight: "600" },
  error: { color: colors.danger, marginBottom: spacing.sm },
  totals: { paddingVertical: spacing.md },
  totalText: { fontSize: 20, fontWeight: "800", color: colors.primary },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
});
