import { StyleSheet, View } from "react-native";

import { Badge, Card, Icon, Text, type IconName } from "@/components/ui";
import { colors } from "@/theme/colors";
import { radii, spacing } from "@/theme/tokens";

export type MenuItemData = {
  description: string;
  icon: IconName;
  id: string;
  status: string;
  title: string;
};

export function AppSummaryCard() {
  return (
    <Card variant="outlined" padding="lg" style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Icon name="book-outline" size="lg" color="primary" />
      </View>
      <View style={styles.summaryCopy}>
        <Text variant="caption" color="signal">
          SERAPH / EARLY ACCESS
        </Text>
        <Text variant="title" color="onPrimary">문서를 근거로 답하는 도구</Text>
        <Text variant="caption" color="onPrimary">
          검색 · 원문 확인 · 근거 기반 AI 질의
        </Text>
      </View>
      <Badge label="로컬 환경" tone="warning" />
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
        <View
          accessibilityLabel={`${item.title}, ${item.description}, ${item.status}`}
          key={item.id}
          style={styles.menuItem}
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
          <Badge label={item.status} tone="success" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    gap: spacing.md
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: colors.signal,
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
    borderRadius: radii.md,
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
  }
});
