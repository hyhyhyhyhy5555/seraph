import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";
import { radii, spacing } from "@/theme/tokens";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

type ScreenHeaderProps = {
  action?: ReactNode;
  description: string;
  eyebrow: string;
  icon: IconName;
  title: string;
};

export function ScreenHeader({ action, description, eyebrow, icon, title }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.iconFrame}>
          <Icon name={icon} size="lg" color="primary" />
        </View>
        {action}
      </View>
      <View style={styles.copy}>
        <Text variant="label" color="primary">
          {eyebrow}
        </Text>
        <Text variant="display">{title}</Text>
        <Text color="textSecondary">{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginBottom: spacing.xl
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  copy: {
    gap: spacing.xs
  }
});
