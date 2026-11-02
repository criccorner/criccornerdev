import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { useAppState, useAccess } from "../context/AppContext";
import { notificationsFor } from "../screens/NotificationsScreen";

// The 🔔 on the Home header: a red number when a match is waiting for your attendance (or your XI).
export default function NotificationBell({ navigation }) {
  const { matches, teams, players } = useAppState();
  const access = useAccess();
  const { count } = notificationsFor({ matches, teams, players, access });
  return (
    <Pressable
      onPress={() => navigation.navigate("Matches", { screen: "Notifications" })}
      hitSlop={10}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={count ? `Notifications, ${count} waiting` : "Notifications"}
    >
      <Text style={{ fontSize: 24 }}>🔔</Text>
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
  badge: { position: "absolute", top: -2, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#E5252A", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});
