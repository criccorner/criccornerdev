import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useAppState } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import Button from "../components/Button";
import Card from "../components/Card";

export default function PlayersScreen({ navigation }) {
  const { players } = useAppState();

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Button title="+ Add / Join Player" onPress={() => navigation.navigate("AddPlayer")} />
      </View>
      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>
            No players yet. Add your first player to get started.
          </Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{item.name}</Text>
              <Text style={typography.muted}>{item.phone || item.email || "No contact on file"}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { padding: spacing.md, paddingBottom: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: spacing.sm },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
});
