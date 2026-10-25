import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import FixContactsScreen from "../screens/FixContactsScreen";
import ThemeScreen from "../screens/ThemeScreen";
import ImportLocalScreen from "../screens/ImportLocalScreen";
import FeedbackScreen from "../screens/profile/FeedbackScreen";
import MyFeedbackScreen from "../screens/profile/MyFeedbackScreen";
import AdminHomeScreen from "../screens/admin/AdminHomeScreen";
import AdminFeedbackScreen from "../screens/admin/AdminFeedbackScreen";
import AdminFeedbackDetailScreen from "../screens/admin/AdminFeedbackDetailScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AdminUserEditScreen from "../screens/admin/AdminUserEditScreen";
import DeleteAccountScreen from "../screens/profile/DeleteAccountScreen";
import ChangePasswordScreen from "../screens/profile/ChangePasswordScreen";
import LegalScreen from "../screens/LegalScreen";
import HelpScreen from "../screens/HelpScreen";
import { colors } from "../utils/theme";

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" },
};

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Change Password" }} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ title: "Delete Account" }} />
      <Stack.Screen name="Legal" component={LegalScreen} options={{ title: "Terms & Copyright" }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ title: "Help" }} />
      <Stack.Screen name="Theme" component={ThemeScreen} options={{ title: "App Theme" }} />
      <Stack.Screen name="ImportLocal" component={ImportLocalScreen} options={{ title: "Upload Data From This Phone" }} />
      <Stack.Screen name="FixContacts" component={FixContactsScreen} options={{ title: "Fix Duplicate Contacts" }} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: "Issue / Suggestion" }} />
      <Stack.Screen name="MyFeedback" component={MyFeedbackScreen} options={{ title: "My Submissions" }} />
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: "Admin Panel" }} />
      <Stack.Screen name="AdminFeedback" component={AdminFeedbackScreen} options={{ title: "Issues & Suggestions" }} />
      <Stack.Screen name="AdminFeedbackDetail" component={AdminFeedbackDetailScreen} options={{ title: "Review" }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: "Registered Users" }} />
      <Stack.Screen name="AdminUserEdit" component={AdminUserEditScreen} options={{ title: "Edit User" }} />
    </Stack.Navigator>
  );
}
