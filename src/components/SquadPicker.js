import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, typography, radius } from "../utils/theme";
import { availabilityOf, statusInfo } from "../utils/availability";

// Pick the squad for one team, then its captain and wicketkeeper.
// value = { ids, captainId, keeperId }.  `blockedIds` are players already in
// the OTHER team's squad - greyed out and impossible to pick here.
export default function SquadPicker({ title, team, players, value, onChange, blockedIds = [], matchId }) {
  if (!team) return null;
  const roster = players.filter((p) => (team.playerIds || []).includes(p.id));
  const blocked = new Set(blockedIds);
  const free = roster.filter((p) => !blocked.has(p.id));
  const chosen = roster.filter((p) => value.ids.includes(p.id));

  // Keep captain / keeper valid whenever the squad changes.
  const setIds = (ids) =>
    onChange({
      ids,
      captainId: ids.includes(value.captainId) ? value.captainId : null,
      keeperId: ids.includes(value.keeperId) ? value.keeperId : null,
    });
  const toggle = (id) => setIds(value.ids.includes(id) ? value.ids.filter((x) => x !== id) : [...value.ids, id]);

  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <Text style={[typography.h3, { flex: 1 }]} numberOfLines={1}>{title}: {team.name}</Text>
        <Text style={typography.muted}>{value.ids.length} selected</Text>
      </View>
      {roster.length === 0 ? (
        <Text style={typography.muted}>This team has no players yet. Add players to the team first.</Text>
      ) : (
        <>
          <View style={styles.actions}>
            <Pressable onPress={() => setIds(free.map((p) => p.id))}><Text style={styles.link}>Select all</Text></Pressable>
            {matchId ? (
              <Pressable onPress={() => setIds(free.filter((p) => availabilityOf(p, matchId) !== "no").map((p) => p.id))}><Text style={styles.link}>Select all except "Not available"</Text></Pressable>
            ) : null}
            <Pressable onPress={() => setIds([])}><Text style={styles.link}>Clear</Text></Pressable>
          </View>
          <View style={styles.row}>
            {roster.map((p) => {
              const isBlocked = blocked.has(p.id);
              const on = value.ids.includes(p.id);
              return (
                <Pressable key={p.id} disabled={isBlocked} onPress={() => toggle(p.id)} style={[styles.chip, on && styles.chipActive, isBlocked && styles.chipDisabled]}>
                  <Text style={[styles.chipText, on && { color: "#fff" }]}>
                    {on ? "✓ " : ""}{matchId && availabilityOf(p, matchId) ? `${statusInfo(availabilityOf(p, matchId)).icon} ` : ""}{p.name}{isBlocked ? " (other team)" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[typography.label, { marginTop: spacing.md }]}>CAPTAIN</Text>
          <RolePick list={chosen} selected={value.captainId} onPick={(id) => onChange({ ...value, captainId: id })} mark="©" />
          <Text style={[typography.label, { marginTop: spacing.sm }]}>WICKETKEEPER</Text>
          <RolePick list={chosen} selected={value.keeperId} onPick={(id) => onChange({ ...value, keeperId: id })} mark="🧤" />
        </>
      )}
    </View>
  );
}

function RolePick({ list, selected, onPick, mark }) {
  if (!list.length) return <Text style={typography.muted}>Select players first.</Text>;
  return (
    <View style={styles.row}>
      {list.map((p) => (
        <Pressable key={p.id} onPress={() => onPick(p.id)} style={[styles.chip, selected === p.id && styles.roleActive]}>
          <Text style={[styles.chipText, selected === p.id && { color: "#fff" }]}>{selected === p.id ? mark + " " : ""}{p.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.xs },
  link: { color: colors.primary, fontWeight: "700" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipDisabled: { opacity: 0.35 },
  chipText: { color: colors.text, fontWeight: "600" },
});
