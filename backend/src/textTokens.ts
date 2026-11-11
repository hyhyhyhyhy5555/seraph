// TypeScript 7 treats this package as ESM-only, but its exports map includes a CommonJS entry.
// @ts-expect-error -- the emitted require resolves to js-tiktoken/dist/index.cjs.
import { getEncoding } from "js-tiktoken";

const encoding = getEncoding("cl100k_base");

export function countTokens(content: string) {
  return Math.max(1, encoding.encode(content).length);
}
