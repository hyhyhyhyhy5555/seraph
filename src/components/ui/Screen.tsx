import type { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";
import { useResponsiveLayout } from "@/theme/responsive";
import { sizes, spacing } from "@/theme/tokens";

type ScreenProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
  scroll?: boolean;
};

export function Screen({
  children,
  contentContainerStyle,
  keyboardShouldPersistTaps,
  scroll = false
}: ScreenProps) {
  const { horizontalPadding, isCompact } = useResponsiveLayout();
  const responsiveContentStyle = {
    paddingHorizontal: horizontalPadding,
    paddingTop: isCompact ? spacing.md : spacing.xl
  };

  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, responsiveContentStyle, styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          style={styles.scroll}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.content, responsiveContentStyle, styles.fixedContent, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  scroll: {
    flex: 1
  },
  content: {
    alignSelf: "center",
    maxWidth: sizes.contentMaxWidth,
    width: "100%"
  },
  scrollContent: {
    paddingBottom: spacing.xxxl
  },
  fixedContent: {
    flex: 1,
    paddingBottom: spacing.md
  }
});
