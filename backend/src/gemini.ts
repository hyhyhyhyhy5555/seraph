import { env } from "./env";

async function createClient() {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey: env.geminiApiKey });
}

let clientPromise: ReturnType<typeof createClient> | null = null;

async function getClient() {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is required to generate answers.");
  }

  clientPromise ??= createClient();
  return clientPromise;
}

export function isGenerationConfigured() {
  return Boolean(env.geminiApiKey);
}

export async function generateGroundedAnswer(prompt: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.geminiRequestTimeoutMs);

  try {
    const client = await getClient();
    const response = await client.models.generateContent({
      model: env.geminiGenerationModel,
      contents: prompt,
      config: {
        abortSignal: controller.signal,
        systemInstruction:
          "제공된 설명서 근거만 사용해 한국어로 정확하고 간결하게 답하세요. 근거가 부족하면 추측하지 말고 부족하다고 밝히세요. 문장 끝에 관련 근거 번호를 [1] 형식으로 표시하세요.",
        temperature: 0.1,
        maxOutputTokens: env.geminiMaxOutputTokens
      }
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Gemini returned an empty answer.");
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
