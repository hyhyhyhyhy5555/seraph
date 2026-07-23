export const colors = {
  background: "#F3F6FA",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceSubtle: "#F7F9FC",
  surfaceAccent: "#EAF3FB",
  surfaceAccentStrong: "#D9EAF8",
  primary: "#1D5F99",
  primaryPressed: "#154B79",
  primarySoft: "#E4F0FA",
  onPrimary: "#FFFFFF",
  text: "#142536",
  textSecondary: "#526476",
  textTertiary: "#8190A0",
  border: "#DCE4EC",
  borderStrong: "#BFCBD7",
  success: "#1D7A5A",
  successSoft: "#E5F5EF",
  danger: "#B54040",
  dangerSoft: "#FCECEC",
  warning: "#9A6518",
  warningSoft: "#FFF4DF"
} as const;

export type ColorToken = keyof typeof colors;
