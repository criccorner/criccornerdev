import React, { useEffect, useRef, useState } from "react";
import { Pressable } from "react-native";
import { colors } from "../utils/theme";

// A Pressable that lights up the moment it is touched and stays lit for half a second, so a scorer can
// see that a tap registered. The colour is read from the current theme every render, so it follows
// theme changes. children can be a function: children(lit) -> node, to restyle the text while lit.
export const FLASH_MS = 500;

export default function FlashPressable({ onPress, style, children, flashMs = FLASH_MS, ...rest }) {
  const [lit, setLit] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const flash = () => {
    setLit(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLit(false), flashMs);
  };

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => { flash(); if (rest.onPressIn) rest.onPressIn(e); }}
      onPress={(e) => { flash(); if (onPress) onPress(e); }}
      style={[style, lit && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      {typeof children === "function" ? children(lit) : children}
    </Pressable>
  );
}
