import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { searchCities } from "../geo/cities";
import { colors, spacing, typography, radius } from "../utils/theme";

// Type a city, pick it from the list: only real places can be chosen.
// value = { name, lat, lng } | null.   onChange(value | null)
export default function CityPicker({ label = "City", value, onChange, placeholder = "Start typing the city name" }) {
  const [text, setText] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (value || text.trim().length < 3) {
      setResults([]);
      setError("");
      return undefined;
    }
    timer.current = setTimeout(async () => {
      setBusy(true);
      setError("");
      try {
        const r = await searchCities(text);
        setResults(r);
        if (!r.length) setError("No such city found. Check the spelling, or add the state or country.");
      } catch (e) {
        setResults([]);
        setError("Couldn't look up cities right now. Check your internet connection and try again.");
      } finally {
        setBusy(false);
      }
    }, 600);
    return () => timer.current && clearTimeout(timer.current);
  }, [text, value]);

  if (value) {
    return (
      <View style={{ marginBottom: spacing.md }}>
        <Text style={typography.label}>{label.toUpperCase()}</Text>
        <View style={styles.picked}>
          <Text style={styles.pickedText}>📍 {value.label || value.name}</Text>
          <Pressable onPress={() => { setText(""); onChange(null); }} hitSlop={8}>
            <Text style={{ color: colors.primary, fontWeight: "800" }}>Change</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={typography.label}>{label.toUpperCase()}</Text>
      <TextInput value={text} onChangeText={setText} placeholder={placeholder} placeholderTextColor={colors.textMuted} style={styles.input} autoCorrect={false} />
      {busy ? <ActivityIndicator style={{ marginTop: spacing.sm }} color={colors.primary} /> : null}
      {error ? <Text style={[typography.muted, { color: colors.danger, marginTop: spacing.xs }]}>{error}</Text> : null}
      {results.map((r) => (
        <Pressable key={r.label} onPress={() => { onChange({ name: r.name, label: r.label, lat: r.lat, lng: r.lng }); setResults([]); }} style={styles.row}>
          <Text style={typography.body}>{r.label}</Text>
        </Pressable>
      ))}
      <Text style={[typography.muted, { marginTop: spacing.xs }]}>Pick your city from the list so people nearby can find it.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: 10, marginTop: spacing.xs, fontSize: 15 },
  row: { paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
  picked: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: 10, marginTop: spacing.xs },
  pickedText: { color: colors.text, fontWeight: "700", flex: 1, marginRight: spacing.sm },
});
