import { useEffect, useState } from "react";
import { navigationRef } from "../navigation/navRef";
import { getPendingInvite, subscribePendingInvite, clearPendingInvite, loadPendingInvite } from "./links";

// Lives inside the logged-in app. When an invite link has been opened, it takes
// the player to the Join Team screen.
export default function InviteWatcher() {
  const [inv, setInv] = useState(getPendingInvite());

  useEffect(() => {
    const off = subscribePendingInvite(setInv);
    loadPendingInvite();
    return off;
  }, []);

  useEffect(() => {
    if (!inv) return undefined;
    let tries = 0;
    const go = () => {
      if (navigationRef.isReady()) {
        navigationRef.navigate("Teams", { screen: "JoinTeam", params: { teamId: inv.teamId, code: inv.code } });
        clearPendingInvite();
        return;
      }
      if (++tries < 20) timer = setTimeout(go, 250);
    };
    let timer = setTimeout(go, 150);
    return () => clearTimeout(timer);
  }, [inv]);

  return null;
}
