// On the web build, React Native's Alert.alert does nothing, so every confirmation ("Delete?") and
// every error message would silently vanish. This puts a browser dialog in its place. On the phone
// apps it does nothing at all.
import { Alert, Platform } from "react-native";

// Pure helper, kept separate so it can be tested: shows `buttons` using the given alert / confirm functions.
export function runAlert(title, message, buttons, show) {
  const text = [title, message].filter(Boolean).join("\n\n");
  const list = Array.isArray(buttons) && buttons.length ? buttons : [{ text: "OK" }];
  const call = (b) => { if (b && typeof b.onPress === "function") b.onPress(); };
  if (list.length === 1) {
    show.alert(text);
    call(list[0]);
    return;
  }
  const cancel = list.find((b) => b.style === "cancel");
  const actions = list.filter((b) => b !== cancel);
  // One action: OK runs it, Cancel runs the cancel button. Several: offer each in turn.
  for (const b of actions) {
    const q = actions.length === 1 ? text : `${text}\n\nPress OK to choose: ${b.text}`;
    if (show.confirm(q)) {
      call(b);
      return;
    }
  }
  call(cancel);
}

if (Platform.OS === "web" && typeof window !== "undefined" && Alert) {
  Alert.alert = (title, message, buttons) =>
    runAlert(title, message, buttons, { alert: (t) => window.alert(t), confirm: (t) => window.confirm(t) });
}
