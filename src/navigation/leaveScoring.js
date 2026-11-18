// When you switch to another tab, put the tab you left back on its list page, so coming back to Matches / Players /
// Teams / Tournaments shows the list and not the details page you had opened. (The same for the schedule form: by the time
// the tab is left the person has agreed to drop the draft - see draftGuard.js.)
// (Used as the tab's `listeners`.) { type: "POP_TO_TOP" } is what StackActions.popToTop() gives.
export const leaveScoring = ({ navigation, route }) => ({
  blur: () => {
    const tabRoute = navigation.getState().routes.find((r) => r.key === route.key);
    const st = tabRoute && tabRoute.state;
    const top = st && st.routes && st.routes[st.index];
    if (top && st.index > 0 && st.key) {
      navigation.dispatch({ type: "POP_TO_TOP", target: st.key });
    }
    // A jump like navigate("Matches", { screen: "Notifications" }) leaves { screen } on the tab; clear it, or the tab
    // re-opens that screen every time it is shown again.
    const p = tabRoute && tabRoute.params;
    if (p && (p.screen || p.params || p.initial !== undefined)) {
      navigation.dispatch({ type: "SET_PARAMS", payload: { params: { screen: undefined, params: undefined, initial: undefined } }, source: route.key });
    }
  },
});
