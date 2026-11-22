import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Icon, Text } from "@/components/ui";
import { getCategories, getManuals, type Category, type ManualSummary } from "@/lib/api";
import { colors } from "@/theme/colors";
import { useResponsiveLayout } from "@/theme/responsive";
import { radii, sizes, spacing } from "@/theme/tokens";

type DeviceIntakeProps = {
  onIssueSelect: (issue: string) => void;
  onManualSelect: (manual?: ManualSummary) => void;
  selectedManual?: ManualSummary;
};

const issues = ["오류가 떠요", "사용 방법", "청소·관리", "부품·필터 교체"];

export function DeviceIntake({ onIssueSelect, onManualSelect, selectedManual }: DeviceIntakeProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const [manuals, setManuals] = useState<ManualSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { isCompact } = useResponsiveLayout();

  useEffect(() => {
    void getCategories()
      .then((items) => setCategories(items.flatMap((item) => item.children.length ? item.children : [item]).filter((item) => item.manualCount > 0)))
      .finally(() => setLoading(false));
  }, []);

  async function selectCategory(category: Category) {
    setSelectedCategory(category);
    onManualSelect(undefined);
    setManuals([]);
    try {
      setManuals(await getManuals(category.id));
    } catch {
      setManuals([]);
    }
  }

  return (
    <View style={styles.panel}>
      <View style={styles.headingRow}>
        <View style={styles.stepBadge}><Text variant="caption" color="onPrimary">1</Text></View>
        <View style={styles.headingCopy}>
          <Text variant="heading">어느 기기에서 막히셨나요?</Text>
          <Text color="textSecondary">제품을 고르면 더 정확한 설명서에서 답을 찾을 수 있어요.</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {loading ? <Text color="textTertiary">기기 목록을 불러오는 중…</Text> : categories.map((category) => (
          <ChoiceChip
            key={category.id}
            label={`${category.name} ${category.manualCount}`}
            selected={selectedCategory?.id === category.id}
            onPress={() => void selectCategory(category)}
          />
        ))}
        <ChoiceChip label="잘 모르겠어요" selected={false} onPress={() => setSelectedCategory(undefined)} />
      </ScrollView>

      {selectedCategory ? (
        <View style={styles.section}>
          <Text variant="label" color="textSecondary">제품을 선택해주세요 · 선택하지 않아도 질문할 수 있어요</Text>
          <View style={[styles.choiceGrid, isCompact && styles.choiceGridCompact]}>
            {manuals.slice(0, isCompact ? 6 : 8).map((manual) => (
              <ChoiceChip
                key={manual.id}
                label={manual.modelName || manual.title}
                selected={selectedManual?.id === manual.id}
                onPress={() => onManualSelect(manual)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {selectedCategory || selectedManual ? (
        <View style={styles.section}>
          <Text variant="label" color="textSecondary">어떤 도움이 필요하세요?</Text>
          <View style={styles.choiceGrid}>
            {issues.map((issue) => <ChoiceChip key={issue} label={issue} selected={false} onPress={() => onIssueSelect(issue)} />)}
          </View>
        </View>
      ) : null}

      <View style={styles.skipRow}>
        <Icon name="chatbubble-ellipses-outline" size="sm" color="textTertiary" />
        <Text variant="caption" color="textTertiary">기기를 모르겠다면 아래에 증상부터 바로 적어도 괜찮아요.</Text>
      </View>
    </View>
  );
}

function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.chipPressed]}
    >
      <Text variant="label" color={selected ? "onPrimary" : "text"}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  headingRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm },
  stepBadge: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radii.pill, height: 28, justifyContent: "center", width: 28 },
  headingCopy: { flex: 1, gap: spacing.xxs },
  chipRow: { gap: spacing.xs, paddingRight: spacing.sm },
  chip: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.borderStrong, borderRadius: radii.pill, borderWidth: 1, justifyContent: "center", minHeight: sizes.touchTarget, paddingHorizontal: spacing.md },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipPressed: { opacity: 0.72 },
  section: { gap: spacing.xs },
  choiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  choiceGridCompact: { flexDirection: "column" },
  skipRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs }
});
