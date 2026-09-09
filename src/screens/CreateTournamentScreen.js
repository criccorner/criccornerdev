import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useAppDispatch } from "../context/AppContext";
import { colors, spacing } from "../utils/theme";
import FormField from "../components/FormField";
import Button from "../components/Button";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateTournamentScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState("");

  const submit = () => {
    if (!name.trim()) {
      Alert.alert("Tournament name required");
      return;
    }
    dispatch({
      type: "CREATE_TOURNAMENT",
      payload: { name: name.trim(), startDate, endDate: endDate.trim() || null },
    });
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FormField label="Tournament Name" value={name} onChangeText={setName} placeholder="e.g. City Premier League 2026" />
      <FormField label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
      <FormField label="End Date (YYYY-MM-DD, optional)" value={endDate} onChangeText={setEndDate} />
      <View style={{ height: spacing.md }} />
      <Button title="Create Tournament" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.background, flexGrow: 1 },
});
