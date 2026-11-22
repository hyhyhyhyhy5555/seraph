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
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  pill: 999
} as const;

export const typography = {
  display: { fontSize: 36, lineHeight: 42, fontWeight: "800", letterSpacing: -1.4 },
  title: { fontSize: 24, lineHeight: 31, fontWeight: "800", letterSpacing: -0.6 },
  heading: { fontSize: 18, lineHeight: 25, fontWeight: "800", letterSpacing: -0.25 },
  body: { fontSize: 15, lineHeight: 23, fontWeight: "400" },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "700" },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "800", letterSpacing: 0.15 },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "600" }
} as const;

export const sizes = {
  touchTarget: 44,
  control: 50,
  controlLarge: 60,
  contentMaxWidth: 1080,
  navigationRail: 220
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: "#171A16",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24
    },
    android: { elevation: 2 },
    default: {
      boxShadow: "0 12px 40px rgba(23, 26, 22, 0.07)"
    }
  }) ?? {}
} as const;
