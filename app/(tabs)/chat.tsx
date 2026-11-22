import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import { Badge, Button, Screen, ScreenHeader, Text } from "@/components/ui";
import { ChatComposer, ChatMessageList, DeviceIntake, type ChatMessage } from "@/features/chat";
import { askManualQuestion, getLibraryStats, type ManualSummary } from "@/lib/api";

const initialMessages: ChatMessage[] = [];

export default function ChatScreen() {
  const params = useLocalSearchParams<{ manualId?: string; manualTitle?: string; manualModel?: string }>();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [selectedManual, setSelectedManual] = useState<ManualSummary>();
  const [chunkCount, setChunkCount] = useState<number>();

  useEffect(() => {
    void getLibraryStats().then((stats) => setChunkCount(stats.embeddedChunkCount)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!params.manualId || !params.manualTitle) return;
    setSelectedManual({
      id: params.manualId,
      title: params.manualTitle,
      modelName: params.manualModel || null,
      category: { id: "", name: "", slugPath: "" },
      manufacturer: null
    });
  }, [params.manualId, params.manualModel, params.manualTitle]);

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
      const result = await askManualQuestion({ question: text, sessionId, manualId: selectedManual?.id });
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
          action={chunkCount ? <Badge label={`${chunkCount.toLocaleString()}개 청크 연결됨`} tone="success" /> : undefined}
        />
        {messages.length === 0 ? (
          <DeviceIntake
            selectedManual={selectedManual}
            onManualSelect={setSelectedManual}
            onIssueSelect={(issue) => setInput(`${selectedManual?.modelName ?? selectedManual?.title ?? "이 기기"}에서 ${issue}`)}
          />
        ) : selectedManual ? (
          <View style={styles.contextRow}>
            <Text variant="caption" color="textSecondary">질문 대상</Text>
            <Button label={selectedManual.modelName || selectedManual.title} variant="secondary" size="sm" onPress={() => setSelectedManual(undefined)} />
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
  },
  contextRow: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 8 }
});
