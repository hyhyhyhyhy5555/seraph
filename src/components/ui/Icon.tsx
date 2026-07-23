import { Ionicons } from "@expo/vector-icons";

import { colors, type ColorToken } from "@/theme/colors";

export type IconName = keyof typeof Ionicons.glyphMap;
export type IconSize = "sm" | "md" | "lg" | "xl";

const iconSizes: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28
};

export type IconProps = {
  color?: ColorToken;
  name: IconName;
  size?: IconSize | number;
};

export function Icon({ name, size = "md", color = "textSecondary" }: IconProps) {
  return (
    <Ionicons
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      name={name}
      size={typeof size === "number" ? size : iconSizes[size]}
      color={colors[color]}
    />
  );
}
