import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@cricket_scorer_state_v1";

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("loadState failed", e);
    return null;
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("saveState failed", e);
  }
}

export async function clearState() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("clearState failed", e);
  }
}
