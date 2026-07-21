const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export type RagCitation = {
  chunkId: string;
  manualId: string;
  title: string;
  manufacturerName: string | null;
  modelName: string | null;
  categoryName: string;
  categorySlugPath: string;
  pageStart: number | null;
  pageEnd: number | null;
  sourceUrl: string | null;
  pdfUrl: string | null;
  score: number;
  excerpt: string;
};

type AskResponse = {
  data: {
    sessionId: string;
    answer: string;
    citations: RagCitation[];
  };
};

export async function askManualQuestion(params: {
  question: string;
  sessionId?: string;
}) {
  const response = await fetch(`${API_URL}/api/chat/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "RAG 질문 요청에 실패했습니다.");
  }

  const payload = (await response.json()) as AskResponse;
  return payload.data;
}
