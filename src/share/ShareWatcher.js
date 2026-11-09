import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { navigationRef } from "../navigation/navRef";
import { useAllState } from "../context/AppContext";
import { SHARE_TARGETS, getPendingShare, subscribePendingShare, clearPendingShare, loadPendingShare } from "./links";

const LISTS = { player: "players", team: "teams", match: "matches", tournament: "tournaments" };

// Lives inside the logged-in app. When a share link has been opened, it shows that player / team / match /
// tournament (everything can be viewed, only the owner can change it).
export default function ShareWatcher() {
  const [share, setShare] = useState(getPendingShare());
  const all = useAllState();

  useEffect(() => {
    const off = subscribePendingShare(setShare);
    loadPendingShare();
    return off;
  }, []);

  useEffect(() => {
    if (!share || !all.hydrated) return undefined;
    let tries = 0;
    let timer;
    const go = () => {
      if (!navigationRef.isReady()) {
        if (++tries < 20) timer = setTimeout(go, 250);
        return;
      }
      const found = (all[LISTS[share.kind]] || []).some((x) => x.id === share.id);
      clearPendingShare();
      if (!found) {
        Alert.alert("Not found", "This page isn't available. It may have been deleted, or it hasn't reached this phone yet. Pull to refresh and try the link again.");
        return;
      }
      const [tab, screen, param] = SHARE_TARGETS[share.kind];
      navigationRef.navigate(tab, { screen, params: { [param]: share.id } });
    };
    timer = setTimeout(go, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share, all.hydrated]);

  return null;
}
