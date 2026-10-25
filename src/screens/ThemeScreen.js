import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, DevSettings } from "react-native";
import { colors, spacing, typography, radius, THEMES, THEME_ORDER, appliedTheme } from "../utils/theme";
import { savedThemeName, saveTheme } from "../theme/themeStore";
import Button from "../components/Button";

// A small picture of a theme, drawn with THAT theme's own colours and shapes.
function Preview({ t }) {
  const c = t.colors;
  return (
    <View style={{ backgroundColor: c.background, borderRadius: t.radius.md, overflow: "hidden", borderWidth: 1, borderColor: c.border }}>
      <View style={{ backgroundColor: c.primary, paddingVertical: 8, paddingHorizontal: 12 }}>
        <Text style={{ color: "#fff", fontWeight: t.design.heading, fontSize: 13 }}>CricCorner</Text>
      </View>
      <View style={{ padding: t.spacing.sm + 2 }}>
        <View
          style={{
            backgroundColor: c.surface, borderRadius: t.radius.lg, padding: t.spacing.sm + 2,
            borderWidth: t.design.cardBorder, borderColor: c.border,
            shadowColor: "#000", shadowOpacity: t.design.shadowOpacity, shadowRadius: t.design.shadowRadius, shadowOffset: { width: 0, height: 2 },
            elevation: t.design.shadowOpacity > 0 ? 2 : 0,
          }}
        >
          <Text style={{ color: c.text, fontWeight: t.design.heading, fontSize: 13 }}>Hawthorn Titans</Text>
          <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 1 }}>152/4 (18.2 ov)</Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: t.spacing.sm }}>
            <View style={{ backgroundColor: c.primary, borderRadius: t.radius.md, paddingVertical: 5, paddingHorizontal: 10 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>Score</Text>
            </View>
            <View style={{ backgroundColor: c.accent, borderRadius: t.radius.pill, paddingVertical: 5, paddingHorizontal: 10 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>LIVE</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ThemeScreen() {
  const [saved, setSaved] = useState(appliedTheme());
  const running = appliedTheme();

  useEffect(() => {
    let on = true;
    savedThemeName().then((n) => on && setSaved(n));
    return () => {
      on = false;
    };
  }, []);

  const pick = async (key) => {
    const ok = await saveTheme(key);
    if (!ok) {
      Alert.alert("Couldn't save", "Your phone didn't let the app save the theme. Please try again.");
      return;
    }
    setSaved(key);
  };

  const restart = () => {
    try {
      DevSettings.reload();
    } catch (e) {
      // fall through to the message below
    }
    setTimeout(() => Alert.alert("Almost there", "Please close CricCorner completely (swipe it away from recent apps) and open it again."), 1500);
  };

  const pending = saved !== running;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={typography.muted}>Pick a look for the app. It is saved on this phone and applies the next time the app opens.</Text>

      {pending ? (
        <View style={styles.notice}>
          <Text style={[typography.h3, { marginBottom: 2 }]}>{THEMES[saved].label} is saved</Text>
          <Text style={typography.muted}>Close CricCorner completely and open it again to see it.</Text>
          <Button title="Restart now" onPress={restart} style={{ marginTop: spacing.sm }} />
        </View>
      ) : null}

      {THEME_ORDER.map((key) => {
        const t = THEMES[key];
        const chosen = saved === key;
        return (
          <Pressable key={key} onPress={() => pick(key)} style={[styles.tile, chosen && styles.tileOn]}>
            <View style={styles.tileHead}>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3}>{t.label}</Text>
                <Text style={typography.muted}>{t.blurb}</Text>
              </View>
              {chosen ? <Text style={styles.check}>✓ {key === running ? "In use" : "Saved"}</Text> : null}
            </View>
            <View style={{ height: spacing.sm }} />
            <Preview t={t} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  notice: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.accent, backgroundColor: "#FFF6DB" },
  tile: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  tileOn: { borderColor: colors.primary },
  tileHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  check: { color: colors.primary, fontWeight: "800" },
});
