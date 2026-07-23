import { Pressable, StyleSheet, View } from "react-native";

import { Card, Icon, SectionHeader, Text, type IconName } from "@/components/ui";
import { colors } from "@/theme/colors";
import { radii, spacing } from "@/theme/tokens";

type NamedItem = {
  id: string;
  name: string;
};

type CategoryGridProps<T extends NamedItem> = {
  getIcon?: (item: T) => IconName;
  getMeta: (item: T) => string;
  items: T[];
  onPress: (item: T) => void;
  title: string;
};

export function CategoryGrid<T extends NamedItem>({
  getIcon,
  getMeta,
  items,
  onPress,
  title
}: CategoryGridProps<T>) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} count={items.length} />
      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable
            accessibilityHint={`${getMeta(item)} 항목 열기`}
            accessibilityLabel={item.name}
            accessibilityRole="button"
            key={item.id}
            onPress={() => onPress(item)}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <Card padding="md" style={styles.card}>
              <View style={styles.iconFrame}>
                <Icon name={getIcon?.(item) ?? "folder-open-outline"} color="primary" />
              </View>
              <View style={styles.copy}>
                <Text variant="bodyStrong" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {getMeta(item)}
                </Text>
              </View>
              <Icon name="chevron-forward" size="sm" color="textTertiary" />
            </Card>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  item: {
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 150
  },
  itemPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }]
  },
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 88
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0
  }
});
