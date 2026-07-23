import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";
import { radii, sizes, spacing } from "@/theme/tokens";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

type ChipProps = {
  active?: boolean;
  icon?: IconName;
  label: string;
  onPress?: () => void;
};

export function Chip({ active = false, icon, label, onPress }: ChipProps) {
  const content = (
    <>
      {icon ? <Icon name={icon} size="sm" color={active ? "primary" : "textTertiary"} /> : null}
      <Text variant="label" color={active ? "primary" : "textSecondary"}>
        {label}
      </Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.base, active && styles.active]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.base, active && styles.active, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xxs,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.sm
  },
  active: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.surfaceAccentStrong
  },
  pressed: {
    opacity: 0.68
  }
});
