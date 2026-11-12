// When you switch to another tab while the scoring screen is open, put that tab back on its list, so coming back
// to Matches shows the list of matches and not the old scoring page. (The same for the schedule form: by the time
// the tab is left the person has agreed to drop the draft - see draftGuard.js.)
// (Used as the tab's `listeners`.) { type: "POP_TO_TOP" } is what StackActions.popToTop() gives.
export const leaveScoring = ({ navigation, route }) => ({
  blur: () => {
    const tabRoute = navigation.getState().routes.find((r) => r.key === route.key);
    const st = tabRoute && tabRoute.state;
    const top = st && st.routes && st.routes[st.index];
    if (top && (top.name === "LiveScoring" || top.name === "ScheduleMatch") && st.key) {
      navigation.dispatch({ type: "POP_TO_TOP", target: st.key });
    }
  },
});
