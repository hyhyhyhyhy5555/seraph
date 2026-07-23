import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";
import { radii, spacing } from "@/theme/tokens";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

type EmptyStateProps = {
  description: string;
  icon?: IconName;
  title: string;
};

export function EmptyState({ description, icon = "file-tray-outline", title }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconFrame}>
        <Icon name={icon} size="lg" color="primary" />
      </View>
      <View style={styles.copy}>
        <Text variant="bodyStrong" style={styles.centered}>
          {title}
        </Text>
        <Text color="textSecondary" style={styles.centered}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  copy: {
    gap: spacing.xxs
  },
  centered: {
    textAlign: "center"
  }
});
