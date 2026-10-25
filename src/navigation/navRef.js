import { createNavigationContainerRef } from "@react-navigation/native";

// Lets code outside a screen (like the invite-link handler) move the app to a screen.
export const navigationRef = createNavigationContainerRef();
