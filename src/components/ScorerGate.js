import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppState, useAllState, useAccess } from "../context/AppContext";
import { colors, spacing, typography } from "../utils/theme";
import Button from "./Button";

// Only the scorer of a match may use the scoring / setup screens; everyone else sees who the scorer is.
export function withScorerGate(Screen) {
  return function ScorerGated(props) {
    const { matches } = useAppState();
    const { players } = useAllState();
    const access = useAccess();
    const matchId = props.route && props.route.params && props.route.params.matchId;
    const match = matches.find((m) => m.id === matchId);
    if (!match || match.status === "completed" || access.mayScore(match)) return <Screen {...props} />;
    const scorer = match.scorerId ? (players.find((p) => p.id === match.scorerId) || {}).name : null;
    return (
      <View style={styles.box}>
        <Text style={typography.h2}>🔒 Scoring is with {scorer || "the person who created this match"}</Text>
        <Text style={[typography.muted, { marginVertical: spacing.md, textAlign: "center" }]}>
          Only one person can score a match at a time. {scorer ? `${scorer} is the scorer now.` : "The scorer can hand scoring over to a registered player in the squads."}
        </Text>
        <Button title="View scorecard" onPress={() => props.navigation.replace("Scorecard", { matchId })} />
      </View>
    );
  };
}

// Captain corrections are open for 7 days after the match FIRST finished.
export function withCorrectionWindow(Screen) {
  return function WindowGated(props) {
    const { matches } = useAppState();
    const access = useAccess();
    const matchId = props.route && props.route.params && props.route.params.matchId;
    const match = matches.find((m) => m.id === matchId);
    if (!match || match.status !== "completed") return <Screen {...props} />;
    const w = access.correctionWindow(match);
    if (w.open) return <Screen {...props} />;
    return (
      <View style={styles.box}>
        <Text style={typography.h2}>⏳ Corrections are closed</Text>
        <Text style={[typography.muted, { marginVertical: spacing.md, textAlign: "center" }]}>
          Corrections and undo are allowed for 7 days after a match is first finished. That ended on {new Date(w.until).toDateString()}.
        </Text>
        <Button title="Back" onPress={() => props.navigation.goBack()} />
      </View>
    );
  };
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: colors.background },
});
