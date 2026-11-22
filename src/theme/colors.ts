import { DynamicColorIOS, Platform, PlatformColor, type ColorValue } from "react-native";

const definitions = {
  background: { light: "#FFFFFF", dark: "#0F0F0F", android: "?android:attr/colorBackground" },
  surface: { light: "#F5F5F5", dark: "#171717", android: "?android:attr/colorBackground" },
  surfaceRaised: { light: "#FFFFFF", dark: "#1F1F1F", android: "?android:attr/colorBackgroundFloating" },
  surfaceSubtle: { light: "#F4F4F4", dark: "#242424", android: "?android:attr/colorBackground" },
  surfaceAccent: { light: "#F5F5F5", dark: "#222222", android: "?android:attr/colorBackground" },
  surfaceAccentStrong: { light: "#222222", dark: "#EBEBEB" },
  primary: { light: "#222222", dark: "#FFFFFF", android: "?android:attr/textColorPrimary" },
  primaryPressed: { light: "#3A3A3A", dark: "#E0E0E0", android: "?android:attr/textColorPrimary" },
  primarySoft: { light: "#F4F4F4", dark: "#262626", android: "?android:attr/colorBackground" },
  onPrimary: { light: "#FFFFFF", dark: "#111111", android: "?android:attr/colorBackground" },
  text: { light: "#222222", dark: "#F5F5F5", android: "?android:attr/textColorPrimary" },
  textSecondary: { light: "#4E4E4E", dark: "#B8B8B8", android: "?android:attr/textColorSecondary" },
  textTertiary: { light: "#666666", dark: "#969696", android: "?android:attr/textColorTertiary" },
  border: { light: "#EBEBEB", dark: "#2B2B2B", android: "?android:attr/textColorTertiary" },
  borderStrong: { light: "#CCCCCC", dark: "#454545", android: "?android:attr/textColorSecondary" },
  success: { light: "#1F6E4A", dark: "#6FD6A0" },
  successSoft: { light: "#EDF7F2", dark: "#162E22" },
  danger: { light: "#C83428", dark: "#FF857A" },
  dangerSoft: { light: "#FDEEEC", dark: "#361917" },
  warning: { light: "#875308", dark: "#F0C36D" },
  warningSoft: { light: "#FDF5E6", dark: "#332610" },
  signal: { light: "#222222", dark: "#FFFFFF" },
  signalInk: { light: "#FFFFFF", dark: "#111111" }
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
