import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { useAllState } from "../context/AppContext";
import { playerMatchesUser } from "../auth/identity";
import Card from "../components/Card";
import { colors, spacing, typography, radius } from "../utils/theme";
import { teamsLookingFor, strengthOf } from "../utils/finder";

// Looking for a team to join: teams whose owner says they need a player like you, matched on your profile
// (playing role and city). Same-city teams come first.
export default function FindTeamToJoinScreen({ navigation }) {
  const { user } = useAuth();
  const all = useAllState();
  const me = all.players.find((p) => playerMatchesUser(p, user));
  const role = (me && me.role) || user.role;
  const city = (me && me.city) || user.city || "";
  const rows = useMemo(() => teamsLookingFor(all.teams, { role, city, playerId: me && me.id }), [all.teams, role, city, me && me.id]);
  const strength = strengthOf(role);
  return (
    <View style={styles.container}>
      <Card>
        <Text style={typography.body}>
          Matching your profile: <Text style={{ fontWeight: "800" }}>{strength || "role not set"}</Text>{city ? ` · 📍 ${city}` : " · city not set"}
        </Text>
        <Pressable onPress={() => navigation.navigate("EditProfile")}>
          <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 4 }}>✏️ Update my profile</Text>
        </Pressable>
        {me && !me.availableToJoin ? <Text style={[typography.muted, { marginTop: 4 }]}>Tip: tick "Available to join a team" in Edit Profile so teams can find you too.</Text> : null}
      </Card>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.team.id}
        ListEmptyComponent={<Text style={[typography.muted, { marginTop: spacing.md }]}>No team is looking for a {strength || "player"} right now. Team owners can set this in Edit Team.</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginTop: spacing.sm }}>
            <Text style={typography.h3}>{item.team.name}</Text>
            <Text style={typography.muted}>{item.team.city ? `📍 ${item.team.cityLabel || item.team.city}` : "City not set"}{item.sameCity ? " · near you ✔" : ""}</Text>
            <Text style={typography.body}>Looking for: {(item.team.lookingFor || []).join(", ")}</Text>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
              <Pressable onPress={() => navigation.navigate("Teams", { screen: "TeamDetail", params: { teamId: item.team.id } })} style={[styles.btn, styles.btnOutline]}>
                <Text style={[styles.btnText, { color: colors.primary }]}>View team</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("Chat", { kind: "teams", id: item.team.id, name: item.team.name })} style={styles.btn}>
                <Text style={styles.btnText}>💬 Message</Text>
              </Pressable>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  btn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.primary },
  btnOutline: { backgroundColor: "transparent" },
  btnText: { color: "#fff", fontWeight: "800" },
});
