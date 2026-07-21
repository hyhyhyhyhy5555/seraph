import { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { askManualQuestion, type RagCitation } from "@/lib/api";
import { colors } from "@/theme/colors";
import { commonStyles } from "@/theme/common";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  citations?: RagCitation[];
};

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    text: "제품명이나 증상을 물어보면 연결된 설명서를 기준으로 답변할 예정입니다."
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
      {
        id: `user-${timestamp}`,
        role: "user",
        text
      }
    ]);
    setInput("");
    setIsSending(true);

    try {
      const result = await askManualQuestion({
        question: text,
        sessionId
      });

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
          text: "백엔드 RAG 서버에 연결하지 못했습니다. `npm run db:start`와 `npm run backend:dev`가 실행 중인지 확인해주세요."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", default: undefined })}
        style={styles.keyboard}
      >
        <View style={commonStyles.screen}>
          <View style={commonStyles.header}>
            <Text style={commonStyles.brand}>세라프 AI</Text>
            <Text style={commonStyles.title}>설명서 채팅</Text>
            <Text style={commonStyles.subtitle}>
              더미 설명서 청크를 검색해 근거 문서와 함께 답변합니다.
            </Text>
          </View>

          <ScrollView style={styles.messages} contentContainerStyle={styles.messageContent}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.bubble,
                  message.role === "user" ? styles.userBubble : styles.assistantBubble
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    message.role === "user" ? styles.userBubbleText : null
                  ]}
                >
                  {message.text}
                </Text>
                {message.citations && message.citations.length > 0 ? (
                  <View style={styles.citationList}>
                    {message.citations.map((citation) => (
                      <View key={citation.chunkId} style={styles.citationCard}>
                        <Text style={styles.citationTitle}>{citation.title}</Text>
                        <Text style={styles.citationMeta}>
                          {citation.manufacturerName ?? "제조사 미상"} ·{" "}
                          {citation.categoryName} · 점수 {citation.score}
                        </Text>
                        {citation.pdfUrl ? (
                          <Pressable onPress={() => Linking.openURL(citation.pdfUrl!)}>
                            <Text style={styles.citationLink}>PDF 보기</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
            {isSending ? (
              <View style={[styles.bubble, styles.assistantBubble]}>
                <Text style={styles.bubbleText}>설명서에서 근거를 찾는 중입니다.</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="설명서에 대해 질문하기"
              placeholderTextColor={colors.faintText}
              multiline
              style={styles.input}
            />
            <Pressable
              disabled={isSending}
              style={[styles.sendButton, isSending ? styles.sendButtonDisabled : null]}
              onPress={sendMessage}
            >
              <Text style={styles.sendButtonText}>{isSending ? "검색" : "전송"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1
  },
  messages: {
    flex: 1
  },
  messageContent: {
    gap: 10,
    paddingBottom: 16
  },
  bubble: {
    borderRadius: 8,
    maxWidth: "86%",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary
  },
  bubbleText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22
  },
  userBubbleText: {
    color: colors.surface,
    fontWeight: "700"
  },
  composer: {
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    padding: 10
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 40,
    paddingTop: 9
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  sendButtonDisabled: {
    backgroundColor: colors.faintText
  },
  sendButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "900"
  },
  citationList: {
    gap: 8,
    marginTop: 12
  },
  citationCard: {
    backgroundColor: colors.surfaceBlue,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10
  },
  citationTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18
  },
  citationMeta: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4
  },
  citationLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8
  }
});
