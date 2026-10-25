import { useEffect, useRef } from "react";
import { useAllState, useAppDispatch, useSync } from "../context/AppContext";
import { playerMatchesUser } from "./identity";

// Every account should have a player entry (so they can be picked for teams and
// matches). We wait for the first successful download from the cloud so we don't
// create a second one when it already exists on the server.
export default function SeedSelf({ user }) {
  const { hydrated, players } = useAllState();
  const { lastSync } = useSync();
  const dispatch = useAppDispatch();
  const done = useRef(false);

  useEffect(() => {
    if (!hydrated || !lastSync || done.current) return;
    done.current = true;
    if (players.some((p) => playerMatchesUser(p, user))) return;
    dispatch({
      type: "ADD_PLAYER",
      payload: { name: user.name, phone: user.phone || null, email: user.email || user.identifier, role: user.role },
    });
  }, [hydrated, lastSync]);

  return null;
}
