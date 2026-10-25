import React from "react";
import { Pressable, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../utils/theme";

import HomeScreen from "../screens/HomeScreen";
import PlayersScreen from "../screens/PlayersScreen";
import AddPlayerScreen from "../screens/AddPlayerScreen";
import EditPlayerScreen from "../screens/EditPlayerScreen";
import TeamsScreen from "../screens/TeamsScreen";
import CreateTeamScreen from "../screens/CreateTeamScreen";
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

function icon(emoji) {
  return () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;
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
    </Stack.Navigator>
  );
}

function TeamsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="TeamsList" component={TeamsScreen} options={{ title: "Teams" }} />
      <Stack.Screen name="CreateTeam" component={CreateTeamScreen} options={{ title: "Create Team" }} />
      <Stack.Screen name="TeamDetail" component={TeamDetailScreen} options={{ title: "Team" }} />
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
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarLabelStyle: { fontSize: 10 }, // 7 tabs: keep the labels small enough to fit
        tabBarAllowFontScaling: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: icon("🏠") }} />
      <Tab.Screen name="Players" component={PlayersStack} options={{ tabBarIcon: icon("🧑") }} />
      <Tab.Screen name="Teams" component={TeamsStack} options={{ tabBarIcon: icon("👥") }} />
      <Tab.Screen name="Matches" component={MatchesStack} options={{ tabBarIcon: icon("🏏") }} />
      <Tab.Screen name="Tournaments" component={TournamentsStack} options={{ tabBarIcon: icon("🏆") }} />
      <Tab.Screen name="MyStats" component={MyStatsScreen} options={{ tabBarLabel: "My Stats", tabBarIcon: icon("📊") }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarIcon: icon("👤") }} />
    </Tab.Navigator>
  );
}
