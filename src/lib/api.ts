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
  manualId?: string;
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

export type Category = {
  id: string;
  parentId?: string | null;
  depth?: number;
  slug?: string;
  name: string;
  slugPath: string;
  description?: string | null;
  sortOrder?: number;
  manualCount: number;
  children: Category[];
};

export type ManualSummary = {
  id: string;
  title: string;
  modelName: string | null;
  languageCode?: string | null;
  sourceUrl?: string | null;
  pdfUrl?: string | null;
  sourceType?: string | null;
  ingestionStatus?: string | null;
  rightsStatus?: string | null;
  summary?: string | null;
  category: { id: string; name: string; slugPath: string };
  manufacturer: { id: string; name: string; slug: string } | null;
};

export type LibraryStats = {
  manualCount: number;
  chunkCount: number;
  embeddedChunkCount: number;
  categoryCount: number;
};

async function getData<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(await response.text());
  const payload = (await response.json()) as { data: T };
  return payload.data;
}

export function getCategories() {
  return getData<Category[]>("/api/categories");
}

export function getManuals(categoryId: string) {
  return getData<ManualSummary[]>(`/api/manuals?categoryId=${encodeURIComponent(categoryId)}&limit=20`);
}

export function searchDbManuals(params: {
  q?: string;
  categoryId?: string;
  manufacturerId?: string;
  limit?: number;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set("q", params.q.trim());
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.manufacturerId) searchParams.set("manufacturerId", params.manufacturerId);
  searchParams.set("limit", String(params.limit ?? 60));
  return getData<ManualSummary[]>(`/api/manuals?${searchParams.toString()}`);
}

export function getLibraryStats() {
  return getData<LibraryStats>("/api/library-stats");
}
