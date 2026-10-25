import React from "react";
import { View, Text } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { colors, spacing, typography } from "../../utils/theme";

// Wrap any admin screen: non-admins see a message instead of the content.
export default function AdminGuard({ children }) {
  const { user } = useAuth();
  if (!user?.isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: colors.background }}>
        <Text style={typography.h3}>Administrator access required</Text>
      </View>
    );
  }
  return children;
}
