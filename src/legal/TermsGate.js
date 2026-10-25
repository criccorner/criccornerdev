import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "../components/Button";
import Card from "../components/Card";
import { colors, spacing, typography } from "../utils/theme";
import { LEGAL_VERSION } from "./config";
import { copyrightLine, NOTICE, termsSections } from "./content";

const keyFor = (uid) => `@criccorner_terms_v:${uid}`;

// Every signed-in person must see the copyright notice and Terms once (again whenever LEGAL_VERSION changes).
export default function TermsGate({ userId, children }) {
  const [state, setState] = useState("loading"); // loading | show | ok
  const [full, setFull] = useState(false);

  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(keyFor(userId))
      .then((v) => live && setState(v === LEGAL_VERSION ? "ok" : "show"))
      .catch(() => live && setState("show"));
    return () => {
      live = false;
    };
  }, [userId]);

  const accept = async () => {
    try {
      await AsyncStorage.setItem(keyFor(userId), LEGAL_VERSION);
    } catch (e) {}
    setState("ok");
  };

  if (state === "ok") return children;
  if (state === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>🏏 CricCorner</Text>
      <Text style={typography.h2}>Copyright and Terms</Text>
      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.copy}>{copyrightLine()}</Text>
        <Text style={styles.p}>{NOTICE}</Text>
      </Card>
      {full
        ? termsSections().map((s) => (
            <Card key={s.h}>
              <Text style={typography.h3}>{s.h}</Text>
              <Text style={styles.p}>{s.p}</Text>
            </Card>
          ))
        : null}
      {!full ? <Button title="Read the full Terms" variant="outline" onPress={() => setFull(true)} style={{ marginBottom: spacing.md }} /> : null}
      <Text style={[typography.muted, { marginBottom: spacing.sm }]}>By continuing you agree to the Terms of Use and the Privacy Policy.</Text>
      <Button title="I agree, continue" onPress={accept} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl + spacing.lg },
  brand: { color: colors.primary, fontWeight: "800", fontSize: 16, marginBottom: spacing.sm },
  copy: { fontWeight: "800", color: colors.text, marginBottom: spacing.xs },
  p: { color: colors.text, lineHeight: 21 },
});
