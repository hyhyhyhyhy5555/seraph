import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";

import { Badge, Screen, ScreenHeader } from "@/components/ui";
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
          eyebrow="SERAPH AI"
          title="설명서에게 물어보세요"
          description="등록된 문서를 검색해 출처와 함께 답변합니다."
          icon="sparkles-outline"
          action={<Badge label="문서 기반" tone="success" />}
        />
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
  }
});
