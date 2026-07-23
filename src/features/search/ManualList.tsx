import { Linking, StyleSheet, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  SectionHeader,
  Text
} from "@/components/ui";
import type { Manual } from "@/data/manualCatalog";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/tokens";

type ManualListProps = {
  emptyDescription: string;
  emptyTitle: string;
  manuals: Manual[];
  title: string;
};

export function ManualList({
  emptyDescription,
  emptyTitle,
  manuals,
  title
}: ManualListProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} count={manuals.length} />
      {manuals.length > 0 ? (
        <View style={styles.list}>
          {manuals.map((manual) => (
            <ManualCard key={manual.id} manual={manual} />
          ))}
        </View>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} icon="search-outline" />
      )}
    </View>
  );
}

type ManualCardProps = {
  manual: Manual;
};

function ManualCard({ manual }: ManualCardProps) {
  return (
    <Card variant="elevated" padding="lg">
      <View style={styles.cardHeader}>
        <View style={styles.documentIcon}>
          <Icon name="document-text-outline" color="primary" />
        </View>
        <View style={styles.headerCopy}>
          <Text variant="caption" color="primary" numberOfLines={1}>
            {manual.categoryPath.join("  /  ")}
          </Text>
          <Text variant="heading">{manual.title}</Text>
        </View>
        <Badge label={manual.manufacturer} />
      </View>

      <Text color="textSecondary" style={styles.summary}>
        {manual.summary}
      </Text>

      <View style={styles.footer}>
        <View style={styles.model}>
          <Icon name="hardware-chip-outline" size="sm" color="textTertiary" />
          <Text variant="caption" color="textSecondary">
            {manual.model}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            label="원문"
            variant="link"
            size="sm"
            trailingIcon="open-outline"
            onPress={() => void Linking.openURL(manual.sourceUrl)}
          />
          <Button
            label="PDF"
            variant="secondary"
            size="sm"
            leadingIcon="document-outline"
            onPress={() => void Linking.openURL(manual.pdfUrl)}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl
  },
  list: {
    gap: spacing.sm
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  },
  documentIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0
  },
  summary: {
    marginTop: spacing.md
  },
  footer: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm
  },
  model: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxs
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxs
  }
});
