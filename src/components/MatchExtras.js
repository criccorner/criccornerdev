import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Linking, Alert, StyleSheet } from "react-native";
import Card from "./Card";
import { colors, spacing, typography, radius } from "../utils/theme";
import { matchAwards } from "../stats/awards";
import { squadIds } from "../utils/squads";
import { STATUSES, statusInfo, availabilityOf, summarise } from "../utils/availability";
import { checkHighlightUrl, HIGHLIGHT_KINDS, MAX_HIGHLIGHTS_PER_TEAM, platformOf } from "../utils/social";

// Player / Batter / Bowler / Fielder of the match, shown under the result.
export function AwardsCard({ match, teams, players, onPlayer }) {
  const a = matchAwards(match, teams);
  if (!a) return null;
  const nameOf = (id) => (players.find((p) => p.id === id) || {}).name || "Unknown";
  const rows = [
    ["🏆", "Player of the match", a.player, a.player ? `${a.player.points} pts` : ""],
    ["🏏", "Batter of the match", a.batter, ""],
    ["🎯", "Bowler of the match", a.bowler, ""],
    ["🧤", "Fielder of the match", a.fielder, ""],
  ].filter((r) => r[2]);
  if (!rows.length) return null;
  return (
    <Card>
      <Text style={typography.label}>MATCH AWARDS</Text>
      {rows.map(([icon, title, w, extra]) => (
        <View key={title} style={styles.awardRow}>
          <Text style={styles.awardIcon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.awardTitle}>{title}</Text>
            <Text style={[styles.awardName, onPlayer && { color: colors.primary }]} onPress={onPlayer ? () => onPlayer(w.playerId) : undefined}>{nameOf(w.playerId)}{onPlayer ? " ›" : ""}</Text>
            {w.text ? <Text style={styles.awardSub}>{w.text}</Text> : null}
          </View>
          {extra ? <Text style={styles.awardPts}>{extra}</Text> : null}
        </View>
      ))}
    </Card>
  );
}

