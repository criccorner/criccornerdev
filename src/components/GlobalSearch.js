import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useAllState } from "../context/AppContext";
import { colors, spacing, radius, typography } from "../utils/theme";

const LIMIT = 6;
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// Pure: what a search finds. Names only (no phone numbers or emails are searched or shown).
export function searchEverything(all, query, limit = LIMIT) {
  const q = norm(query);
  if (q.length < 2) return null;
  const has = (x) => norm(x).includes(q);
  const players = (all.players || []).filter((p) => p.name && !/^deleted player$/i.test(p.name) && has(p.name));
  const teams = (all.teams || []).filter((t) => has(t.name));
  const tournaments = (all.tournaments || []).filter((t) => has(t.name));
  const cut = (list) => ({ items: list.slice(0, limit), more: Math.max(0, list.length - limit) });
  return { players: cut(players), teams: cut(teams), tournaments: cut(tournaments), total: players.length + teams.length + tournaments.length };
}

// One box for players, teams and tournaments. Results open the normal pages, which are read-only for anything you don't manage.
export default function GlobalSearch({ navigation, onActive }) {
  const all = useAllState();
  const [query, setQuery] = useState("");
  const found = useMemo(() => searchEverything(all, query), [all.players, all.teams, all.tournaments, query]);
  const change = (t) => {
    setQuery(t);
    if (onActive) onActive(norm(t).length >= 2);
  };

  const go = (kind, id) => {
    if (kind === "player") navigation.navigate("Players", { screen: "PlayerStats", params: { playerId: id } });
    else if (kind === "team") navigation.navigate("Teams", { screen: "TeamDetail", params: { teamId: id } });
    else navigation.navigate("Tournaments", { screen: "TournamentDetail", params: { tournamentId: id } });
  };
  const Group = ({ title, kind, group, sub }) =>
    group.items.length ? (
      <View style={{ marginTop: spacing.sm }}>
        <Text style={typography.label}>{title}</Text>
        {group.items.map((x) => (
          <Pressable key={x.id} onPress={() => go(kind, x.id)} style={styles.row} accessibilityRole="button">
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{x.name}</Text>
              {sub(x) ? <Text style={typography.muted} numberOfLines={1}>{sub(x)}</Text> : null}
            </View>
            <Text style={{ color: colors.textMuted }}>›</Text>
          </Pressable>
        ))}
        {group.more ? <Text style={[typography.muted, { marginTop: 4 }]}>+ {group.more} more - type more letters to narrow it down</Text> : null}
      </View>
    ) : null;

  return (
    <View>
      <View style={styles.box}>
        <Text style={{ marginRight: spacing.sm }}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={change}
          placeholder="Search players, teams, tournaments"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => change("")} hitSlop={10} accessibilityLabel="Clear search">
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      {found ? (
        <View style={styles.results}>
          {found.total === 0 ? (
            <Text style={typography.muted}>Nothing found for “{query.trim()}”.</Text>
          ) : (
            <>
              <Group title="PLAYERS" kind="player" group={found.players} sub={(p) => (p.role && p.role !== "Player" ? p.role : "")} />
              <Group title="TEAMS" kind="team" group={found.teams} sub={(t) => `${(t.playerIds || []).length} players`} />
              <Group title="TOURNAMENTS" kind="tournament" group={found.tournaments} sub={(t) => t.city || ""} />
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 4 },
  input: { flex: 1, color: colors.text, paddingVertical: 8, fontSize: 15 },
  results: { backgroundColor: colors.surface, borderRadius: radius.lg || 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { color: colors.primary, fontWeight: "700", fontSize: 15 },
});
