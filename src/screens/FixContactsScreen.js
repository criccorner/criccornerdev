import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, Alert, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { useAuth } from "../auth/AuthContext";
import { planContactCleanup, applyContactCleanup } from "../players/playerOps";
import { contactOf } from "../auth/identity";
import { saveBackup, loadBackup } from "../storage/storage";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { colors, spacing, typography, radius } from "../utils/theme";

const usageText = (u) => (u.used ? `${u.teams.length} team${u.teams.length === 1 ? "" : "s"}, ${u.matches} match${u.matches === 1 ? "" : "es"}` : "not in any team or match");

export default function FixContactsScreen() {
  const { players, teams, matches, tournaments } = useAppState();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const acct = contactOf(user);
  const [keepId, setKeepId] = useState(null);
  const [choices, setChoices] = useState({});
  const [backup, setBackup] = useState(null);
  const [done, setDone] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadBackup().then(setBackup);
    }, [])
  );

  const plan = useMemo(
    () => planContactCleanup({ players, teams, matches, user: acct, keepId, choices }),
    [players, teams, matches, acct.identifier, acct.name, keepId, choices]
  );
  const nothingToFix = plan.holders.length <= 1;

  const apply = () => {
    Alert.alert("Apply this fix?", "A backup is saved first, so you can restore your previous data from this screen.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Apply",
        style: "destructive",
        onPress: async () => {
          await saveBackup({ players, teams, matches, tournaments });
          const { next, summary } = applyContactCleanup({ players, teams, matches }, plan, acct);
          dispatch({ type: "HYDRATE", payload: next });
          setDone(summary);
          setKeepId(null);
          setChoices({});
          setBackup(await loadBackup());
        },
      },
    ]);
  };

  const restore = () => {
    if (!backup) return;
    Alert.alert("Restore previous data?", `This puts players, teams, matches and tournaments back to how they were on ${new Date(backup.at).toLocaleString()}. Anything changed since then is lost.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        style: "destructive",
        onPress: () => {
          const s = backup.state;
          dispatch({ type: "HYDRATE", payload: { players: s.players, teams: s.teams, matches: s.matches, tournaments: s.tournaments } });
          setDone(null);
        },
      },
    ]);
  };

  // This tool edits and deletes OTHER people's player entries, which the cloud only allows administrators to do.
  if (!user.isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.md }}>
        <Card>
          <Text style={typography.h3}>Administrator only</Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>
            Players' details are shared by everyone, so only an administrator can tidy duplicates. To change your own details use Profile → Edit Profile.
          </Text>
        </Card>
      </View>
    );
  }
  if (!user.phone) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.md }}>
        <Card>
          <Text style={typography.h3}>Add your mobile number first</Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>
            Go to Profile → Edit Profile and enter your mobile number (for example +61434916595). This tool uses it to find duplicate entries.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={typography.h2}>Players sharing your number</Text>
      <Text style={[typography.muted, { marginTop: spacing.xs }]}>
        Your mobile number is {acct.identifier}. Your Stats and Analytics use the player that has this number. Choose who is you, and tidy the rest.
      </Text>

      {done ? (
        <Card style={styles.done}>
          <Text style={typography.h3}>✅ Done</Text>
          <Text style={[typography.body, { marginTop: spacing.xs }]}>{done.kept} now has your number.</Text>
          {done.deleted.length ? <Text style={typography.body}>Deleted: {done.deleted.length} duplicate{done.deleted.length === 1 ? "" : "s"}.</Text> : null}
          {done.merged.length ? <Text style={typography.body}>Merged into you: {done.merged.length} (their teams and matches moved to you).</Text> : null}
          {done.dummied.map((d, i) => (
            <Text key={i} style={typography.body}>{d.name}: number removed{d.email ? `, email ${d.email}` : ""}</Text>
          ))}
        </Card>
      ) : null}

      {plan.holders.length === 0 ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={typography.h3}>No player has your number yet</Text>
          <Text style={[typography.muted, { marginTop: spacing.xs }]}>Open Players, tap your name and tap "This is me" to link it.</Text>
        </Card>
      ) : nothingToFix ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={typography.h3}>✅ Nothing to fix</Text>
          <Text style={[typography.muted, { marginTop: spacing.xs }]}>Only one player ({plan.holders[0].name}) has your number, so your stats are linked correctly.</Text>
        </Card>
      ) : (
        <>
          {plan.holders.map((r) => {
            const isKeep = r.id === plan.keepId;
            return (
              <Card key={r.id} style={[{ marginTop: spacing.md }, isKeep && styles.keepCard]}>
                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                  <Text style={[typography.h3, { marginRight: spacing.sm }]}>{r.name}</Text>
                  {isKeep ? <Badge label="KEEP: THIS IS ME" color={colors.primary} /> : null}
                </View>
                <Text style={typography.muted}>{r.phone || r.email} · {usageText(r.usage)}</Text>

                {isKeep ? (
                  <Text style={[typography.body, { marginTop: spacing.sm }]}>Keeps {acct.identifier}.</Text>
                ) : (
                  <>
                    <View style={styles.chips}>
                      <Pressable onPress={() => setChoices({ ...choices, [r.id]: "remove" })} style={[styles.chip, r.action === "remove" && styles.chipActive]}>
                        <Text style={[styles.chipText, r.action === "remove" && { color: "#fff" }]}>Remove duplicate</Text>
                      </Pressable>
                      <Pressable onPress={() => setChoices({ ...choices, [r.id]: "dummy" })} style={[styles.chip, r.action === "dummy" && styles.chipActive]}>
                        <Text style={[styles.chipText, r.action === "dummy" && { color: "#fff" }]}>Dummy email instead</Text>
                      </Pressable>
                      <Pressable onPress={() => setKeepId(r.id)} style={styles.chip}>
                        <Text style={styles.chipText}>This is me</Text>
                      </Pressable>
                    </View>
                    <Text style={[styles.outcome, r.effective === "dummy" && r.conflict && { color: colors.danger }]}>
                      {r.effective === "delete" && "→ Will be deleted (not used anywhere)."}
                      {r.effective === "merge" && "→ Will be merged into you: their teams and match history move to you, then the entry is deleted."}
                      {r.effective === "dummy" && r.conflict && `→ Can't be merged safely (they played in the same match as you), so they keep their entry with the number removed${r.dummyEmail ? ` and email ${r.dummyEmail}` : ""}.`}
                      {r.effective === "dummy" && !r.conflict && `→ Number removed${r.dummyEmail ? `, dummy email ${r.dummyEmail}` : ", keeps their own email"}.`}
                    </Text>
                  </>
                )}
              </Card>
            );
          })}
          <Button title="Apply Fix" onPress={apply} style={{ marginTop: spacing.lg }} />
        </>
      )}

      {backup ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={typography.h3}>Backup</Text>
          <Text style={[typography.muted, { marginVertical: spacing.xs }]}>Saved before the last fix: {new Date(backup.at).toLocaleString()}</Text>
          <Button title="Restore previous data" variant="outline" onPress={restore} />
        </Card>
      ) : null}
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  keepCard: { borderColor: colors.primary, borderWidth: 2 },
  done: { marginTop: spacing.md, backgroundColor: "#EEF7F2", borderColor: colors.success },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600", fontSize: 12 },
  outcome: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted },
});