// "Are you playing?" for a scheduled match. A player answers for himself; the people who
// manage a player (the captain who added him) can answer for him. Everyone sees the totals.
export function AvailabilityCard({ match, teams, players, isMine, canSet, onSet }) {
  const sides = [["A", match.teamAId], ["B", match.teamBId]].map(([side, tid]) => ({
    side, team: teams.find((t) => t.id === tid), ids: squadIds(match, teams, tid),
  }));
  const all = [...new Set(sides.flatMap((x) => x.ids))].map((id) => players.find((p) => p.id === id)).filter(Boolean);
  const mine = all.filter((p) => isMine(p));
  const others = all.filter((p) => !isMine(p) && canSet(p));
  if (!all.length) return null;
  const Buttons = ({ p, small }) => (
    <View style={styles.chips}>
      {STATUSES.map((st) => {
        const on = availabilityOf(p, match.id) === st.key;
        return (
          <Pressable key={st.key} onPress={() => onSet(p, on ? null : st.key)} style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.chipText, on && { color: "#fff" }]}>{small ? st.icon : `${st.icon} ${st.label}`}</Text>
          </Pressable>
        );
      })}
    </View>
  );
  return (
    <Card>
      <Text style={typography.label}>WHO IS PLAYING?</Text>
      {mine.map((p) => (
        <View key={p.id} style={{ marginTop: spacing.xs }}>
          <Text style={styles.awardName}>{mine.length > 1 ? `${p.name}: ` : ""}Are you available for this match?</Text>
          <Buttons p={p} />
        </View>
      ))}
      {sides.map(({ side, team, ids }) => {
        const sum = summarise(ids, players, match.id);
        const line = (key, label) => sum[key].length ? <Text style={styles.awardSub}>{label}: {sum[key].map((p) => p.name).join(", ")}</Text> : null;
        return (
          <View key={side} style={{ marginTop: spacing.sm }}>
            <Text style={styles.awardTitle}>{team ? team.name : `Team ${side}`} · ✅ {sum.yes.length} · ❌ {sum.no.length} · ❓ {sum.maybe.length} · no reply {sum.none.length}</Text>
            {line("yes", "✅ Available")}
            {line("no", "❌ Not available")}
            {line("maybe", "❓ Maybe")}
            {line("none", "No reply")}
          </View>
        );
      })}
      {others.length ? (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={styles.awardTitle}>Answer for a player you manage</Text>
          {others.map((p) => (
            <View key={p.id} style={styles.hlRow}>
              <Text style={[styles.awardName, { flex: 1 }]}>{p.name}</Text>
              <Buttons p={p} small />
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

// Instagram / Facebook links each captain can add for his own side.
export function HighlightsCard({ match, teams, sides, onChange }) {
  const [side, setSide] = useState(sides[0] || null);
  const [kind, setKind] = useState("moment");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const list = Array.isArray(match.highlights) ? match.highlights : [];
  const teamName = (s) => (teams.find((t) => t.id === (s === "A" ? match.teamAId : match.teamBId)) || {}).name || `Team ${s}`;
  const canAdd = sides.length > 0;
  if (!list.length && !canAdd) return null;

  const open = (u) => Linking.openURL(u).catch(() => Alert.alert("Couldn't open the link"));
  const add = () => {
    const chk = checkHighlightUrl(url);
    if (chk.error) return setErr(chk.error);
    const s = side || sides[0];
    if (list.filter((h) => h.side === s).length >= MAX_HIGHLIGHTS_PER_TEAM) return setErr(`You can add up to ${MAX_HIGHLIGHTS_PER_TEAM} links per team.`);
    if (list.some((h) => h.url === chk.url)) return setErr("That link is already added.");
    onChange([...list, { id: `h_${Date.now()}`, url: chk.url, platform: chk.platform, kind, side: s }]);
    setUrl("");
    setErr("");
  };
  const remove = (h) => onChange(list.filter((x) => x.id !== h.id));

  return (
    <Card>
      <Text style={typography.label}>HIGHLIGHTS</Text>
      {list.length === 0 ? <Text style={typography.muted}>No highlights added yet.</Text> : null}
      {list.map((h) => {
        const k = HIGHLIGHT_KINDS.find((x) => x.key === h.kind) || HIGHLIGHT_KINDS[4];
        const plat = platformOf(h.url) === "facebook" ? "Facebook" : "Instagram";
        return (
          <View key={h.id} style={styles.hlRow}>
            <Pressable style={{ flex: 1 }} onPress={() => open(h.url)}>
              <Text style={styles.awardName}>{k.label} · {plat}</Text>
              <Text style={styles.awardSub}>{teamName(h.side)} · tap to open</Text>
            </Pressable>
            {sides.includes(h.side) ? (
              <Pressable onPress={() => remove(h)} hitSlop={8}><Text style={styles.remove}>Remove</Text></Pressable>
            ) : null}
          </View>
        );
      })}
      {canAdd ? (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={styles.awardTitle}>Add an Instagram or Facebook link</Text>
          {sides.length > 1 ? (
            <View style={styles.chips}>
              {sides.map((s) => (
                <Pressable key={s} onPress={() => setSide(s)} style={[styles.chip, (side || sides[0]) === s && styles.chipOn]}>
                  <Text style={[styles.chipText, (side || sides[0]) === s && { color: "#fff" }]}>{teamName(s)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={styles.chips}>
            {HIGHLIGHT_KINDS.map((k) => (
              <Pressable key={k.key} onPress={() => setKind(k.key)} style={[styles.chip, kind === k.key && styles.chipOn]}>
                <Text style={[styles.chipText, kind === k.key && { color: "#fff" }]}>{k.label}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={url}
            onChangeText={(t) => { setUrl(t); setErr(""); }}
            placeholder="https://www.instagram.com/reel/…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <Pressable onPress={add} style={styles.addBtn}><Text style={styles.addText}>Add link</Text></Pressable>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  awardRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  awardIcon: { fontSize: 26, width: 40 },
  awardTitle: { fontSize: 11, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase" },
  awardName: { fontSize: 15, fontWeight: "700", color: colors.text },
  awardSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  awardPts: { fontWeight: "800", color: colors.primary },
  hlRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  remove: { color: "#C62828", fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm + 2 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  input: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, color: colors.text, backgroundColor: colors.background },
  err: { color: "#C62828", marginTop: spacing.xs, fontSize: 12 },
  addBtn: { marginTop: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.sm, alignItems: "center" },
  addText: { color: "#fff", fontWeight: "800" },
});
