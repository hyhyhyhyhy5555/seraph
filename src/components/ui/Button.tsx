import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";

import { colors } from "@/theme/colors";
import { radii, sizes, spacing } from "@/theme/tokens";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  leadingIcon?: IconName;
  loading?: boolean;
  size?: ButtonSize;
  trailingIcon?: IconName;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
};

const palette = {
  primary: {
    background: colors.primary,
    border: colors.primary,
    text: "onPrimary" as const,
    icon: "onPrimary" as const
  },
  secondary: {
    background: colors.surface,
    border: colors.borderStrong,
    text: "text" as const,
    icon: "primary" as const
  },
  ghost: {
    background: "transparent",
    border: "transparent",
    text: "textSecondary" as const,
    icon: "textSecondary" as const
  },
  link: {
    background: "transparent",
    border: "transparent",
    text: "primary" as const,
    icon: "primary" as const
  }
};

export function Button({
  label,
  leadingIcon,
  loading = false,
  size = "md",
  trailingIcon,
  variant = "primary",
  disabled,
  accessibilityLabel,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantPalette = palette[variant];

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        {
          backgroundColor: variantPalette.background,
          borderColor: variantPalette.border
        },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[variantPalette.text]} size="small" />
      ) : (
        <View style={styles.content}>
          {leadingIcon ? <Icon name={leadingIcon} size="sm" color={variantPalette.icon} /> : null}
          <Text color={variantPalette.text} variant="label">
            {label}
          </Text>
          {trailingIcon ? <Icon name={trailingIcon} size="sm" color={variantPalette.icon} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: sizes.touchTarget
  },
  sm: {
    paddingHorizontal: spacing.sm
  },
  md: {
    minHeight: sizes.control,
    paddingHorizontal: spacing.md
  },
  lg: {
    minHeight: sizes.controlLarge,
    paddingHorizontal: spacing.lg
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }]
  },
  disabled: {
    opacity: 0.45
  }
});
