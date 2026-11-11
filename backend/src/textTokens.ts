import { getEncoding } from "js-tiktoken";

const encoding = getEncoding("cl100k_base");

export function countTokens(content: string) {
  return Math.max(1, encoding.encode(content).length);
}
