import { Alert } from "react-native";
import { leaveScoring } from "./leaveScoring";

// Remembers whether an unsaved draft (the schedule-match form) is open, so leaving it can be confirmed.
let dirty = false;
const listeners = new Set();

export const setDraftDirty = (v) => { dirty = !!v; };
export const isDraftDirty = () => dirty;
// The form clears itself when the person agrees to throw the draft away.
export const onDraftDiscard = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export function discardDraft() {
  dirty = false;
  listeners.forEach((f) => { try { f(); } catch (e) {} });
}

export const LEAVE_TITLE = "Leave this page?";
export const LEAVE_MESSAGE = "If you don't save, this scheduled match draft will be lost. Are you sure you want to move away?";

export function confirmLeave(onYes) {
  Alert.alert(LEAVE_TITLE, LEAVE_MESSAGE, [
    { text: "No", style: "cancel" },
    { text: "Yes", style: "destructive", onPress: onYes },
  ]);
}

// Used as the tab navigator's screenListeners: stops a tab switch while a draft is open, until the person says Yes.
export const guardTabs = ({ navigation, route }) => ({
  ...leaveScoring({ navigation, route }), // leaving a tab puts it back on its list page
  tabPress: (e) => {
    if (!dirty || navigation.isFocused()) return;
    e.preventDefault();
    confirmLeave(() => {
      discardDraft();
      navigation.navigate(route.name);
    });
  },
});
