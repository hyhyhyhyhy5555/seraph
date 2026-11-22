import { Platform } from "react-native";

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
  xxxl: 56
} as const;

export const radii = {
  xxs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  pill: 999
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: "800", letterSpacing: -1.1 },
  title: { fontSize: 22, lineHeight: 29, fontWeight: "700", letterSpacing: -0.45 },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: "700", letterSpacing: -0.25 },
  body: { fontSize: 15, lineHeight: 23, fontWeight: "400" },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "700" },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600", letterSpacing: -0.1 },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "500" }
} as const;

export const sizes = {
  touchTarget: 44,
  control: 48,
  controlLarge: 56,
  contentMaxWidth: 1080,
  navigationRail: 220
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0
    },
    android: { elevation: 0 },
    default: {
      boxShadow: "none"
    }
  }) ?? {}
} as const;
