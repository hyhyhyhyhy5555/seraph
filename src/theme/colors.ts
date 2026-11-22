export const colors = {
  background: "#F4F3EE",
  surface: "#FCFBF7",
  surfaceRaised: "#FFFFFF",
  surfaceSubtle: "#ECEBE5",
  surfaceAccent: "#EEFFD2",
  surfaceAccentStrong: "#C9F36A",
  primary: "#171A16",
  primaryPressed: "#2B3028",
  primarySoft: "#E2E5DC",
  onPrimary: "#FAFFF4",
  text: "#171A16",
  textSecondary: "#555B51",
  textTertiary: "#7A8175",
  border: "#D9DAD3",
  borderStrong: "#BFC3B8",
  success: "#286343",
  successSoft: "#DFF3E6",
  danger: "#A13D35",
  dangerSoft: "#F8E3E0",
  warning: "#785713",
  warningSoft: "#F7EBC7",
  signal: "#B9F34A",
  signalInk: "#26320F"
} as const;

export type ColorToken = keyof typeof colors;
