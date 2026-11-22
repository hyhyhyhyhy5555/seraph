import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import { Badge, Button, Screen, ScreenHeader, Text } from "@/components/ui";
import { ChatComposer, ChatMessageList, type ChatMessage } from "@/features/chat";
import { askManualQuestion } from "@/lib/api";

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    text: "제품명이나 증상을 알려주시면 등록된 설명서에서 근거를 찾아드릴게요."
  },
  {
    id: "assistant-example",
    role: "assistant",
    text: "예: 삼성 세탁기 4C 오류는 어떻게 해결해?"
  }
];

export default function ChatScreen() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);

  async function sendMessage() {
    const text = input.trim();

    if (!text || isSending) {
      return;
    }

    const timestamp = Date.now();
    setMessages((current) => [
      ...current,
      { id: `user-${timestamp}`, role: "user", text }
    ]);
    setInput("");
    setIsSending(true);

    try {
      const result = await askManualQuestion({ question: text, sessionId });
      setSessionId(result.sessionId);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${timestamp}`,
          role: "assistant",
          text: result.answer,
          citations: result.citations
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${timestamp}`,
          role: "assistant",
          text: "백엔드 RAG 서버에 연결하지 못했습니다. npm run db:start와 npm run backend:dev가 실행 중인지 확인해주세요."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", default: undefined })}
        style={styles.keyboard}
      >
        <ScreenHeader
          eyebrow="GROUNDED ASSISTANT"
          title="답보다 근거가 먼저입니다."
          description="등록된 매뉴얼 조각을 검색하고, 답변마다 확인할 수 있는 출처를 붙입니다."
          icon="sparkles-outline"
          action={<Badge label="1,517개 청크 연결됨" tone="success" />}
        />
        {messages.length === initialMessages.length ? (
          <View style={styles.starters}>
            <Text variant="caption" color="textTertiary">이렇게 시작해보세요</Text>
            <View style={styles.starterButtons}>
              {["세탁기 4C 오류", "필터 교체 주기", "초기화 방법"].map((prompt) => (
                <Button key={prompt} label={prompt} variant="secondary" size="sm" onPress={() => setInput(prompt)} />
              ))}
            </View>
          </View>
        ) : null}
        <ChatMessageList messages={messages} isSending={isSending} />
        <ChatComposer
          value={input}
          disabled={isSending}
          onChangeText={setInput}
          onSend={() => void sendMessage()}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1
  },
  starters: {
    gap: 8,
    marginBottom: 12
  },
  starterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
