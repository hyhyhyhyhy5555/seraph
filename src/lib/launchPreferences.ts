import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const APP_LANDING_SEEN_KEY = "@seraph/app-landing-seen";
const WEB_LAST_ACTIVE_KEY = "@seraph/web-last-active-at";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function shouldShowLanding() {
  if (Platform.OS !== "web") {
    return (await AsyncStorage.getItem(APP_LANDING_SEEN_KEY)) !== "true";
  }

  const stored = await AsyncStorage.getItem(WEB_LAST_ACTIVE_KEY);
  const lastActiveAt = stored ? Number(stored) : Number.NaN;
  const isExpired = !Number.isFinite(lastActiveAt) || Date.now() - lastActiveAt >= THIRTY_DAYS_MS;

  if (!isExpired) await AsyncStorage.setItem(WEB_LAST_ACTIVE_KEY, String(Date.now()));
  return isExpired;
}

export async function completeLanding() {
  const key = Platform.OS === "web" ? WEB_LAST_ACTIVE_KEY : APP_LANDING_SEEN_KEY;
  const value = Platform.OS === "web" ? String(Date.now()) : "true";
  await AsyncStorage.setItem(key, value);
}
