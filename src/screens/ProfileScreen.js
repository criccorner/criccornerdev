import React from "react";
import { View, Text, StyleSheet, Alert, Pressable, ScrollView } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { photoUriFor } from "../profile/store";
import Avatar from "../components/Avatar";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import CopyrightFooter from "../components/CopyrightFooter";
import { colors, spacing, typography } from "../utils/theme";

function MenuRow({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <Text style={typography.body}>{label}</Text>
      <Text style={{ color: colors.textMuted }}>›</Text>
    </Pressable>
  );
}

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <Text style={[typography.body, { marginTop: 2 }]}>
      <Text style={typography.muted}>{label}: </Text>
      {value}
    </Text>
  );
}


export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const confirmLogout = () =>
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👤 My Profile</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Avatar uri={photoUriFor(user)} name={user?.name} size={84} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                <Text style={[typography.h2, { marginRight: spacing.sm }]}>{user?.name}</Text>
                {user?.isAdmin ? <Badge label="ADMIN" color={colors.accent} /> : null}
              </View>
              <Text style={[typography.muted, { marginTop: 2 }]}>{user?.identifier}</Text>
            </View>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <Detail label="Role" value={user?.role} />
            <Detail label="Batting" value={user?.battingStyle} />
            <Detail label="Bowling" value={user?.bowlingStyle} />
            <Detail label="City" value={user?.city} />
          </View>
          <Button title="✏️ Edit Profile" variant="outline" onPress={() => navigation.navigate("EditProfile")} style={{ marginTop: spacing.md }} />
        </Card>

        <Card>
          <MenuRow label="🔑 Change password" onPress={() => navigation.navigate("ChangePassword")} />
          <MenuRow label="❓ Help — how to use CricCorner" onPress={() => navigation.navigate("Help")} />
          <MenuRow label="🎨 App theme" onPress={() => navigation.navigate("Theme")} />
          <MenuRow label="💬 Report an Issue / Suggestion" onPress={() => navigation.navigate("Feedback")} />
          <MenuRow label="📋 My Submissions" onPress={() => navigation.navigate("MyFeedback")} />
          <MenuRow label="☁️ Upload data from this phone" onPress={() => navigation.navigate("ImportLocal")} />
          {user?.isAdmin ? <MenuRow label="🛠️ Fix duplicate contacts" onPress={() => navigation.navigate("FixContacts")} /> : null}
          {user?.isAdmin ? <MenuRow label="🛠️ Admin Panel" onPress={() => navigation.navigate("AdminHome")} /> : null}
        </Card>

        <Button title="Log Out" variant="danger" onPress={confirmLogout} />
        <Pressable onPress={() => navigation.navigate("DeleteAccount")} style={{ alignItems: "center", paddingVertical: spacing.lg }}>
          <Text style={{ color: colors.textMuted, fontWeight: "700", textDecorationLine: "underline" }}>Delete my account</Text>
        </Pressable>
        <CopyrightFooter onOpenTerms={() => navigation.navigate("Legal")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  title: { fontSize: 22, fontWeight: "800", color: "#fff" },
  menuRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
});
