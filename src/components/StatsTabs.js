import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Card from "./Card";
import { colors, spacing, typography, radius } from "../utils/theme";
import { computeLeaderboards, rankRows, BAT_SORTS, BOWL_SORTS, FIELD_SORTS } from "../stats/leaderboards";

const TABS = [{ key: "bat", label: "Batting" }, { key: "bowl", label: "Bowling" }, { key: "field", label: "Fielding" }];
const SORTS = { bat: BAT_SORTS, bowl: BOWL_SORTS, field: FIELD_SORTS };
const COLS = {
  bat: [["Matches", (r) => r.matches], ["Runs", (r) => r.bat.runs], ["Avg", (r) => r.bat.average.toFixed(1)], ["NO", (r) => r.bat.notOut], ["SR", (r) => r.bat.strikeRate.toFixed(1)], ["100s", (r) => r.bat.hundreds], ["50s", (r) => r.bat.fifties], ["30s", (r) => r.bat.thirties], ["6s", (r) => r.bat.sixes], ["4s", (r) => r.bat.fours]],
  bowl: [["Matches", (r) => r.matches], ["Wkts", (r) => r.bowl.wickets], ["SR", (r) => (r.bowl.wickets ? r.bowl.strikeRate.toFixed(1) : "-")], ["Avg", (r) => (r.bowl.wickets ? r.bowl.average.toFixed(1) : "-")], ["3fer", (r) => r.bowl.three], ["5fer", (r) => r.bowl.five], ["Hat-tricks", (r) => r.bowl.hatTricks]],
  field: [["Matches", (r) => r.matches], ["Catches", (r) => r.field.catches], ["Runouts", (r) => r.field.runOuts]],
};

// Statistics for a team or tournament: Batting / Bowling / Fielding tabs, "Arrange by" chips and a table.
export default function StatsTabs({ matches, teamId, nameOf, onPlayerPress }) {
  const [tab, setTab] = useState("bat");
  const [sort, setSort] = useState({ bat: "runs", bowl: "wk", field: "ct" });
  const all = useMemo(() => computeLeaderboards(matches, teamId), [matches, teamId]);
  const rows = useMemo(() => rankRows(all, tab, sort[tab]), [all, tab, sort]);
  const cols = COLS[tab];
  return (
    <Card style={{ marginTop: spacing.md }}>
      <Text style={typography.label}>STATISTICS</Text>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabOn]} accessibilityRole="button">
            <Text style={[styles.tabText, tab === t.key && { color: "#fff" }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[typography.muted, { marginTop: spacing.sm }]}>Arrange by</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {SORTS[tab].map((s) => (
          <Pressable key={s.key} onPress={() => setSort({ ...sort, [tab]: s.key })} style={[styles.chip, sort[tab] === s.key && styles.chipOn]}>
            <Text style={[styles.chipText, sort[tab] === s.key && { color: "#fff" }]}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {rows.length === 0 ? (
        <Text style={[typography.muted, { marginTop: spacing.sm }]}>No statistics yet — they appear once matches are scored.</Text>
      ) : (
        <ScrollView horizontal>
          <View style={{ marginTop: spacing.sm }}>
            <View style={styles.row}>
              <Text style={[styles.name, styles.head]}>Player Name</Text>
              {cols.map(([h]) => <Text key={h} style={[styles.cell, styles.head]}>{h}</Text>)}
            </View>
            {rows.map((r) => (
              <Pressable key={r.id} style={styles.row} onPress={onPlayerPress ? () => onPlayerPress(r.id) : undefined}>
                <Text style={styles.name} numberOfLines={1}>{nameOf(r.id)}</Text>
                {cols.map(([h, f]) => <Text key={h} style={styles.cell}>{String(f(r))}</Text>)}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", marginTop: spacing.sm, gap: 6 },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.md || 8, borderWidth: 1, borderColor: colors.border },
  tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontWeight: "700", color: colors.text },
  chip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginRight: 6, marginTop: 6 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text },
  row: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { width: 120, fontWeight: "600", color: colors.text },
  cell: { width: 58, textAlign: "center", color: colors.text },
  head: { fontWeight: "800", fontSize: 11, color: colors.textMuted || colors.text },
});
