import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon, Screen, ScreenHeader, Text } from "@/components/ui";
import { colors } from "@/theme/colors";
import { useTheme, type ThemePreference } from "@/theme/ThemeProvider";
import { radii, sizes, spacing } from "@/theme/tokens";

const themeOptions: { id: ThemePreference; label: string; description: string; icon: "phone-portrait-outline" | "sunny-outline" | "moon-outline" }[] = [
  { id: "system", label: "시스템 설정", description: "기기의 화면 모드를 따라갑니다.", icon: "phone-portrait-outline" },
  { id: "light", label: "라이트", description: "항상 밝은 화면으로 표시합니다.", icon: "sunny-outline" },
  { id: "dark", label: "다크", description: "항상 어두운 화면으로 표시합니다.", icon: "moon-outline" }
];

export default function SettingsScreen() {
  const router = useRouter();
  const { preference, setPreference } = useTheme();

  return (
    <Screen scroll>
      <ScreenHeader eyebrow="PREFERENCES" title="내게 편한 방식으로." description="화면 모드와 서비스 소개 화면을 관리할 수 있습니다." icon="settings-outline" />
      <View style={styles.section}>
        <Text variant="heading">화면 모드</Text>
        <View style={styles.optionList}>
          {themeOptions.map((option) => {
            const selected = preference === option.id;
            return (
              <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => void setPreference(option.id)} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
                <View style={[styles.iconFrame, selected && styles.iconFrameSelected]}><Icon name={option.icon} color={selected ? "signalInk" : "primary"} /></View>
                <View style={styles.optionCopy}><Text variant="bodyStrong">{option.label}</Text><Text variant="caption" color="textSecondary">{option.description}</Text></View>
                <Icon name={selected ? "checkmark-circle" : "ellipse-outline"} color={selected ? "success" : "textTertiary"} />
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.section}>
        <Text variant="heading">서비스 안내</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/landing")} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
          <View style={styles.iconFrame}><Icon name="book-outline" color="primary" /></View>
          <View style={styles.optionCopy}><Text variant="bodyStrong">랜딩페이지</Text><Text variant="caption" color="textSecondary">Seraph가 어떻게 답을 찾는지 다시 확인합니다.</Text></View>
          <Icon name="chevron-forward" color="textTertiary" />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, marginBottom: spacing.xl },
  optionList: { gap: spacing.xs },
  option: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, minHeight: 76, padding: spacing.md },
  optionSelected: { backgroundColor: colors.surfaceAccent, borderColor: colors.surfaceAccentStrong },
  iconFrame: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: radii.sm, height: sizes.touchTarget, justifyContent: "center", width: sizes.touchTarget },
  iconFrameSelected: { backgroundColor: colors.signal },
  optionCopy: { flex: 1, gap: spacing.xxs },
  pressed: { opacity: 0.72 }
});
