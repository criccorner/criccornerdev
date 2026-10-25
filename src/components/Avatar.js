import React, { useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import { colors } from "../utils/theme";

// Shows the player's photo, or their initial on a green circle if there's no
// photo (or it fails to load).
export default function Avatar({ uri, name, size = 64 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  const radius = size / 2;
  if (uri && !failed) {
    return <Image source={{ uri }} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.border }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: size * 0.42 }}>{(name || "?").trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}
