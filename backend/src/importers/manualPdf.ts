import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { z } from "zod";

import { closePool } from "../db";
import {
  MANUAL_CHUNKER_VERSION,
  PDF_PARSER_VERSION,
  structureManualPdf
} from "./manualStructure";
import {
  importManualTexts,
  manualTextSchema,
  type ManualTextInput
} from "./manualText";

const execFileAsync = promisify(execFile);

const manualPdfSchema = z.object({
  title: z.string().min(1).max(240),
  categorySlugPath: z.string().min(1),
  manufacturerName: z.string().min(1).max(160).optional(),
  modelName: z.string().min(1).max(160).optional(),
  languageCode: z.string().min(2).max(12).default("ko"),
  sourceUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  pdfPath: z.string().min(1),
  storagePath: z.string().min(1).optional(),
  sourceType: z
    .enum(["official", "partner", "user_upload", "sample"])
    .default("partner"),
  rightsStatus: z.enum(["allowed", "licensed", "user_provided"]),
  summary: z.string().max(2000).optional(),
  revisionKey: z.string().min(1).max(180).optional(),
  versionLabel: z.string().min(1).max(240).optional(),
  softwareVersion: z.string().min(1).max(240).optional(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  applicableModels: z.array(z.string().min(1).max(160)).default([]),
  revisionMetadata: z.record(z.string(), z.unknown()).default({})
});

const manualPdfsSchema = z.array(manualPdfSchema);
type ManualPdfInput = z.infer<typeof manualPdfSchema>;

function parseArgs() {
  const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const pdftotextArg = process.argv.find((arg) =>
    arg.startsWith("--pdftotext=")
  );
  const pdfinfoArg = process.argv.find((arg) => arg.startsWith("--pdfinfo="));

  return {
    filePath: fileArg?.replace("--file=", ""),
    sourceName: sourceArg?.replace("--source=", ""),
    pdftotextPath:
      pdftotextArg?.replace("--pdftotext=", "") ?? "pdftotext",
    pdfinfoPath: pdfinfoArg?.replace("--pdfinfo=", "") ?? "pdfinfo",
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

function parsePdfInfo(output: string) {
  const info = new Map<string, string>();

  for (const line of output.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    info.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }

  return info;
}

function toIsoDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

async function inspectPdf(pdfPath: string, pdfinfoPath: string) {
  const absolutePdfPath = resolve(pdfPath);
  const [file, fileStats, pdfInfoResult] = await Promise.all([
    readFile(absolutePdfPath),
    stat(absolutePdfPath),
    execFileAsync(pdfinfoPath, [absolutePdfPath], {
      maxBuffer: 2 * 1024 * 1024
    })
  ]);
  const pdfInfo = parsePdfInfo(pdfInfoResult.stdout);
  const pageCount = Number(pdfInfo.get("Pages"));

  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new Error(`Unable to determine PDF page count: ${absolutePdfPath}`);
  }

  return {
    absolutePdfPath,
    fileSha256: createHash("sha256").update(file).digest("hex"),
    fileSizeBytes: fileStats.size,
    pageCount,
    pdfCreatedAt: toIsoDate(pdfInfo.get("CreationDate")),
    pdfModifiedAt: toIsoDate(pdfInfo.get("ModDate")),
    metadata: {
      pdfTitle: pdfInfo.get("Title") || undefined,
      pdfAuthor: pdfInfo.get("Author") || undefined,
      pdfCreator: pdfInfo.get("Creator") || undefined,
      pdfProducer: pdfInfo.get("Producer") || undefined,
      pdfVersion: pdfInfo.get("PDF version") || undefined,
      tagged: pdfInfo.get("Tagged") || undefined
    }
  };
}

async function extractRawPages(
  absolutePdfPath: string,
  pageCount: number,
  pdftotextPath: string
) {
  const { stdout } = await execFileAsync(
    pdftotextPath,
    ["-layout", absolutePdfPath, "-"],
    {
      maxBuffer: 50 * 1024 * 1024
    }
  );
  const extracted = stdout.split("\f");
  const rawPages = Array.from(
    { length: pageCount },
    (_, index) => extracted[index] ?? ""
  );

  if (!rawPages.some((page) => page.trim())) {
    throw new Error(`No extractable text found in PDF: ${absolutePdfPath}`);
  }

  return rawPages;
}

async function toManualTextInput(
  input: ManualPdfInput,
  pdftotextPath: string,
  pdfinfoPath: string
): Promise<ManualTextInput> {
  const inspection = await inspectPdf(input.pdfPath, pdfinfoPath);
  const rawPages = await extractRawPages(
    inspection.absolutePdfPath,
    inspection.pageCount,
    pdftotextPath
  );
  const structured = structureManualPdf({
    rawPages,
    documentTitle: input.title,
    softwareVersion: input.softwareVersion
  });

  return manualTextSchema.parse({
    title: input.title,
    categorySlugPath: input.categorySlugPath,
    manufacturerName: input.manufacturerName,
    modelName: input.modelName,
    languageCode: input.languageCode,
    sourceUrl: input.sourceUrl,
    pdfUrl: input.pdfUrl,
    storagePath: input.storagePath ?? inspection.absolutePdfPath,
    sourceType: input.sourceType,
    rightsStatus: input.rightsStatus,
    summary: input.summary,
    revisionKey: input.revisionKey,
    versionLabel: input.versionLabel,
    softwareVersion: input.softwareVersion,
    publishedAt: input.publishedAt,
    applicableModels: input.applicableModels,
    fileSha256: inspection.fileSha256,
    fileSizeBytes: inspection.fileSizeBytes,
    pageCount: inspection.pageCount,
    pdfCreatedAt: inspection.pdfCreatedAt,
    pdfModifiedAt: inspection.pdfModifiedAt,
    parserVersion: PDF_PARSER_VERSION,
    chunkerVersion: MANUAL_CHUNKER_VERSION,
    revisionMetadata: {
      ...input.revisionMetadata,
      ...inspection.metadata,
      firstContentPage: structured.firstContentPage
    },
    pages: structured.pages,
    sections: structured.sections,
    chunks: structured.chunks
  });
}

async function main() {
  const { filePath, sourceName, pdftotextPath, pdfinfoPath, dryRun } =
    parseArgs();

  if (!filePath) {
    throw new Error("Missing --file=/path/to/manual-pdf.json or .jsonl");
  }

  const content = await readFile(filePath, "utf8");
  const pdfInputs = parseInput(content);
  const manuals: ManualTextInput[] = [];

  for (const pdfInput of pdfInputs) {
    manuals.push(
      await toManualTextInput(pdfInput, pdftotextPath, pdfinfoPath)
    );
  }

  const result = await importManualTexts(
    manuals,
    sourceName,
    dryRun,
    "manual-pdf"
  );

  console.log(
    JSON.stringify(
      {
        ...result,
        extractedPdfCount: pdfInputs.length,
        parserVersion: PDF_PARSER_VERSION,
        chunkerVersion: MANUAL_CHUNKER_VERSION
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closePool();
    });
}
