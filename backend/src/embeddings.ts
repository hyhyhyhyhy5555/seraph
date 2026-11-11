import OpenAI from "openai";

import { env } from "./env";

let client: OpenAI | null = null;

function getClient() {
  if (!env.openaiApiKey) {
    throw new Error(
      "OPENAI_API_KEY is required to create embeddings. Use --dry-run to inspect pending work."
    );
  }

  client ??= new OpenAI({ apiKey: env.openaiApiKey });
  return client;
}

export function isEmbeddingConfigured() {
  return Boolean(env.openaiApiKey);
}

export async function createEmbeddings(input: string[]) {
  if (input.length === 0) {
    return [];
  }

  const response = await getClient().embeddings.create({
    model: env.openaiEmbeddingModel,
    input,
    dimensions: env.openaiEmbeddingDimensions,
    encoding_format: "float"
  });

  return response.data
    .sort((left, right) => left.index - right.index)
    .map((item) => item.embedding);
}

export function toVectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}
