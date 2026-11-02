import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../utils/theme";
import { fetchSponsors, loadCachedSponsors, sponsorsForCity } from "../sponsors/store";

// Sponsors shown above a match: the tournament's own sponsors first, then the app's sponsors for the
// match's city. One at a time, moving on every few seconds. Holding a finger on it keeps it still
// (so the details can be read); tapping keeps it open; the arrows go back and forward.
export default function SponsorBanner({ tournament, place, interval = 5000 }) {
  const [appList, setAppList] = useState([]);
  const [i, setI] = useState(0);
  const [holding, setHolding] = useState(false);
  const [open, setOpen] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    loadCachedSponsors().then((l) => alive.current && setAppList(l)).catch(() => {});
    fetchSponsors().then((l) => alive.current && setAppList(l)).catch(() => {});
    return () => { alive.current = false; };
  }, []);

  const items = useMemo(() => {
    const own = ((tournament && tournament.sponsors) || []).map((s) => ({ ...s, kind: "Tournament sponsor" }));
    const app = sponsorsForCity(appList, place).map((s) => ({ ...s, kind: "Sponsor" }));
    return [...own, ...app];
  }, [tournament, appList, place && place.name, place && place.lat, place && place.lng]);

  const n = items.length;
  const paused = holding || open;
  useEffect(() => {
    if (n < 2 || paused) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % n), interval);
    return () => clearInterval(t);
  }, [n, paused, interval]);
  useEffect(() => { if (i >= n) setI(0); }, [n, i]);

  if (!n) return null;
  const s = items[Math.min(i, n - 1)];
  const go = (d) => setI((x) => (x + d + n) % n);

  return (
    <View style={styles.wrap} accessibilityLabel="Sponsors">
      <Text style={styles.label}>{s.kind}{n > 1 ? `  ${Math.min(i, n - 1) + 1}/${n}` : ""}</Text>
      <View style={styles.row}>
        {n > 1 ? <Pressable onPress={() => go(-1)} hitSlop={10} style={styles.arrow} accessibilityLabel="Previous sponsor"><Text style={styles.arrowText}>‹</Text></Pressable> : null}
        <Pressable
          onPressIn={() => setHolding(true)}
          onPressOut={() => setHolding(false)}
          onPress={() => setOpen((v) => !v)}
          style={styles.card}
          accessibilityLabel={`${s.name}. Hold to keep it on screen.`}
        >
          {s.imageUrl ? <Image source={{ uri: s.imageUrl }} style={open ? styles.imageBig : styles.image} /> : <View style={[styles.image, styles.noImage]}><Text style={{ color: "#fff", fontWeight: "800" }}>{(s.name || "?").charAt(0).toUpperCase()}</Text></View>}
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.name} numberOfLines={open ? 3 : 1}>{s.name}</Text>
            {s.tagline ? <Text style={styles.sub} numberOfLines={open ? 4 : 1}>{s.tagline}</Text> : null}
            {s.contact ? <Text style={styles.contact} numberOfLines={open ? 3 : 1}>{s.contact}</Text> : null}
          </View>
        </Pressable>
        {n > 1 ? <Pressable onPress={() => go(1)} hitSlop={10} style={styles.arrow} accessibilityLabel="Next sponsor"><Text style={styles.arrowText}>›</Text></Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.primaryDark, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  label: { color: "#CFE3D8", fontSize: 10, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center" },
  card: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: radius.md, padding: spacing.sm },
  image: { width: 44, height: 44, borderRadius: radius.sm || 6, backgroundColor: "rgba(255,255,255,0.2)" },
  imageBig: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.2)" },
  noImage: { alignItems: "center", justifyContent: "center" },
  name: { color: "#fff", fontWeight: "800", fontSize: 14 },
  sub: { color: "#CFE3D8", fontSize: 12 },
  contact: { color: "#fff", fontSize: 12, marginTop: 2, textDecorationLine: "underline" },
  arrow: { width: 32, height: 44, alignItems: "center", justifyContent: "center" },
  arrowText: { color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 30 },
});
