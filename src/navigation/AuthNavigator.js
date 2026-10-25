import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyScreen from "../screens/auth/VerifyScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import LegalScreen from "../screens/LegalScreen";
import HelpScreen from "../screens/HelpScreen";
import { colors } from "../utils/theme";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: "#fff", headerTitle: "", headerShadowVisible: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Verify" component={VerifyScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} options={{ headerTitle: "Terms & Copyright" }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ headerTitle: "Help", headerStyle: { backgroundColor: colors.primary } }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
