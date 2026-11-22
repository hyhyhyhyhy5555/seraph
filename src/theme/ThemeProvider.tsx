import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Appearance, Platform, useColorScheme } from "react-native";

import { webThemeColors, type ThemeColorScheme } from "./colors";

export type ThemePreference = "system" | "light" | "dark";

const THEME_KEY = "@seraph/theme-preference";

type ThemeContextValue = {
  colorScheme: "light" | "dark";
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyPreference(preference: ThemePreference, systemScheme: ThemeColorScheme) {
  if (Platform.OS !== "web") {
    Appearance.setColorScheme(preference === "system" ? "auto" : preference);
  }
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const activeScheme = preference === "system" ? systemScheme : preference;
    document.documentElement.style.colorScheme = activeScheme;
    for (const [name, palette] of Object.entries(webThemeColors)) {
      document.documentElement.style.setProperty(`--seraph-${name}`, palette[activeScheme]);
    }
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    void AsyncStorage.getItem(THEME_KEY).then((stored) => {
      const next = stored === "light" || stored === "dark" ? stored : "system";
      setPreferenceState(next);
    });
  }, []);

  useEffect(() => {
    applyPreference(preference, systemScheme ?? "light");
  }, [preference, systemScheme]);

  async function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  }

  const value = useMemo<ThemeContextValue>(() => ({
    colorScheme: preference === "system" ? (systemScheme ?? "light") : preference,
    preference,
    setPreference
  }), [preference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
