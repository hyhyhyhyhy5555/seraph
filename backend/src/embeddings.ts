import { env } from "./env";

async function createClient() {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey: env.geminiApiKey });
}

let clientPromise: ReturnType<typeof createClient> | null = null;

async function getClient() {
  if (!env.geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY is required to create embeddings. Use --dry-run to inspect pending work."
    );
  }

  clientPromise ??= createClient();
  return clientPromise;
}

export function isEmbeddingConfigured() {
  return Boolean(env.geminiApiKey);
}

export async function createEmbeddings(
  input: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
) {
  if (input.length === 0) {
    return [];
  }

  const client = await getClient();
  const response = await client.models.embedContent({
    model: env.geminiEmbeddingModel,
    contents: input,
    config: {
      taskType,
      outputDimensionality: env.geminiEmbeddingDimensions
    }
  });

  return (response.embeddings ?? []).map((item) => item.values ?? []);
}

export function toVectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}
