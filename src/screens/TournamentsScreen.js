import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useAccess } from "../context/AppContext";
import { colors, spacing, typography } from "../utils/theme";
import Button from "../components/Button";
import Card from "../components/Card";
import SegmentedTabs from "../components/SegmentedTabs";

export default function TournamentsScreen({ navigation }) {
  const { mine, other } = useAccess();
  const [view, setView] = useState("mine");
  const tournaments = view === "mine" ? mine.tournaments : other.tournaments;

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Button title="+ Create Tournament" onPress={() => navigation.navigate("CreateTournament")} />
      </View>
      <SegmentedTabs options={[["mine", `My tournaments (${mine.tournaments.length})`], ["other", `Other tournaments (${other.tournaments.length})`]]} value={view} onChange={setView} />
      <FlatList
        data={tournaments}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>
            {view === "mine" ? "No tournaments yet." : "No other tournaments yet."}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate("TournamentDetail", { tournamentId: item.id })}>
            <Card>
              <Text style={typography.h3}>{item.name}</Text>
              <Text style={typography.muted}>
                {item.matchIds.length} match{item.matchIds.length === 1 ? "" : "es"} · {item.sponsors.length} sponsor
                {item.sponsors.length === 1 ? "" : "s"}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { padding: spacing.md, paddingBottom: 0 },
});
