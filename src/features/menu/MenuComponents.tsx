import { Pressable, StyleSheet, View } from "react-native";

import { Badge, Card, Icon, Text, type IconName } from "@/components/ui";
import { colors } from "@/theme/colors";
import { radii, spacing } from "@/theme/tokens";

export type MenuItemData = {
  description: string;
  icon: IconName;
  id: string;
  title: string;
};

export function AppSummaryCard() {
  return (
    <Card variant="tinted" padding="lg" style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Icon name="book-outline" size="lg" color="primary" />
      </View>
      <View style={styles.summaryCopy}>
        <Text variant="caption" color="primary">
          현재 버전
        </Text>
        <Text variant="title">Seraph MVP</Text>
        <Text variant="caption" color="textSecondary">
          설명서 탐색과 AI 질의를 한곳에서
        </Text>
      </View>
      <Badge label="초기 설계" tone="success" />
    </Card>
  );
}

type MenuListProps = {
  items: MenuItemData[];
};

export function MenuList({ items }: MenuListProps) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Pressable
          accessibilityLabel={`${item.title}, ${item.description}`}
          accessibilityRole="button"
          key={item.id}
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
        >
          <View style={styles.menuIcon}>
            <Icon name={item.icon} color="primary" />
          </View>
          <View style={styles.menuCopy}>
            <Text variant="bodyStrong">{item.title}</Text>
            <Text variant="caption" color="textSecondary">
              {item.description}
            </Text>
          </View>
          <Icon name="chevron-forward" color="textTertiary" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  menuItem: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 80,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  menuIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  menuCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0
  },
  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.99 }]
  }
});
