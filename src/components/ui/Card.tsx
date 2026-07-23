import { StyleSheet, View, type ViewProps } from "react-native";

import { colors } from "@/theme/colors";
import { radii, shadows, spacing } from "@/theme/tokens";

type CardProps = ViewProps & {
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "outlined" | "elevated" | "tinted";
};

export function Card({
  padding = "md",
  variant = "outlined",
  style,
  ...props
}: CardProps) {
  return (
    <View
      {...props}
      style={[
        styles.base,
        styles[variant],
        padding !== "none" && styles[`padding_${padding}`],
        style
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg
  },
  outlined: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1
  },
  elevated: {
    backgroundColor: colors.surfaceRaised,
    ...shadows.card
  },
  tinted: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.surfaceAccentStrong,
    borderWidth: 1
  },
  padding_sm: {
    padding: spacing.sm
  },
  padding_md: {
    padding: spacing.md
  },
  padding_lg: {
    padding: spacing.lg
  }
});
