import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppDispatch, useAllState, useSync } from "../context/AppContext";
import { findLocalWorkspaces, readWorkspace, markImported, findOldPhotos } from "../cloud/importLocal";
import { useAuth } from "../auth/AuthContext";
import { setPhotoFromUri } from "../profile/store";
import Avatar from "../components/Avatar";
import { addMissing } from "../cloud/sync";
import Card from "../components/Card";
import Button from "../components/Button";
import { colors, spacing, typography } from "../utils/theme";

// One-time: copy teams, players, matches and tournaments that were saved on
// THIS phone by the old version of the app up to the shared online database.
export default function ImportLocalScreen() {
  const state = useAllState();
  const dispatch = useAppDispatch();
  const { lastSync, syncNow } = useSync();
  const { user, refreshUser } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [photoBusy, setPhotoBusy] = useState(null);
  const [found, setFound] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      findLocalWorkspaces().then(setFound);
      findOldPhotos().then(setPhotos);
    }, [])
  );

  const upload = (w) => {
    Alert.alert(
      "Upload to the cloud?",
      `This copies ${w.counts.players} players, ${w.counts.teams} teams, ${w.counts.matches} matches and ${w.counts.tournaments} tournaments so every player can see them. Items you upload belong to you. Nothing on this phone is deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upload",
          onPress: async () => {
            setBusy(true);
            try {
              const data = await readWorkspace(w.key);
              const { added } = addMissing(state, data);
              dispatch({ type: "IMPORT_DOCS", payload: data });
              await markImported(w.key);
              syncNow();
              setMessage(added ? `Added ${added} items. They are uploading now.` : "Everything in this data was already here.");
              setFound(await findLocalWorkspaces());
            } catch (e) {
              setMessage("Couldn't read the saved data on this phone.");
            }
            setBusy(false);
          },
        },
      ]
    );
  };

  const chooseOldPhoto = async (p) => {
    setPhotoBusy(p.uri);
    const r = await setPhotoFromUri(user.id, p.uri);
    setPhotoBusy(null);
    if (!r.ok) {
      setMessage(r.error);
      return;
    }
    await refreshUser();
    setMessage("Profile picture updated.");
  };

  // The picture from the account that used the same mobile number comes first.
  const myDigits = (user && user.phone ? user.phone : "").replace(/\D/g, "");
  const orderedPhotos = [...photos].sort((a, b) => {
    const m = (x) => (myDigits && String(x.identifier || "").replace(/\D/g, "").endsWith(myDigits.slice(-9)) ? 0 : 1);
    return m(a) - m(b);
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={typography.h2}>Upload data from this phone</Text>
      <Text style={[typography.muted, { marginTop: spacing.xs }]}>
        Before this update, your teams, matches and players were saved only on this phone. Upload them once so everyone can see them.
      </Text>
      {!lastSync ? <Text style={[typography.muted, { marginTop: spacing.md, color: colors.danger }]}>Connecting to the cloud… wait a moment, then come back.</Text> : null}
      {message ? <Text style={[typography.body, { marginTop: spacing.md, color: colors.success }]}>{message}</Text> : null}

      {found === null ? null : found.length === 0 ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={typography.body}>No older data found on this phone.</Text>
        </Card>
      ) : (
        found.map((w) => (
          <Card key={w.key} style={{ marginTop: spacing.md }}>
            <Text style={typography.h3}>{w.label}</Text>
            <Text style={[typography.body, { marginTop: spacing.xs }]}>
              {w.counts.players} players · {w.counts.teams} teams · {w.counts.matches} matches · {w.counts.tournaments} tournaments
            </Text>
            {w.imported ? <Text style={[typography.muted, { marginTop: spacing.xs }]}>Already uploaded from this phone.</Text> : null}
            <View style={{ marginTop: spacing.md }}>
              <Button title={w.imported ? "Upload again" : "Upload to cloud"} onPress={() => upload(w)} loading={busy} disabled={!lastSync} />
            </View>
          </Card>
        ))
      )}

      {orderedPhotos.length > 0 ? (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={typography.h2}>Old profile pictures</Text>
          <Text style={[typography.muted, { marginTop: spacing.xs }]}>These were saved on this phone by the old version. Pick one to use on your account.</Text>
          {orderedPhotos.map((p) => (
            <Card key={p.uri} style={{ marginTop: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Avatar uri={p.uri} name={p.name} size={64} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={typography.h3}>{p.name || "Old account"}</Text>
                  <Text style={typography.muted}>{p.identifier}</Text>
                </View>
              </View>
              <View style={{ marginTop: spacing.md }}>
                <Button title="Use as my profile picture" onPress={() => chooseOldPhoto(p)} loading={photoBusy === p.uri} />
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
