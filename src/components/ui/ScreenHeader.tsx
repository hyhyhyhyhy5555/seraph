import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";
import { useResponsiveLayout } from "@/theme/responsive";
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
  const { isCompact, isFoldable } = useResponsiveLayout();
  const isNarrow = isCompact || isFoldable;
  return (
    <View style={[styles.container, isNarrow && styles.containerNarrow]}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
          </View>
          <Text variant="label">SERAPH</Text>
        </View>
        {action}
      </View>
      <View style={[styles.heroRow, isNarrow && styles.heroRowNarrow]}>
        <View style={styles.copy}>
          <Text variant="label" color="textTertiary" style={styles.eyebrow}>
            {eyebrow}
          </Text>
          <Text variant="display">{title}</Text>
          <Text color="textSecondary" style={styles.description}>{description}</Text>
        </View>
        <View style={[styles.iconFrame, isNarrow && styles.iconFrameNarrow]}>
          <Icon name={icon} size={30} color="primary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.lg,
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg
  },
  containerNarrow: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md
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
    height: 26,
    justifyContent: "center",
    width: 26
  },
  brandDot: {
    backgroundColor: colors.onPrimary,
    borderRadius: radii.pill,
    height: 8,
    width: 8
  },
  heroRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between"
  },
  heroRowNarrow: {
    alignItems: "flex-start"
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  iconFrameNarrow: {
    height: 44,
    width: 44
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    maxWidth: 700
  },
  eyebrow: {
    letterSpacing: 1.2
  },
  description: {
    maxWidth: 620
  }
});
