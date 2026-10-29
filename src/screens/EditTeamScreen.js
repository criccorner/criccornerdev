import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useAppState, useAppDispatch, useAccess } from "../context/AppContext";
import { colors, spacing, typography } from "../utils/theme";
import FormField from "../components/FormField";
import Button from "../components/Button";

// Rename a team. Only the people who can manage the team (its owner, the person who created it, admins) get here.
export default function EditTeamScreen({ route, navigation }) {
  const { teamId } = route.params;
  const { teams } = useAppState();
  const dispatch = useAppDispatch();
  const { canEdit } = useAccess();
  const team = teams.find((t) => t.id === teamId);
  const [name, setName] = useState(team ? team.name : "");

  if (!team) {
    return (
      <View style={styles.container}>
        <Text style={typography.body}>This team could not be found.</Text>
      </View>
    );
  }
  if (!canEdit("teams", teamId)) {
    return (
      <View style={styles.container}>
        <Text style={typography.body}>Only the team's owner or an administrator can edit this team.</Text>
      </View>
    );
  }

  const save = () => {
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) {
      Alert.alert("Team name required");
      return;
    }
    if (clean.length > 40) {
      Alert.alert("That name is too long", "Please use 40 characters or fewer.");
      return;
    }
    const clash = teams.some((t) => t.id !== teamId && t.name.trim().toLowerCase() === clean.toLowerCase());
    const go = () => {
      dispatch({ type: "UPDATE_TEAM", payload: { teamId, name: clean } });
      navigation.goBack();
    };
    if (clash) {
      Alert.alert("Another team has this name", "Two teams with the same name are easy to mix up. Save anyway?", [
        { text: "Cancel", style: "cancel" },
        { text: "Save anyway", onPress: go },
      ]);
    } else {
      go();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <FormField label="Team Name" value={name} onChangeText={setName} placeholder="e.g. Mumbai Strikers" maxLength={40} />
      <Text style={[typography.muted, { marginBottom: spacing.md }]}>
        The new name shows everywhere: matches, scorecards, tournaments and stats. Results of finished matches are updated too.
      </Text>
      <Button title="Save" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
});
