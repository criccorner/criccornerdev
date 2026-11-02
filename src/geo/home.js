// "Where am I?" for the Other tournaments list: the city picked on this phone, else the city on the profile.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { searchCities } from "./cities";

const KEY = "@criccorner_home_city_v1";

export async function loadHomeCity(user) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw);
      if (v && v.name) return v;
    }
  } catch (e) {}
  const text = user && user.city ? String(user.city).trim() : "";
  if (text.length >= 3) {
    try {
      const r = await searchCities(text);
      if (r[0]) {
        const v = { name: r[0].name, label: r[0].label, lat: r[0].lat, lng: r[0].lng };
        AsyncStorage.setItem(KEY, JSON.stringify(v)).catch(() => {});
        return v;
      }
    } catch (e) {}
  }
  return null;
}

export async function saveHomeCity(v) {
  try {
    if (v) await AsyncStorage.setItem(KEY, JSON.stringify(v));
    else await AsyncStorage.removeItem(KEY);
  } catch (e) {}
}
