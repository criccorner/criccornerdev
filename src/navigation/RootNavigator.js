import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../utils/theme";

import HomeScreen from "../screens/HomeScreen";
import PlayersScreen from "../screens/PlayersScreen";
import AddPlayerScreen from "../screens/AddPlayerScreen";
import EditPlayerScreen from "../screens/EditPlayerScreen";
import TeamsScreen from "../screens/TeamsScreen";
import CreateTeamScreen from "../screens/CreateTeamScreen";
import EditTeamScreen from "../screens/EditTeamScreen";
import TeamDetailScreen from "../screens/TeamDetailScreen";
import PlayerStatsScreen from "../screens/stats/PlayerStatsScreen";
import MatchesScreen from "../screens/MatchesScreen";
import ScheduleMatchScreen from "../screens/ScheduleMatchScreen";
import EditMatchScreen from "../screens/EditMatchScreen";
import CorrectionsScreen from "../screens/CorrectionsScreen";
import JoinTeamScreen from "../screens/JoinTeamScreen";
import MatchSetupScreen from "../screens/MatchSetupScreen";
import LiveScoringScreen from "../screens/LiveScoringScreen";
import ScorecardScreen from "../screens/ScorecardScreen";
import TournamentsScreen from "../screens/TournamentsScreen";
import CreateTournamentScreen from "../screens/CreateTournamentScreen";
import TournamentDetailScreen from "../screens/TournamentDetailScreen";
import ProfileStack from "./ProfileStack";
import MyStatsScreen from "../screens/stats/MyStatsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" },
};

// The app draws its own tab bar (icons, labels, colours) so nothing depends on the navigation
// library's default styling, which made the tabs look greyed out. It also keeps clear of the
// phone's own navigation buttons (edge-to-edge screens on newer Android).
function icon(emoji) {
  return () => <Text style={{ fontSize: 26 }}>{emoji}</Text>;
}
function label(text) {
  return ({ focused }) => (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.8}
      allowFontScaling={false}
      style={{ fontSize: 12, marginTop: 1, fontWeight: focused ? "800" : "600", color: focused ? colors.primary : colors.text }}
    >
      {text}
    </Text>
  );
}
export function tabOptions(text, emoji) {
  return { tabBarIcon: icon(emoji), tabBarLabel: label(text) };
}

export function AppTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom,
        opacity: 1,
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const onLongPress = () => navigation.emit({ type: "tabLongPress", target: route.key });
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 5, paddingBottom: 5, minHeight: 60 }}
          >
            <View style={{ paddingHorizontal: 12, paddingVertical: 1, borderRadius: 999, backgroundColor: focused ? colors.primary + "1F" : "transparent" }}>
              {options.tabBarIcon ? options.tabBarIcon({ focused }) : null}
            </View>
            {options.tabBarLabel ? options.tabBarLabel({ focused }) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// Live scoring gets a "Scorecard" button in the header so the full scorecard
// can be opened at any point during the match.
const liveScoringOptions = ({ navigation, route }) => ({
  title: "Live Scoring",
  headerBackVisible: false,
  headerRight: () => (
    <Pressable onPress={() => navigation.navigate("Scorecard", { matchId: route.params.matchId })} hitSlop={10}>
      <Text style={{ color: "#fff", fontWeight: "700" }}>📊 Scorecard</Text>
    </Pressable>
  ),
});

function PlayersStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PlayersList" component={PlayersScreen} options={{ title: "Players" }} />
      <Stack.Screen name="AddPlayer" component={AddPlayerScreen} options={{ title: "Add / Join Player" }} />
      <Stack.Screen name="EditPlayer" component={EditPlayerScreen} options={{ title: "Edit Player" }} />
      <Stack.Screen name="PlayerStats" component={PlayerStatsScreen} options={{ title: "Player Stats" }} />
    </Stack.Navigator>
  );
}

function TeamsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="TeamsList" component={TeamsScreen} options={{ title: "Teams" }} />
      <Stack.Screen name="CreateTeam" component={CreateTeamScreen} options={{ title: "Create Team" }} />
      <Stack.Screen name="TeamDetail" component={TeamDetailScreen} options={{ title: "Team" }} />
      <Stack.Screen name="EditTeam" component={EditTeamScreen} options={{ title: "Edit Team" }} />
      <Stack.Screen name="PlayerStats" component={PlayerStatsScreen} options={{ title: "Player Stats" }} />
      <Stack.Screen name="JoinTeam" component={JoinTeamScreen} options={{ title: "Join Team" }} />
    </Stack.Navigator>
  );
}

function MatchesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MatchesList" component={MatchesScreen} options={{ title: "Matches" }} />
      <Stack.Screen name="ScheduleMatch" component={ScheduleMatchScreen} options={{ title: "Schedule Match" }} />
      <Stack.Screen name="MatchSetup" component={MatchSetupScreen} options={{ title: "Match Setup" }} />
      <Stack.Screen name="EditMatch" component={EditMatchScreen} options={{ title: "Edit Match" }} />
      <Stack.Screen name="Corrections" component={CorrectionsScreen} options={{ title: "Captain Corrections" }} />
      <Stack.Screen name="LiveScoring" component={LiveScoringScreen} options={liveScoringOptions} />
      <Stack.Screen name="Scorecard" component={ScorecardScreen} options={{ title: "Scorecard" }} />
      <Stack.Screen name="PlayerStats" component={PlayerStatsScreen} options={{ title: "Player Stats" }} />
    </Stack.Navigator>
  );
}

function TournamentsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="TournamentsList" component={TournamentsScreen} options={{ title: "Tournaments" }} />
      <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} options={{ title: "Create Tournament" }} />
      <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} options={{ title: "Tournament" }} />
      <Stack.Screen name="ScheduleMatch" component={ScheduleMatchScreen} options={{ title: "Schedule Match" }} />
      <Stack.Screen name="MatchSetup" component={MatchSetupScreen} options={{ title: "Match Setup" }} />
      <Stack.Screen name="EditMatch" component={EditMatchScreen} options={{ title: "Edit Match" }} />
      <Stack.Screen name="Corrections" component={CorrectionsScreen} options={{ title: "Captain Corrections" }} />
      <Stack.Screen name="LiveScoring" component={LiveScoringScreen} options={liveScoringOptions} />
      <Stack.Screen name="Scorecard" component={ScorecardScreen} options={{ title: "Scorecard" }} />
      <Stack.Screen name="PlayerStats" component={PlayerStatsScreen} options={{ title: "Player Stats" }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={tabOptions("Home", "🏠")} />
      <Tab.Screen name="Players" component={PlayersStack} options={tabOptions("Players", "🧑")} />
      <Tab.Screen name="Teams" component={TeamsStack} options={tabOptions("Teams", "👥")} />
      <Tab.Screen name="Matches" component={MatchesStack} options={tabOptions("Matches", "🏏")} />
      <Tab.Screen name="Tournaments" component={TournamentsStack} options={tabOptions("Tourneys", "🏆")} />
      <Tab.Screen name="MyStats" component={MyStatsScreen} options={tabOptions("My Stats", "📊")} />
      <Tab.Screen name="Profile" component={ProfileStack} options={tabOptions("Profile", "👤")} />
    </Tab.Navigator>
  );
}
