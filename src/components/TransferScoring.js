import React, { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useAppDispatch, useAllState, useAccess } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Button from "./Button";

// Hand the scoring of a match to one of the registered players in its squads.
// Afterwards only that player can score - not even the person handing it over.
export default function TransferScoring({ match, onTransferred, compact }) {
  const dispatch = useAppDispatch();
  const { players } = useAllState();
  const access = useAccess();
  const [open, setOpen] = useState(false);
  if (!match || match.status === "completed" || !access.mayScore(match)) return null;
  const targets = access.transferTargets(match);
  const current = match.scorerId ? (players.find((p) => p.id === match.scorerId) || {}).name : null;

  const choose = (p) =>
    Alert.alert("Transfer scoring?", `${p.name} will be the only person who can score this match. You will not be able to score it any more.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Transfer",
        style: "destructive",
        onPress: () => {
          dispatch({ type: "TRANSFER_SCORING", payload: { matchId: match.id, toPlayerId: p.id } });
          setOpen(false);
          Alert.alert("Scoring transferred", `${p.name} is now the scorer of this match.`);
          if (onTransferred) onTransferred();
        },
      },
    ]);

  return (
    <View>
      {compact ? (
        <Pressable onPress={() => setOpen(true)} hitSlop={6} style={styles.quick}>
          <Text style={styles.quickText}>🔁 Transfer</Text>
        </Pressable>
      ) : (
        <Button title="🔁 Transfer scoring" variant="secondary" onPress={() => setOpen(true)} style={{ marginTop: spacing.sm }} />
      )}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={typography.h3}>Transfer scoring to…</Text>
            <Text style={[typography.muted, { marginVertical: spacing.sm }]}>
              Only one person can score a match. Pick a player from the two squads who registered with a mobile number or email.{current ? ` (Scorer now: ${current}.)` : ""}
            </Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {targets.length === 0 ? (
                <Text style={typography.muted}>No registered players in the squads yet. Players need a mobile number or email on their profile.</Text>
              ) : (
                targets.map((p) => (
                  <Pressable key={p.id} onPress={() => choose(p)} style={styles.row}>
                    <Text style={styles.name}>{p.name}</Text>
                    <Text style={typography.muted}>{(match.squadA || []).includes(p.id) ? "Team A" : "Team B"}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
            <Button title="Close" variant="secondary" onPress={() => setOpen(false)} style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#0008", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  name: { color: colors.text, fontWeight: "700", fontSize: 16 },
  quick: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  quickText: { color: colors.text, fontWeight: "700" },
});
