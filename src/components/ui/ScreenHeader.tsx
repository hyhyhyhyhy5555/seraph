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
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
          </View>
          <Text variant="label">SERAPH</Text>
        </View>
        {action}
      </View>
      <View style={styles.heroRow}>
        <View style={styles.copy}>
          <Text variant="label" color="textTertiary" style={styles.eyebrow}>
            {eyebrow}
          </Text>
          <Text variant="display">{title}</Text>
          <Text color="textSecondary" style={styles.description}>{description}</Text>
        </View>
        <View style={styles.iconFrame}>
          <Icon name={icon} size={30} color="primary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
    marginBottom: spacing.xxl
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  brandDot: {
    backgroundColor: colors.signal,
    borderRadius: radii.pill,
    height: 9,
    width: 9
  },
  heroRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between"
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: colors.signal,
    borderRadius: radii.xl,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    maxWidth: 700
  },
  eyebrow: {
    letterSpacing: 1.6
  },
  description: {
    maxWidth: 620
  }
});
