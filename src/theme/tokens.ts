import { Platform } from "react-native";

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40
} as const;

export const radii = {
  xxs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: "800" },
  title: { fontSize: 22, lineHeight: 29, fontWeight: "800" },
  heading: { fontSize: 18, lineHeight: 25, fontWeight: "700" },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "700" },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "500" }
} as const;

export const sizes = {
  touchTarget: 44,
  control: 48,
  controlLarge: 56,
  contentMaxWidth: 760
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: "#142536",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.08,
      shadowRadius: 14
    },
    android: { elevation: 2 },
    default: {
      boxShadow: "0 5px 20px rgba(20, 37, 54, 0.08)"
    }
  }) ?? {}
} as const;
