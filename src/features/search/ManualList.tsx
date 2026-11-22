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
import type { ManualSummary } from "@/lib/api";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/tokens";

type ManualListProps = {
  emptyDescription: string;
  emptyTitle: string;
  loading?: boolean;
  manuals: ManualSummary[];
  onAskManual?: (manual: ManualSummary) => void;
  title: string;
};

export function ManualList({
  emptyDescription,
  emptyTitle,
  loading = false,
  manuals,
  onAskManual,
  title
}: ManualListProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} count={manuals.length} />
      {loading ? (
        <Card variant="elevated" padding="lg">
          <Text color="textSecondary">등록된 설명서를 불러오는 중입니다...</Text>
        </Card>
      ) : manuals.length > 0 ? (
        <View style={styles.list}>
          {manuals.map((manual) => (
            <ManualCard key={manual.id} manual={manual} onAskManual={onAskManual} />
          ))}
        </View>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} icon="search-outline" />
      )}
    </View>
  );
}

type ManualCardProps = {
  manual: ManualSummary;
  onAskManual?: (manual: ManualSummary) => void;
};

function ManualCard({ manual, onAskManual }: ManualCardProps) {
  const manufacturerLabel = manual.manufacturer?.name ?? "제조사 미상";
  const isSample = manual.sourceType === "sample";
  const isPending = manual.ingestionStatus === "pending";
  const badgeTone = isSample ? "neutral" : isPending ? "warning" : "success";
  const badgeLabel = isSample
    ? `샘플 · ${manufacturerLabel}`
    : isPending
      ? `대기 · ${manufacturerLabel}`
      : `PDF · ${manufacturerLabel}`;
  const pathLabel = manual.manufacturer
    ? `${manual.category.name}  /  ${manual.manufacturer.name}`
    : manual.category.name;

  return (
    <Card variant="outlined" padding="lg" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.documentIcon}>
          <Icon name="document-text-outline" color="primary" />
        </View>
        <View style={styles.headerCopy}>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {pathLabel}
          </Text>
          <Text variant="heading">{manual.title}</Text>
        </View>
        <Badge label={badgeLabel} tone={badgeTone} />
      </View>

      <Text color="textSecondary" style={styles.summary}>
        {manual.summary?.trim() || "등록된 사용설명서 전문이 검색과 AI 근거 답변에 연결되어 있습니다."}
      </Text>

      <View style={styles.footer}>
        <View style={styles.model}>
          <Icon name="hardware-chip-outline" size="sm" color="textTertiary" />
          <Text variant="caption" color="textSecondary">
            {manual.modelName ?? "공용 모델"}
          </Text>
        </View>
        <View style={styles.actions}>
          {manual.sourceUrl ? (
            <Button
              label="원문"
              variant="link"
              size="sm"
              trailingIcon="open-outline"
              onPress={() => void Linking.openURL(manual.sourceUrl!)}
            />
          ) : null}
          {manual.pdfUrl ? (
            <Button
              label="PDF"
              variant="secondary"
              size="sm"
              leadingIcon="document-outline"
              onPress={() => void Linking.openURL(manual.pdfUrl!)}
            />
          ) : null}
          {onAskManual ? (
            <Button
              label="AI 질문"
              variant="primary"
              size="sm"
              leadingIcon="sparkles-outline"
              onPress={() => onAskManual(manual)}
            />
          ) : null}
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
  card: {
    borderColor: colors.border
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  },
  documentIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
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
    flexWrap: "wrap",
    gap: spacing.xs
  }
});
