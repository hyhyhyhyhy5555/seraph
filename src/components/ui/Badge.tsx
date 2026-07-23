import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";
import { radii, spacing } from "@/theme/tokens";

import { Text } from "./Text";

type BadgeTone = "accent" | "neutral" | "success" | "warning";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

const toneStyles = {
  accent: { backgroundColor: colors.primarySoft, color: "primary" as const },
  neutral: { backgroundColor: colors.surfaceSubtle, color: "textSecondary" as const },
  success: { backgroundColor: colors.successSoft, color: "success" as const },
  warning: { backgroundColor: colors.warningSoft, color: "warning" as const }
};

export function Badge({ label, tone = "accent" }: BadgeProps) {
  const toneStyle = toneStyles[tone];

  return (
    <View style={[styles.base, { backgroundColor: toneStyle.backgroundColor }]}>
      <Text variant="caption" color={toneStyle.color} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  text: {
    fontWeight: "700"
  }
});
