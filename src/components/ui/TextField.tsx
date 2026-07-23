import { useState, type ReactNode } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps
} from "react-native";

import { colors } from "@/theme/colors";
import { radii, sizes, spacing, typography } from "@/theme/tokens";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

type TextFieldProps = TextInputProps & {
  disabled?: boolean;
  endAdornment?: ReactNode;
  error?: string;
  helperText?: string;
  label?: string;
  leadingIcon?: IconName;
};

export function TextField({
  disabled = false,
  endAdornment,
  error,
  helperText,
  label,
  leadingIcon,
  multiline,
  onBlur,
  onFocus,
  style,
  editable,
  accessibilityLabel,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          error && styles.fieldError,
          disabled && styles.fieldDisabled
        ]}
      >
        {leadingIcon ? <Icon name={leadingIcon} color={focused ? "primary" : "textTertiary"} /> : null}
        <TextInput
          {...props}
          accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
          accessibilityState={{ disabled }}
          editable={!disabled && editable !== false}
          multiline={multiline}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, multiline && styles.inputMultiline, style]}
        />
        {endAdornment}
      </View>
      {error || helperText ? (
        <Text variant="caption" color={error ? "danger" : "textTertiary"}>
          {error ?? helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  field: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: sizes.controlLarge,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs
  },
  fieldMultiline: {
    alignItems: "flex-end",
    minHeight: 64,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs
  },
  fieldFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    paddingLeft: spacing.md - 1,
    paddingRight: spacing.xs - 1
  },
  fieldError: {
    borderColor: colors.danger
  },
  fieldDisabled: {
    backgroundColor: colors.surfaceSubtle,
    opacity: 0.6
  },
  input: {
    color: colors.text,
    flex: 1,
    minWidth: 0,
    padding: 0,
    ...typography.body
  },
  inputMultiline: {
    maxHeight: 120,
    minHeight: sizes.touchTarget,
    paddingTop: 11,
    textAlignVertical: "top"
  }
});
