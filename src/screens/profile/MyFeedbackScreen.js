import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthContext";
import { listMyFeedback } from "../../admin/store";
import Card from "../../components/Card";
import Badge, { STATUS_COLORS } from "../../components/Badge";
import Button from "../../components/Button";
import { colors, spacing, typography, radius } from "../../utils/theme";

export default function MyFeedbackScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listMyFeedback(user.id).then((r) => alive && setItems(r));
      return () => {
        alive = false;
      };
    }, [user.id])
  );

  return (
    <View style={styles.container}>
      <View style={{ padding: spacing.md, paddingBottom: 0 }}>
        <Button title="+ New Issue / Suggestion" onPress={() => navigation.navigate("Feedback")} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={<Text style={[typography.muted, { textAlign: "center", marginTop: spacing.xl }]}>You haven't submitted anything yet.</Text>}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <View style={{ flexDirection: "row" }}>
                <Badge label={item.type.toUpperCase()} color={item.type === "Issue" ? colors.danger : colors.info} />
                <Badge label={item.status.toUpperCase()} color={STATUS_COLORS[item.status]} />
              </View>
              <Text style={typography.muted}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={[typography.body, { marginTop: spacing.sm }]}>{item.detail}</Text>
            {item.reply ? (
              <View style={styles.reply}>
                <Text style={typography.label}>REPLY FROM {(item.repliedBy || "ADMIN").toUpperCase()}</Text>
                <Text style={[typography.body, { marginTop: 4 }]}>{item.reply}</Text>
              </View>
            ) : null}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reply: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.background, borderLeftWidth: 3, borderLeftColor: colors.primary },
});
