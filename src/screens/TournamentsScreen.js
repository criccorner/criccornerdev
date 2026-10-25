import React from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useAccess } from "../context/AppContext";
import { colors, spacing, typography } from "../utils/theme";
import Button from "../components/Button";
import Card from "../components/Card";

export default function TournamentsScreen({ navigation }) {
  const tournaments = useAccess().mine.tournaments;

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Button title="+ Create Tournament" onPress={() => navigation.navigate("CreateTournament")} />
      </View>
      <FlatList
        data={tournaments}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>
            No tournaments yet.
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
