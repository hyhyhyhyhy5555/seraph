import type { RagCitation } from "@/lib/api";

export type ChatMessage = {
  citations?: RagCitation[];
  id: string;
  role: "assistant" | "user";
  text: string;
};
