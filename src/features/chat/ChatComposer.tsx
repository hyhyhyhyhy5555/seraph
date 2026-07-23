import { StyleSheet, View } from "react-native";

import { IconButton, Text, TextField } from "@/components/ui";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/tokens";

type ChatComposerProps = {
  disabled: boolean;
  onChangeText: (value: string) => void;
  onSend: () => void;
  value: string;
};

export function ChatComposer({ disabled, onChangeText, onSend, value }: ChatComposerProps) {
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <TextField
        accessibilityLabel="설명서에 대해 질문하기"
        endAdornment={
          <IconButton
            accessibilityLabel={disabled ? "답변 생성 중" : "메시지 전송"}
            disabled={!canSend}
            icon="arrow-up"
            onPress={onSend}
            variant="primary"
          />
        }
        multiline
        onChangeText={onChangeText}
        placeholder="제품명이나 증상을 질문해보세요"
        returnKeyType="send"
        value={value}
      />
      <Text variant="caption" color="textTertiary" style={styles.hint}>
        등록된 설명서를 바탕으로 답변하며, 중요한 내용은 원문도 함께 확인해주세요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xxs,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm
  },
  hint: {
    paddingHorizontal: spacing.xxs,
    textAlign: "center"
  }
});
