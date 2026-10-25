import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Card from "./Card";
import Avatar from "./Avatar";
import { colors, spacing, typography, radius } from "../utils/theme";
import { HALL_CATEGORIES, POINTS_TEXT, MIN_MATCHES_CONSISTENT } from "../stats/awards";

export const TeamLogo = ({ team, size = 48 }) => <Avatar uri={team && team.logoUrl} name={team && team.name} size={size} />;

const pct = (n) => `${Math.round(n)}%`;

// Matches, won, lost, tied, no result and win percentage.
export function RecordRow({ record, compact }) {
  const cells = [
    ["Matches", record.matches],
    ["Won", record.won],
    ["Lost", record.lost],
    ["Tied", record.tied],
    ["NR", record.noResult],
    ["Win %", pct(record.winPct)],
  ];
  return (
    <View style={[styles.rec, compact && { marginTop: spacing.xs }]}>
      {cells.map(([k, v]) => (
        <View key={k} style={styles.cell}>
          <Text style={[styles.val, compact && { fontSize: 14 }]}>{String(v)}</Text>
          <Text style={styles.key}>{k}</Text>
        </View>
      ))}
    </View>
  );
}

export function HallOfFameCard({ hall, nameOf, onPlayerPress }) {
  return (
    <Card>
      <Text style={typography.h3}>🏆 Cricket Hall of Fame</Text>
      {hall.played === 0 ? (
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>Complete a match to start filling the Hall of Fame.</Text>
      ) : (
        <Text style={[typography.muted, { marginTop: 2 }]}>From {hall.played} completed match{hall.played === 1 ? "" : "es"}</Text>
      )}
      {HALL_CATEGORIES.map((c) => {
        const list = hall[c.key] || [];
        return (
          <View key={c.key} style={styles.cat}>
            <Text style={styles.catTitle}>{c.icon} {c.title}</Text>
            <Text style={styles.catBlurb}>{c.blurb}</Text>
            {list.length === 0 ? (
              <Text style={styles.empty}>{c.key === "consistent" ? `Needs ${MIN_MATCHES_CONSISTENT}+ matches` : "Not earned yet"}</Text>
            ) : (
              list.map((e, i) => (
                <Pressable key={e.playerId} style={styles.entry} onPress={onPlayerPress ? () => onPlayerPress(e.playerId) : undefined} disabled={!onPlayerPress}>
                  <Text style={styles.rank}>{["🥇", "🥈", "🥉"][i] || i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, i === 0 && { fontSize: 16 }]}>{nameOf(e.playerId)}</Text>
                    {e.detail ? <Text style={styles.detail}>{e.detail}</Text> : null}
                  </View>
                  <Text style={styles.value}>{e.value}</Text>
                  {onPlayerPress ? <Text style={styles.chev}>›</Text> : null}
                </Pressable>
              ))
            )}
          </View>
        );
      })}
      <Text style={styles.foot}>MVP points: {POINTS_TEXT}. Best All-Rounder: runs + 25 per wicket, for players who both batted and took wickets. Most Consistent: share of matches with 15+ runs, a wicket or a catch/stumping/run-out.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  rec: { flexDirection: "row", marginTop: spacing.sm },
  cell: { flex: 1, alignItems: "center" },
  val: { fontSize: 18, fontWeight: "800", color: colors.text },
  key: { fontSize: 10, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" },
  cat: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  catTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  catBlurb: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
  empty: { fontSize: 12, color: colors.textMuted, fontStyle: "italic" },
  entry: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  rank: { width: 30, fontSize: 18 },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  detail: { fontSize: 11, color: colors.textMuted },
  chev: { marginLeft: 6, fontSize: 18, color: colors.textMuted },
  value: { fontWeight: "800", color: colors.primary },
  foot: { marginTop: spacing.md, fontSize: 11, color: colors.textMuted, lineHeight: 16 },
});
