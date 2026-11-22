import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Button, Icon, Text } from "@/components/ui";
import { completeLanding } from "@/lib/launchPreferences";
import { getLibraryStats, type LibraryStats } from "@/lib/api";
import { colors } from "@/theme/colors";
import { getLayoutTier } from "@/theme/responsive";
import { radii, sizes, spacing } from "@/theme/tokens";

const featureCopy = [
  ["01", "기기를 먼저 좁힙니다", "카테고리와 제품을 선택하면 관련 없는 설명서를 뒤지는 시간을 줄입니다."],
  ["02", "답마다 근거를 붙입니다", "검색한 매뉴얼 조각과 페이지를 함께 보여줘 중요한 내용은 원문에서 확인할 수 있습니다."],
  ["03", "모르는 제품도 질문합니다", "모델명을 모르더라도 증상부터 적으면 등록된 설명서 범위 안에서 단서를 찾습니다."]
] as const;

export default function LandingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const tier = getLayoutTier(width);
  const isCompact = tier === "compact" || tier === "foldable";
  const [stats, setStats] = useState<LibraryStats>();

  useEffect(() => {
    void getLibraryStats().then(setStats).catch(() => undefined);
  }, []);

  async function enterApp() {
    await completeLanding();
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={[styles.nav, { paddingHorizontal: isCompact ? 18 : 32 }]}>
          <View style={styles.brand}>
            <View style={styles.brandMark}><View style={styles.brandDot} /></View>
            <Text variant="label">SERAPH</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => void enterApp()} style={styles.navAction}>
            <Text variant="label">바로 시작</Text><Icon name="arrow-forward" size="sm" color="primary" />
          </Pressable>
        </View>

        <View style={[styles.hero, { minHeight: Math.max(height - 72, 620), paddingHorizontal: isCompact ? 18 : 32 }]}>
          <View style={styles.heroCopy}>
            <Text variant="label" color="textSecondary" style={styles.eyebrow}>MANUAL-FIRST ASSISTANT</Text>
            <Text variant="display" style={[styles.heroTitle, { fontSize: isCompact ? 40 : 68, lineHeight: isCompact ? 48 : 76 }]}>
              설명서를 찾는 시간을,{"\n"}해결하는 시간으로.
            </Text>
            <Text color="textSecondary" style={styles.heroDescription}>
              제품을 고르고 막힌 내용을 물어보세요. Seraph가 등록된 사용설명서에서 근거와 함께 답을 찾습니다.
            </Text>
            <View style={styles.heroActions}>
              <Button label="내 기기 질문하기" size="lg" trailingIcon="arrow-forward" onPress={() => void enterApp()} />
              <Text variant="caption" color="textTertiary">회원가입 없이 바로 시작할 수 있어요.</Text>
            </View>
          </View>
          <View style={styles.heroStage}>
            <View style={styles.stageBadge}><Icon name="sparkles" size={28} color="onPrimary" /></View>
            <View style={styles.questionStrip}><Text variant="bodyStrong" color="onPrimary">세탁기에 4C가 떠요</Text></View>
            <View style={styles.answerSheet}>
              <View style={styles.answerHeader}><View style={styles.answerDot} /><Text variant="label">설명서에서 찾은 답</Text></View>
              <View style={styles.answerLineWide} /><View style={styles.answerLine} /><View style={styles.answerLineShort} />
              <View style={styles.sourcePill}><Icon name="bookmark-outline" size="sm" color="primary" /><Text variant="caption" color="text">근거 페이지 연결됨</Text></View>
            </View>
          </View>
        </View>

        <View style={styles.proofBand}>
          <Text variant="caption" color="textSecondary">현재 연결된 지식</Text>
          <View style={styles.proofRow}>
            <Metric value={stats?.manualCount.toLocaleString() ?? "185"} label="등록 매뉴얼" />
            <Metric value={stats?.embeddedChunkCount.toLocaleString() ?? "10,253"} label="검색 가능한 청크" />
            <Metric value={stats?.categoryCount.toLocaleString() ?? "17"} label="제품 카테고리" />
          </View>
        </View>

        <View style={styles.storySection}>
          <Text variant="label" color="textTertiary">HOW IT WORKS</Text>
          <Text variant="display" style={styles.sectionTitle}>질문은 짧게.{"\n"}확인은 분명하게.</Text>
          <View style={styles.featureStack}>
            {featureCopy.map(([number, title, description], index) => (
              <View key={number} style={[styles.feature, index === 1 && styles.featureAccent]}>
                <Text variant="caption" color={index === 1 ? "onPrimary" : "textTertiary"}>{number}</Text>
                <View style={styles.featureCopy}>
                  <Text variant="title" color={index === 1 ? "onPrimary" : "text"}>{title}</Text>
                  <Text color={index === 1 ? "onPrimary" : "textSecondary"} style={index === 1 ? styles.invertedBody : undefined}>{description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.inversionSection}>
          <View style={styles.inversionCopy}>
            <Text variant="label" color="onPrimary" style={styles.invertedEyebrow}>GROUNDED, NOT GUESSED</Text>
            <Text variant="display" color="onPrimary" style={styles.sectionTitle}>그럴듯한 답보다,{"\n"}확인할 수 있는 답.</Text>
            <Text color="onPrimary" style={styles.invertedBody}>답변 아래의 출처에서 모델명과 페이지를 곧바로 확인하세요.</Text>
          </View>
          <View style={styles.citationStage}>
            <View style={styles.citationTop}><Icon name="document-text-outline" color="primary" /><Text variant="label" color="text">사용설명서 12쪽</Text></View>
            <Text variant="heading" color="text">급수 호스와 수도꼭지를 확인해주세요.</Text>
            <Text color="textSecondary">4C 오류는 정해진 시간 안에 물이 충분히 공급되지 않을 때 표시됩니다.</Text>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <View style={styles.ctaMark}><Icon name="book-outline" size={32} color="onPrimary" /></View>
          <Text variant="display" style={styles.ctaTitle}>막힌 순간에,{"\n"}설명서부터 연결합니다.</Text>
          <Button label="Seraph 시작하기" size="lg" trailingIcon="arrow-forward" onPress={() => void enterApp()} />
          <Text variant="caption" color="textTertiary">SERAPH · 등록된 설명서 범위에서 답합니다.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text variant="title">{value}</Text><Text variant="caption" color="textSecondary">{label}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  page: { backgroundColor: colors.background },
  nav: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", height: 68, justifyContent: "space-between", width: "100%" },
  brand: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  brandMark: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radii.sm, height: 28, justifyContent: "center", width: 28 },
  brandDot: { backgroundColor: colors.onPrimary, borderRadius: radii.pill, height: 8, width: 8 },
  navAction: { alignItems: "center", flexDirection: "row", gap: spacing.xs, minHeight: sizes.touchTarget },
  hero: { justifyContent: "space-between", overflow: "hidden", paddingBottom: 48, paddingTop: 52 },
  heroCopy: { gap: spacing.lg, maxWidth: 760, zIndex: 2 },
  eyebrow: { letterSpacing: 1.4 },
  heroTitle: { letterSpacing: -2.0, maxWidth: 820 },
  heroDescription: { fontSize: 17, lineHeight: 27, maxWidth: 600 },
  heroActions: { alignItems: "flex-start", gap: spacing.sm },
  heroStage: { alignSelf: "flex-end", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, height: 320, marginTop: 44, maxWidth: 880, padding: spacing.lg, position: "relative", width: "100%" },
  stageBadge: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radii.md, height: 64, justifyContent: "center", position: "absolute", right: spacing.lg, top: spacing.lg, width: 64, zIndex: 3 },
  questionStrip: { alignSelf: "flex-end", backgroundColor: colors.primary, borderRadius: radii.pill, marginRight: 76, marginTop: 20, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, zIndex: 2 },
  answerSheet: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, bottom: spacing.lg, gap: spacing.md, left: spacing.lg, padding: spacing.lg, position: "absolute", width: "82%" },
  answerHeader: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  answerDot: { backgroundColor: colors.primary, borderRadius: radii.pill, height: 8, width: 8 },
  answerLineWide: { backgroundColor: colors.surfaceSubtle, borderRadius: radii.sm, height: 12, width: "88%" },
  answerLine: { backgroundColor: colors.surfaceSubtle, borderRadius: radii.sm, height: 12, width: "70%" },
  answerLineShort: { backgroundColor: colors.surfaceSubtle, borderRadius: radii.sm, height: 12, width: "46%" },
  sourcePill: { alignItems: "center", alignSelf: "flex-start", backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  proofBand: { alignItems: "center", backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: 48 },
  proofRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xxl, justifyContent: "center" },
  metric: { alignItems: "center", minWidth: 140 },
  storySection: { alignSelf: "center", gap: spacing.xl, maxWidth: sizes.contentMaxWidth, paddingHorizontal: spacing.xl, paddingVertical: 96, width: "100%" },
  sectionTitle: { maxWidth: 700 },
  featureStack: { gap: spacing.md, marginTop: spacing.lg },
  feature: { alignItems: "flex-start", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", gap: spacing.xl, paddingVertical: spacing.xl },
  featureAccent: { backgroundColor: colors.primary, borderRadius: radii.lg, borderTopWidth: 0, paddingHorizontal: spacing.xl },
  featureCopy: { flex: 1, gap: spacing.xs, maxWidth: 620 },
  inversionSection: { alignItems: "center", backgroundColor: colors.primary, gap: 48, minHeight: 620, paddingHorizontal: spacing.xl, paddingVertical: 96 },
  inversionCopy: { alignSelf: "center", gap: spacing.lg, maxWidth: 820, width: "100%" },
  invertedEyebrow: { letterSpacing: 1.4, opacity: 0.72 },
  invertedBody: { opacity: 0.86 },
  citationStage: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, maxWidth: 760, padding: spacing.xl, width: "100%" },
  citationTop: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  ctaSection: { alignItems: "center", gap: spacing.xl, minHeight: 560, paddingHorizontal: spacing.xl, paddingVertical: 112 },
  ctaMark: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radii.md, height: 64, justifyContent: "center", width: 64 },
  ctaTitle: { maxWidth: 760, textAlign: "center" }
});
