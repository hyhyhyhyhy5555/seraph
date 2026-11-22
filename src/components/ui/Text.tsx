import {
  StyleSheet,
  Text as NativeText,
  type TextProps as NativeTextProps,
  type TextStyle
} from "react-native";

import { colors, type ColorToken } from "@/theme/colors";
import { useResponsiveLayout } from "@/theme/responsive";
import { typography } from "@/theme/tokens";

export type TextVariant = keyof typeof typography;

export type TextProps = NativeTextProps & {
  color?: ColorToken;
  variant?: TextVariant;
};

export function Text({
  color = "text",
  variant = "body",
  style,
  ...props
}: TextProps) {
  const { fontScale } = useResponsiveLayout();
  const variantStyle = typography[variant];
  const fontFamily = variantStyle.fontWeight === "400"
    ? "Pretendard"
    : variantStyle.fontWeight === "500"
      ? "PretendardMedium"
      : variantStyle.fontWeight === "600"
        ? "PretendardSemiBold"
        : "PretendardBold";

  return (
    <NativeText
      {...props}
      style={[
        styles.base,
        variantStyle as TextStyle,
        {
          color: colors[color],
          fontFamily,
          fontSize: variantStyle.fontSize * fontScale,
          lineHeight: variantStyle.lineHeight * fontScale
        },
        style
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    fontWeight: "normal"
  }
});
