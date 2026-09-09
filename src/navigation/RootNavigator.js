import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { colors } from "../utils/theme";

import HomeScreen from "../screens/HomeScreen";
import PlayersScreen from "../screens/PlayersScreen";
import AddPlayerScreen from "../screens/AddPlayerScreen";
import TeamsScreen from "../screens/TeamsScreen";
import CreateTeamScreen from "../screens/CreateTeamScreen";
import TeamDetailScreen from "../screens/TeamDetailScreen";
import MatchesScreen from "../screens/MatchesScreen";
import ScheduleMatchScreen from "../screens/ScheduleMatchScreen";
import MatchSetupScreen from "../screens/MatchSetupScreen";
import LiveScoringScreen from "../screens/LiveScoringScreen";
import ScorecardScreen from "../screens/ScorecardScreen";
import TournamentsScreen from "../screens/TournamentsScreen";
import CreateTournamentScreen from "../screens/CreateTournamentScreen";
import TournamentDetailScreen from "../screens/TournamentDetailScreen";

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

function PlayersStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PlayersList" component={PlayersScreen} options={{ title: "Players" }} />
      <Stack.Screen name="AddPlayer" component={AddPlayerScreen} options={{ title: "Add / Join Player" }} />
    </Stack.Navigator>
  );
}

function TeamsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="TeamsList" component={TeamsScreen} options={{ title: "Teams" }} />
      <Stack.Screen name="CreateTeam" component={CreateTeamScreen} options={{ title: "Create Team" }} />
      <Stack.Screen name="TeamDetail" component={TeamDetailScreen} options={{ title: "Team" }} />
    </Stack.Navigator>
  );
}

function MatchesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MatchesList" component={MatchesScreen} options={{ title: "Matches" }} />
      <Stack.Screen name="ScheduleMatch" component={ScheduleMatchScreen} options={{ title: "Schedule Match" }} />
      <Stack.Screen name="MatchSetup" component={MatchSetupScreen} options={{ title: "Match Setup" }} />
      <Stack.Screen name="LiveScoring" component={LiveScoringScreen} options={{ title: "Live Scoring", headerBackVisible: false }} />
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
      <Stack.Screen name="LiveScoring" component={LiveScoringScreen} options={{ title: "Live Scoring", headerBackVisible: false }} />
      <Stack.Screen name="Scorecard" component={ScorecardScreen} options={{ title: "Scorecard" }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: icon("🏠") }} />
      <Tab.Screen name="Players" component={PlayersStack} options={{ tabBarIcon: icon("🧑") }} />
      <Tab.Screen name="Teams" component={TeamsStack} options={{ tabBarIcon: icon("👥") }} />
      <Tab.Screen name="Matches" component={MatchesStack} options={{ tabBarIcon: icon("🏏") }} />
      <Tab.Screen name="Tournaments" component={TournamentsStack} options={{ tabBarIcon: icon("🏆") }} />
    </Tab.Navigator>
  );
}
