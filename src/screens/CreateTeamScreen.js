import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { colors, spacing, typography, radius } from "../utils/theme";
import FormField from "../components/FormField";
import Button from "../components/Button";

export default function CreateTeamScreen({ navigation }) {
  const { players } = useAppState();
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState(null);

  const submit = () => {
    if (!name.trim()) {
      Alert.alert("Team name required");
      return;
    }
    dispatch({ type: "ADD_TEAM", payload: { name: name.trim(), ownerId } });
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FormField label="Team Name" value={name} onChangeText={setName} placeholder="e.g. Mumbai Strikers" />

      <Text style={typography.label}>TEAM OWNER (OPTIONAL)</Text>
      <View style={{ height: spacing.xs }} />
      {players.length === 0 ? (
        <Text style={typography.muted}>Add a player first to assign an owner.</Text>
      ) : (
        <View style={styles.ownerList}>
          {players.map((p) => (
            <Pressable key={p.id} onPress={() => setOwnerId(ownerId === p.id ? null : p.id)} style={[styles.ownerChip, ownerId === p.id && styles.ownerChipActive]}>
              <Text style={[styles.ownerChipText, ownerId === p.id && { color: "#fff" }]}>{p.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ height: spacing.lg }} />
      <Button title="Create Team" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
  ownerList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  ownerChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  ownerChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ownerChipText: { color: colors.text, fontWeight: "600" },
});
