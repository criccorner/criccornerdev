import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useAccess } from "../context/AppContext";
import { useAuth } from "../auth/AuthContext";
import { colors, spacing, typography } from "../utils/theme";
import Button from "../components/Button";
import Card from "../components/Card";
import SegmentedTabs from "../components/SegmentedTabs";
import CityPicker from "../components/CityPicker";
import { tournamentsAround } from "../geo/cities";
import { loadHomeCity, saveHomeCity } from "../geo/home";

function Row({ t, km, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <Text style={typography.h3}>{t.name}</Text>
        <Text style={typography.muted}>
          {t.city ? `📍 ${t.cityLabel || t.city}${km != null && km > 1 ? ` · ${Math.round(km)} km away` : ""} · ` : ""}
          {(t.matchIds || []).length} match{(t.matchIds || []).length === 1 ? "" : "es"} · {(t.sponsors || []).length} sponsor{(t.sponsors || []).length === 1 ? "" : "s"}
        </Text>
      </Card>
    </Pressable>
  );
}

export default function TournamentsScreen({ navigation }) {
  const { mine, other, isAdmin } = useAccess();
  const { user } = useAuth();
  const [view, setView] = useState("mine");
  const [home, setHome] = useState(undefined); // undefined = still looking, null = not set
  useEffect(() => {
    let alive = true;
    loadHomeCity(user).then((v) => alive && setHome(v || null));
    return () => { alive = false; };
  }, [user && user.city]);

  const around = useMemo(() => tournamentsAround(isAdmin ? mine.tournaments : other.tournaments, home, 10), [isAdmin, mine.tournaments, other.tournaments, home]);
  const open = (t) => () => navigation.navigate("TournamentDetail", { tournamentId: t.id });

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Button title="+ Create Tournament" onPress={() => navigation.navigate("CreateTournament")} />
      </View>
      <SegmentedTabs options={[["mine", `My tournaments (${mine.tournaments.length})`], ["near", "Near me"]]} value={view} onChange={setView} />
      {view === "mine" ? (
        <FlatList
          data={mine.tournaments}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>No tournaments yet.</Text>}
          renderItem={({ item }) => <Row t={item} km={null} onPress={open(item)} />}
        />
      ) : (
        <FlatList
          data={around.items}
          keyExtractor={(x) => x.tournament.id}
          contentContainerStyle={{ padding: spacing.md }}
          ListHeaderComponent={
            <View>
              {home === undefined ? null : home ? (
                <View style={styles.where}>
                  <Text style={typography.muted}>📍 Showing tournaments around {home.label || home.name}</Text>
                  <Pressable onPress={() => { saveHomeCity(null); setHome(null); }} hitSlop={8}>
                    <Text style={styles.change}>Change</Text>
                  </Pressable>
                </View>
              ) : (
                <Card>
                  <Text style={typography.h3}>Where are you?</Text>
                  <Text style={[typography.muted, { marginBottom: spacing.sm }]}>Pick your city to see the newest tournaments there, or the nearest ones.</Text>
                  <CityPicker label="Your city" value={null} onChange={(v) => { saveHomeCity(v); setHome(v); }} />
                </Card>
              )}
              {home && around.mode === "near" ? <Text style={[typography.muted, { marginBottom: spacing.sm }]}>No tournaments in {home.name} yet. Here are the nearest ones.</Text> : null}
              {home && around.items.length ? <Text style={[typography.muted, { marginBottom: spacing.sm }]}>Tap one to see the details and how to contact the organizer.</Text> : null}
            </View>
          }
          ListEmptyComponent={home ? <Text style={[typography.muted, { textAlign: "center", marginTop: spacing.lg }]}>No tournaments found near {home.name} yet.</Text> : null}
          renderItem={({ item }) => <Row t={item.tournament} km={item.km} onPress={open(item.tournament)} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { padding: spacing.md, paddingBottom: 0 },
  where: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  change: { color: colors.primary, fontWeight: "800" },
});
