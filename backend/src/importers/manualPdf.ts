import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { z } from "zod";

import { closePool } from "../db";
import { importManualTexts, manualTextSchema, type ManualTextInput } from "./manualText";

const execFileAsync = promisify(execFile);

const manualPdfSchema = z.object({
  title: z.string().min(1).max(240),
  categorySlugPath: z.string().min(1),
  manufacturerName: z.string().min(1).max(160).optional(),
  modelName: z.string().min(1).max(160).optional(),
  languageCode: z.string().min(2).max(12).default("ko"),
  sourceUrl: z.string().url(),
  pdfUrl: z.string().url().optional(),
  pdfPath: z.string().min(1),
  storagePath: z.string().min(1).optional(),
  sourceType: z.enum(["official", "partner", "user_upload", "sample"]).default("partner"),
  rightsStatus: z.enum(["allowed", "licensed", "user_provided"]),
  summary: z.string().max(2000).optional()
});

const manualPdfsSchema = z.array(manualPdfSchema);

type ManualPdfInput = z.infer<typeof manualPdfSchema>;

function parseArgs() {
  const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const pdftotextArg = process.argv.find((arg) => arg.startsWith("--pdftotext="));

  return {
    filePath: fileArg?.replace("--file=", ""),
    sourceName: sourceArg?.replace("--source=", ""),
    pdftotextPath: pdftotextArg?.replace("--pdftotext=", "") ?? "pdftotext",
    dryRun: process.argv.includes("--dry-run")
  };
}

function parseInput(content: string) {
  const trimmed = content.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    return manualPdfsSchema.parse(JSON.parse(trimmed));
  }

  return trimmed
    .split("\n")
    .filter(Boolean)
    .map((line) => manualPdfSchema.parse(JSON.parse(line)));
}

function normalizePageText(text: string) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return lines.reduce((merged, line) => {
        if (!merged) {
          return line;
        }

        const lastToken = merged.split(/\s+/).at(-1) ?? "";
        const shouldJoinWithoutSpace =
          (/[\p{L}]-[\p{L}]+$/u.test(lastToken) || lastToken.length <= 2) &&
          /^\p{Ll}/u.test(line);

        return shouldJoinWithoutSpace ? `${merged}${line}` : `${merged} ${line}`;
      }, "");
    })
    .filter(Boolean);

  return paragraphs.join("\n\n").trim();
}

async function extractPagesFromPdf(pdfPath: string, pdftotextPath: string) {
  const absolutePdfPath = resolve(pdfPath);
  const { stdout } = await execFileAsync(pdftotextPath, ["-layout", absolutePdfPath, "-"], {
    maxBuffer: 50 * 1024 * 1024
  });

  const pages = stdout
    .split("\f")
    .map(normalizePageText)
    .map((textContent, index) => ({
      pageNumber: index + 1,
      textContent
    }))
    .filter((page) => page.textContent.length > 0);

  if (pages.length === 0) {
    throw new Error(`No extractable text found in PDF: ${absolutePdfPath}`);
  }

  return {
    absolutePdfPath,
    pages
  };
}

async function toManualTextInput(
  input: ManualPdfInput,
  pdftotextPath: string
): Promise<ManualTextInput> {
  const { absolutePdfPath, pages } = await extractPagesFromPdf(input.pdfPath, pdftotextPath);

  return manualTextSchema.parse({
    title: input.title,
    categorySlugPath: input.categorySlugPath,
    manufacturerName: input.manufacturerName,
    modelName: input.modelName,
    languageCode: input.languageCode,
    sourceUrl: input.sourceUrl,
    pdfUrl: input.pdfUrl,
    storagePath: input.storagePath ?? absolutePdfPath,
    sourceType: input.sourceType,
    rightsStatus: input.rightsStatus,
    summary: input.summary,
    pages
  });
}

async function main() {
  const { filePath, sourceName, pdftotextPath, dryRun } = parseArgs();

  if (!filePath) {
    throw new Error("Missing --file=/path/to/manual-pdf.json or .jsonl");
  }

  const content = await readFile(filePath, "utf8");
  const pdfInputs = parseInput(content);
  const manuals: ManualTextInput[] = [];

  for (const pdfInput of pdfInputs) {
    manuals.push(await toManualTextInput(pdfInput, pdftotextPath));
  }

  const result = await importManualTexts(manuals, sourceName, dryRun, "manual-pdf");

  console.log(
    JSON.stringify(
      {
        ...result,
        extractedPdfCount: pdfInputs.length
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
