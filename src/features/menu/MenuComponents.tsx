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
        <Text variant="caption" color="onPrimary" style={styles.summaryEyebrow}>
          SERAPH / EARLY ACCESS
        </Text>
        <Text variant="title" color="onPrimary">문서를 근거로 답하는 도구</Text>
        <Text variant="caption" color="onPrimary" style={styles.summarySubtitle}>
          검색 · 원문 확인 · 근거 기반 AI 질의
        </Text>
      </View>
      <Badge label="로컬 환경" tone="neutral" />
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
    borderRadius: radii.lg,
    gap: spacing.md
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: colors.onPrimary,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0
  },
  summaryEyebrow: {
    opacity: 0.72
  },
  summarySubtitle: {
    opacity: 0.84
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  menuItem: {
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  menuIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  menuCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0
  }
});
