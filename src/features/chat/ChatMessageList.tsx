import { useRef } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from "react-native";

import { Button, Card, Icon, Text } from "@/components/ui";
import type { RagCitation } from "@/lib/api";
import { colors } from "@/theme/colors";
import { radii, spacing } from "@/theme/tokens";

import type { ChatMessage } from "./types";

type ChatMessageListProps = {
  isSending: boolean;
  messages: ChatMessage[];
};

export function ChatMessageList({ isSending, messages }: ChatMessageListProps) {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.content}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isSending ? <LoadingMessage /> : null}
    </ScrollView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
      {!isUser ? (
        <View style={styles.avatar}>
          <Icon name="sparkles" size="sm" color="primary" />
        </View>
      ) : null}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text color={isUser ? "onPrimary" : "text"}>{message.text}</Text>
        {message.citations?.length ? (
          <View style={styles.citationList}>
            {message.citations.map((citation) => (
              <CitationCard citation={citation} key={citation.chunkId} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function LoadingMessage() {
  return (
    <View accessibilityLiveRegion="polite" style={styles.messageRow}>
      <View style={styles.avatar}>
        <Icon name="sparkles" size="sm" color="primary" />
      </View>
      <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text color="textSecondary">설명서에서 근거를 찾는 중입니다</Text>
      </View>
    </View>
  );
}

function CitationCard({ citation }: { citation: RagCitation }) {
  return (
    <Card padding="sm" variant="tinted" style={styles.citationCard}>
      <View style={styles.citationHeading}>
        <Icon name="bookmark-outline" size="sm" color="primary" />
        <Text variant="label" style={styles.citationTitle}>
          {citation.title}
        </Text>
      </View>
      <Text variant="caption" color="textSecondary">
        {citation.manufacturerName ?? "제조사 미상"} · {citation.categoryName} · 점수 {citation.score}
      </Text>
      {citation.pdfUrl ? (
        <Button
          label="근거 PDF 열기"
          variant="link"
          size="sm"
          trailingIcon="open-outline"
          onPress={() => void Linking.openURL(citation.pdfUrl!)}
          style={styles.citationButton}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs
  },
  messageRow: {
    alignItems: "flex-end",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    maxWidth: "90%"
  },
  userMessageRow: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    maxWidth: "84%"
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  bubble: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radii.xxs,
    borderColor: colors.border,
    borderWidth: 1
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radii.xxs
  },
  loadingBubble: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  citationList: {
    gap: spacing.xs,
    marginTop: spacing.sm
  },
  citationCard: {
    gap: spacing.xs
  },
  citationHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.xs
  },
  citationTitle: {
    flex: 1
  },
  citationButton: {
    alignSelf: "flex-start"
  }
});
