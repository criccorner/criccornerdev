import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { colors, spacing, typography, radius } from "../utils/theme";
import Card from "../components/Card";
import { HELP_TOPICS, searchHelp } from "../help/content";

// How to use CricCorner. Works before login too (opened from the login screen).
export default function HelpScreen() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState({}); // topic id or "id:index" -> true
  const searching = query.trim().length > 0;
  const topics = searchHelp(HELP_TOPICS, query);
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <Text style={typography.h2}>How to use CricCorner</Text>
      <Text style={[typography.muted, { marginBottom: spacing.sm }]}>Tap a topic to open it.</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search help (e.g. undo, invite, wide)"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />
      {topics.length === 0 ? <Text style={[typography.muted, { marginTop: spacing.md }]}>Nothing found. Try another word.</Text> : null}
      {topics.map((t) => {
        const isOpen = searching || open[t.id];
        return (
          <Card key={t.id} style={{ padding: 0 }}>
            <Pressable onPress={() => toggle(t.id)} style={styles.topicHead}>
              <Text style={styles.topicIcon}>{t.icon}</Text>
              <Text style={styles.topicTitle}>{t.title}</Text>
              <Text style={styles.chev}>{isOpen ? "▾" : "▸"}</Text>
            </Pressable>
            {isOpen ? (
              <View style={styles.body}>
                {t.items.map((it, i) => {
                  const k = `${t.id}:${i}`;
                  const show = searching || open[k];
                  return (
                    <View key={k} style={styles.item}>
                      <Pressable onPress={() => toggle(k)}>
                        <Text style={styles.q}>{show ? "– " : "+ "}{it.q}</Text>
                      </Pressable>
                      {show ? <Text style={styles.a}>{it.a}</Text> : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
          </Card>
        );
      })}
      <Text style={[typography.muted, { textAlign: "center", marginVertical: spacing.lg }]}>
        Still stuck? Profile → Report an Issue / Suggestion.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  search: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm + 2, color: colors.text, marginBottom: spacing.md },
  topicHead: { flexDirection: "row", alignItems: "center", padding: spacing.md },
  topicIcon: { fontSize: 22, width: 36 },
  topicTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: colors.text },
  chev: { fontSize: 16, color: colors.textMuted },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  item: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  q: { fontSize: 14, fontWeight: "700", color: colors.primary },
  a: { fontSize: 14, color: colors.text, marginTop: 4, lineHeight: 20 },
});
