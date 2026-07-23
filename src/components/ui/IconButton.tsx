import { Pressable, StyleSheet } from "react-native";
import type { PressableProps } from "react-native";

import { colors, type ColorToken } from "@/theme/colors";
import { radii, sizes } from "@/theme/tokens";

import { Icon, type IconName, type IconSize } from "./Icon";

type IconButtonProps = Omit<PressableProps, "children" | "style"> & {
  accessibilityLabel: string;
  color?: ColorToken;
  icon: IconName;
  iconSize?: IconSize | number;
  variant?: "plain" | "soft" | "primary";
};

export function IconButton({
  accessibilityLabel,
  color,
  icon,
  iconSize = "md",
  variant = "plain",
  disabled,
  ...props
}: IconButtonProps) {
  const isDisabled = Boolean(disabled);
  const iconColor = color ?? (variant === "primary" ? "onPrimary" : "primary");

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        variant === "soft" && styles.soft,
        variant === "primary" && styles.primary,
        pressed && styles.pressed,
        isDisabled && styles.disabled
      ]}
    >
      <Icon name={icon} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radii.md,
    height: sizes.touchTarget,
    justifyContent: "center",
    width: sizes.touchTarget
  },
  soft: {
    backgroundColor: colors.primarySoft
  },
  primary: {
    backgroundColor: colors.primary
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }]
  },
  disabled: {
    opacity: 0.4
  }
});
