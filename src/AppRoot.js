import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, Linking } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { AppProvider, useSync } from "./context/AppContext";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { setStorageUser } from "./storage/storage";
import { cloudConfigured } from "./cloud/config";
import SeedSelf from "./auth/SeedSelf";
import RootNavigator from "./navigation/RootNavigator";
import AuthNavigator from "./navigation/AuthNavigator";
import TermsGate from "./legal/TermsGate";
import SetupNeededScreen from "./screens/SetupNeededScreen";
import SyncBanner from "./components/SyncBanner";
import InviteWatcher from "./invite/InviteWatcher";
import { parseInviteUrl, setPendingInvite } from "./invite/links";
import { navigationRef } from "./navigation/navRef";
import Button from "./components/Button";
import { colors, spacing, typography } from "./utils/theme";

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text, border: colors.border },
};

const Center = ({ children }) => (
  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.lg }}>{children}</View>
);

// Wait for the first copy of the shared data (or the saved copy on this phone).
function DataGate({ user }) {
  const { ready, status, error, syncNow } = useSync();
  if (!ready) {
    if (status === "offline" || status === "error") {
      return (
        <Center>
          <Text style={typography.h3}>Couldn't load your data</Text>
          <Text style={[typography.muted, { textAlign: "center", marginVertical: spacing.md }]}>{error}</Text>
          <Button title="Try again" onPress={syncNow} />
        </Center>
      );
    }
    return (
      <Center>
        <ActivityIndicator color={colors.primary} />
        <Text style={[typography.muted, { marginTop: spacing.md }]}>Loading shared data…</Text>
      </Center>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <SyncBanner />
      <SeedSelf user={user} />
      <InviteWatcher />
      <View style={{ flex: 1 }}>
        <RootNavigator />
      </View>
    </View>
  );
}

// Logged out -> auth screens. Logged in -> the app, with the shared cloud data.
// key={user.id} makes React throw away the previous account's in-memory data
// whenever the login changes.
function Gate() {
  const { ready, user } = useAuth();

  if (!cloudConfigured()) return <SetupNeededScreen />;

  if (!ready) {
    return (
      <Center>
        <ActivityIndicator color={colors.primary} />
      </Center>
    );
  }

  if (!user) {
    setStorageUser(null);
    return <AuthNavigator />;
  }

  setStorageUser(user.id);
  return (
    <TermsGate key={user.id} userId={user.id}>
      <AppProvider key={user.id}>
        <DataGate user={user} />
      </AppProvider>
    </TermsGate>
  );
}

// Team invite links (criccorner://join/...) that open the app.
function useInviteLinks() {
  useEffect(() => {
    const handle = (url) => {
      const inv = parseInviteUrl(url);
      if (inv) setPendingInvite(inv);
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => sub && sub.remove && sub.remove();
  }, []);
}

export default function App() {
  useInviteLinks();
  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme} ref={navigationRef}>
        <StatusBar style="light" />
        <Gate />
      </NavigationContainer>
    </AuthProvider>
  );
}
