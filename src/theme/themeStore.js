import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEMES, DEFAULT_THEME, applyTheme } from "../utils/theme";

// The theme is a setting of this phone (not of the account), so it is kept in
// local storage and applied before the rest of the app loads.
const KEY = "criccorner.theme.v1";

export async function savedThemeName() {
  try {
    const n = await AsyncStorage.getItem(KEY);
    return THEMES[n] ? n : DEFAULT_THEME;
  } catch (e) {
    return DEFAULT_THEME;
  }
}

export async function loadSavedTheme() {
  return applyTheme(await savedThemeName());
}

export async function saveTheme(name) {
  if (!THEMES[name]) return false;
  try {
    await AsyncStorage.setItem(KEY, name);
    return true;
  } catch (e) {
    return false;
  }
}
