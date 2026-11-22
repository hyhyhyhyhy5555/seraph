import { DynamicColorIOS, Platform, PlatformColor, type ColorValue } from "react-native";

const definitions = {
  background: { light: "#F4F3EE", dark: "#10120F", android: "?android:attr/colorBackground" },
  surface: { light: "#FCFBF7", dark: "#181B17", android: "?android:attr/colorBackground" },
  surfaceRaised: { light: "#FFFFFF", dark: "#20241F", android: "?android:attr/colorBackgroundFloating" },
  surfaceSubtle: { light: "#ECEBE5", dark: "#272B25", android: "?android:attr/colorBackground" },
  surfaceAccent: { light: "#EEFFD2", dark: "#233019", android: "?android:attr/colorBackground" },
  surfaceAccentStrong: { light: "#C9F36A", dark: "#405D22" },
  primary: { light: "#171A16", dark: "#F0F4EA", android: "?android:attr/textColorPrimary" },
  primaryPressed: { light: "#2B3028", dark: "#D7DDCF", android: "?android:attr/textColorPrimary" },
  primarySoft: { light: "#E2E5DC", dark: "#30362D", android: "?android:attr/colorBackground" },
  onPrimary: { light: "#FAFFF4", dark: "#11140F", android: "?android:attr/colorBackground" },
  text: { light: "#171A16", dark: "#F0F4EA", android: "?android:attr/textColorPrimary" },
  textSecondary: { light: "#555B51", dark: "#B9C0B2", android: "?android:attr/textColorSecondary" },
  textTertiary: { light: "#6B7267", dark: "#949D8E", android: "?android:attr/textColorTertiary" },
  border: { light: "#D9DAD3", dark: "#343A32", android: "?android:attr/textColorTertiary" },
  borderStrong: { light: "#BFC3B8", dark: "#515A4D", android: "?android:attr/textColorSecondary" },
  success: { light: "#286343", dark: "#78D49C" },
  successSoft: { light: "#DFF3E6", dark: "#183B28" },
  danger: { light: "#A13D35", dark: "#FF9A91" },
  dangerSoft: { light: "#F8E3E0", dark: "#4A2320" },
  warning: { light: "#785713", dark: "#E6C76E" },
  warningSoft: { light: "#F7EBC7", dark: "#403615" },
  signal: { light: "#B9F34A", dark: "#B9F34A" },
  signalInk: { light: "#26320F", dark: "#26320F" }
} as const;

export type ColorToken = keyof typeof definitions;
export type ThemeColorScheme = "light" | "dark";

function adaptive(name: ColorToken, definition: typeof definitions[ColorToken]): ColorValue {
  if (Platform.OS === "ios") return DynamicColorIOS({ light: definition.light, dark: definition.dark });
  if (Platform.OS === "android" && "android" in definition) return PlatformColor(definition.android);
  if (Platform.OS === "web") return `var(--seraph-${name}, ${definition.light})`;
  return definition.light;
}

export const colors = Object.fromEntries(
  Object.entries(definitions).map(([name, definition]) => [name, adaptive(name as ColorToken, definition)])
) as Record<ColorToken, ColorValue>;

export const webThemeColors = Object.fromEntries(
  Object.entries(definitions).map(([name, definition]) => [name, { light: definition.light, dark: definition.dark }])
) as Record<ColorToken, Record<ThemeColorScheme, string>>;
