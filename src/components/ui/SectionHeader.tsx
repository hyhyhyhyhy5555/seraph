import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme/tokens";

import { Badge } from "./Badge";
import { Text } from "./Text";

type SectionHeaderProps = {
  action?: ReactNode;
  count?: number;
  description?: string;
  title: string;
};

export function SectionHeader({ action, count, description, title }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleArea}>
        <View style={styles.titleRow}>
          <Text variant="heading">{title}</Text>
          {typeof count === "number" ? <Badge label={`${count}`} tone="neutral" /> : null}
        </View>
        {description ? (
          <Text variant="caption" color="textSecondary">
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm
  },
  titleArea: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  }
});
