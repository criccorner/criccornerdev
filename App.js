import "react-native-gesture-handler";
import "./src/utils/webAlert";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { loadSavedTheme } from "./src/theme/themeStore";

// The saved theme must be applied BEFORE any screen is loaded (screens read the
// theme when they load), so the real app is required only after that.
export default function App() {
  const [Root, setRoot] = useState(null);

  useEffect(() => {
    let alive = true;
    loadSavedTheme().finally(() => {
      if (alive) setRoot(() => require("./src/AppRoot").default);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!Root) {
    return (
      <View style={{ flex: 1, backgroundColor: "#01365C", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }
  return <Root />;
}
