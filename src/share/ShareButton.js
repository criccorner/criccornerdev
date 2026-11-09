/* global navigator */
import React from "react";
import { Text, Pressable, Share, Alert, Platform } from "react-native";
import { colors } from "../utils/theme";
import { buildShareLink, shareMessage } from "./links";

// Opens the phone's usual share sheet (WhatsApp, Gmail, Messages...). On a browser without one, copies the link.
export async function shareEntity(kind, id, name) {
  const link = buildShareLink(kind, id);
  if (!link) return;
  const message = shareMessage(kind, name, link);
  try {
    if (Platform.OS === "web") {
      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (nav && nav.share) return await nav.share({ title: name || "CricCorner", text: message, url: link });
      if (nav && nav.clipboard) {
        await nav.clipboard.writeText(link);
        return Alert.alert("Link copied", "Paste it into WhatsApp, email or any message.");
      }
      return Alert.alert("Share this link", link);
    }
    await Share.share({ message, title: name || "CricCorner" });
  } catch (e) {
    if (e && e.name === "AbortError") return; // the person closed the share sheet
    Alert.alert("Couldn't open sharing", "Please try again.");
  }
}

export default function ShareButton({ kind, id, name, label = "🔗 Share", style }) {
  return (
    <Pressable onPress={() => shareEntity(kind, id, name)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Share ${name || kind}`} style={style}>
      <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
