import {
  StyleSheet,
  Text as NativeText,
  type TextProps as NativeTextProps,
  type TextStyle
} from "react-native";

import { colors, type ColorToken } from "@/theme/colors";
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
  return (
    <NativeText
      {...props}
      style={[styles.base, typography[variant] as TextStyle, { color: colors[color] }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false
  }
});
