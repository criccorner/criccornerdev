import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Keyboard, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthContext";
import { colors, spacing, typography, radius } from "../../utils/theme";
import { fetchThread, sendMessage, markRead, resolveTarget } from "../../chat/store";

// One conversation. Open with { otherId, name } or with { kind: "players" | "teams", id, name } (we find who to message).
export default function ChatScreen({ route, navigation }) {
  const { user } = useAuth();
  const p = route.params || {};
  const [otherId, setOtherId] = useState(p.otherId || null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState(p.otherId ? "ready" : "finding"); // finding | ready | none
  const scroll = useRef(null);
  // Lift the message box above the keyboard (the phone no longer resizes the screen for us): measure where this screen
  // ends and where the keyboard starts, and pad the difference.
  const box = useRef(null);
  const [lift, setLift] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      const top = e && e.endCoordinates ? e.endCoordinates.screenY : null;
      if (top == null || !box.current) return;
      box.current.measureInWindow((x, y, w, h) => setLift(Math.max(0, Math.round(y + h - top))));
      setTimeout(() => scroll.current && scroll.current.scrollToEnd({ animated: true }), 120);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => setLift(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    navigation.setOptions({ title: p.name ? `💬 ${p.name}` : "Chat" });
    if (otherId || !p.kind) return;
    let alive = true;
    resolveTarget(p.kind, p.id)
      .then((id) => { if (!alive) return; if (id) { setOtherId(id); setState("ready"); } else setState("none"); })
      .catch(() => { if (alive) setState("none"); });
    return () => { alive = false; };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!otherId) return undefined;
      let alive = true;
      const load = async () => {
        try {
          const m = await fetchThread(user.id, otherId);
          if (!alive) return;
          setMsgs((cur) => (cur.length === m.length && cur.length && cur[cur.length - 1].id === m[m.length - 1].id ? cur : m));
          if (m.some((x) => x.to === user.id && !x.readAt)) markRead(user.id, otherId).catch(() => {});
        } catch (e) { /* keep what we have; try again on the next tick */ }
      };
      load();
      const t = setInterval(load, 5000);
      return () => { alive = false; clearInterval(t); };
    }, [otherId, user.id])
  );

  const send = async () => {
    if (!text.trim() || busy || !otherId) return;
    setBusy(true);
    try {
      await sendMessage(otherId, text);
      setText("");
      setMsgs(await fetchThread(user.id, otherId));
    } catch (e) {
      Alert.alert("Couldn't send", e && e.message && !/fetch|network/i.test(e.message) ? e.message : "Please check your connection and try again.");
    } finally { setBusy(false); }
  };

  if (state === "finding") return <View style={styles.center}><Text style={typography.muted}>Finding them…</Text></View>;
  if (state === "none") {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>This person can't be messaged here.</Text>
        <Text style={[typography.muted, { textAlign: "center", marginTop: 6 }]}>Chat works with registered CricCorner users only (players who joined with a mobile number or email, and team owners).</Text>
      </View>
    );
  }
  return (
    <View ref={box} collapsable={false} style={{ flex: 1, backgroundColor: colors.background, paddingBottom: lift }}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: spacing.md }} onContentSizeChange={() => scroll.current && scroll.current.scrollToEnd({ animated: false })} keyboardShouldPersistTaps="handled">
        {msgs.length === 0 ? <Text style={[typography.muted, { textAlign: "center" }]}>Say hello 👋 - messages here are private between the two of you.</Text> : null}
        {msgs.map((m) => {
          const mine = m.from === user.id;
          return (
            <View key={m.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={{ color: mine ? "#fff" : colors.text }}>{m.body}</Text>
              <Text style={{ color: mine ? "#ffffffb0" : colors.textMuted, fontSize: 10, marginTop: 2, alignSelf: "flex-end" }}>
                {new Date(m.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}{mine && m.readAt ? " ✓✓" : ""}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput value={text} onChangeText={setText} placeholder="Type a message" placeholderTextColor={colors.textMuted} style={styles.input} multiline maxLength={1000} />
        <Pressable onPress={send} disabled={busy || !text.trim()} style={[styles.send, (busy || !text.trim()) && { opacity: 0.5 }]} accessibilityRole="button">
          <Text style={{ color: "#fff", fontWeight: "800" }}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.lg },
  bubble: { maxWidth: "80%", paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.lg, marginBottom: 8 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  composer: { flexDirection: "row", alignItems: "flex-end", padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, gap: spacing.sm },
  input: { flex: 1, maxHeight: 110, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 8, color: colors.text, backgroundColor: colors.background },
  send: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
});
