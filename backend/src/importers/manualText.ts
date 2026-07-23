import { readFile } from "node:fs/promises";

import type { PoolClient } from "pg";
import { z } from "zod";

import { closePool, pool, query } from "../db";

type SourceSite = {
  id: string;
  name: string;
  rights_status: "needs_permission" | "allowed" | "licensed" | "blocked";
};

export type ManualTextInput = z.infer<typeof manualTextSchema>;

type ManualChunkInput = {
  pageStart: number | null;
  pageEnd: number | null;
  content: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
};

export const pageSchema = z.object({
  pageNumber: z.number().int().positive(),
  textContent: z.string().min(1)
});

export const chunkSchema = z.object({
  pageStart: z.number().int().positive().nullable().optional(),
  pageEnd: z.number().int().positive().nullable().optional(),
  content: z.string().min(1),
  tokenCount: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const manualTextSchema = z.object({
  title: z.string().min(1).max(240),
  categorySlugPath: z.string().min(1),
  manufacturerName: z.string().min(1).max(160).optional(),
  modelName: z.string().min(1).max(160).optional(),
  languageCode: z.string().min(2).max(12).default("ko"),
  sourceUrl: z.string().url(),
  pdfUrl: z.string().url().optional(),
  storagePath: z.string().min(1).optional(),
  sourceType: z.enum(["official", "partner", "user_upload", "sample"]).default("partner"),
  rightsStatus: z.enum(["allowed", "licensed", "user_provided"]),
  summary: z.string().max(2000).optional(),
  pages: z.array(pageSchema).min(1),
  chunks: z.array(chunkSchema).optional()
});

export const manualTextsSchema = z.array(manualTextSchema);

function parseArgs() {
  const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));

  return {
    filePath: fileArg?.replace("--file=", ""),
    sourceName: sourceArg?.replace("--source=", ""),
    dryRun: process.argv.includes("--dry-run")
  };
}

function parseInput(content: string) {
  const trimmed = content.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    return manualTextsSchema.parse(JSON.parse(trimmed));
  }

  return trimmed
    .split("\n")
    .filter(Boolean)
    .map((line) => manualTextSchema.parse(JSON.parse(line)));
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "unknown";
}

function normalizeModel(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, "-") ?? null;
}

function estimateTokenCount(content: string) {
  return Math.max(1, Math.ceil(content.length / 3));
}

function splitPageIntoChunks(pageNumber: number, textContent: string) {
  const chunks: ManualChunkInput[] = [];
  const maxChars = 1800;
  const overlapChars = 180;
  let start = 0;

  while (start < textContent.length) {
    const end = Math.min(start + maxChars, textContent.length);
    const content = textContent.slice(start, end).trim();

    if (content) {
      chunks.push({
        pageStart: pageNumber,
        pageEnd: pageNumber,
        content,
        tokenCount: estimateTokenCount(content),
        metadata: {
          generatedBy: "manual-text-importer",
          pageNumber
        }
      });
    }

    if (end === textContent.length) {
      break;
    }

    start = Math.max(end - overlapChars, start + 1);
  }

  return chunks;
}

function buildChunks(manual: ManualTextInput): ManualChunkInput[] {
  if (manual.chunks?.length) {
    return manual.chunks.map((chunk) => ({
      pageStart: chunk.pageStart ?? null,
      pageEnd: chunk.pageEnd ?? chunk.pageStart ?? null,
      content: chunk.content,
      tokenCount: chunk.tokenCount ?? estimateTokenCount(chunk.content),
      metadata: {
        ...chunk.metadata,
        providedBy: "manual-text-import"
      }
    }));
  }

  return manual.pages.flatMap((page) =>
    splitPageIntoChunks(page.pageNumber, page.textContent)
  );
}

async function getSourceSite(sourceName?: string) {
  if (!sourceName) {
    return null;
  }

  const result = await query<SourceSite>(
    `
      select id, name, rights_status
      from source_sites
      where name = $1
    `,
    [sourceName]
  );

  if (result.rowCount === 0) {
    throw new Error(`Source site not found: ${sourceName}`);
  }

  return result.rows[0];
}

function validateRights(sourceSite: SourceSite | null, manuals: ManualTextInput[]) {
  const needsSourcePermission = manuals.some(
    (manual) => manual.rightsStatus !== "user_provided"
  );

  if (!needsSourcePermission) {
    return;
  }

  if (!sourceSite) {
    throw new Error(
      "A source name is required when importing allowed/licensed third-party text."
    );
  }

  if (sourceSite.rights_status !== "allowed" && sourceSite.rights_status !== "licensed") {
    throw new Error(
      `${sourceSite.name} is ${sourceSite.rights_status}. Text ingestion requires source_sites.rights_status = allowed or licensed.`
    );
  }
}

async function createImportJob(
  sourceSiteId: string | null,
  dryRun: boolean,
  importerName: string
) {
  const result = await query<{ id: string }>(
    `
      insert into import_jobs (
        source_site_id,
        job_type,
        status,
        requested_mode,
        started_at,
        metadata
      )
      values ($1, 'ingest_pdf_text', 'running', 'full_text', now(), $2::jsonb)
      returning id
    `,
    [sourceSiteId, JSON.stringify({ dryRun, importer: importerName })]
  );

  return result.rows[0].id;
}

async function finishImportJob(
  jobId: string,
  status: "succeeded" | "failed" | "blocked",
  counts: {
    foundCount?: number;
    importedCount?: number;
    skippedCount?: number;
    errorMessage?: string;
  }
) {
  await query(
    `
      update import_jobs
      set
        status = $2,
        finished_at = now(),
        found_count = $3,
        imported_count = $4,
        skipped_count = $5,
        error_message = $6
      where id = $1
    `,
    [
      jobId,
      status,
      counts.foundCount ?? 0,
      counts.importedCount ?? 0,
      counts.skippedCount ?? 0,
      counts.errorMessage ?? null
    ]
  );
}

async function findCategoryId(client: PoolClient, categorySlugPath: string) {
  const result = await client.query<{ id: string }>(
    `
      select id
      from categories
      where slug_path = $1
    `,
    [categorySlugPath]
  );

  if (result.rowCount === 0) {
    throw new Error(`Category not found: ${categorySlugPath}`);
  }

  return result.rows[0].id;
}

async function upsertManufacturer(client: PoolClient, manufacturerName?: string) {
  if (!manufacturerName) {
    return null;
  }

  const slug = slugify(manufacturerName);
  const existing = await client.query<{ id: string }>(
    `
      select id
      from manufacturers
      where name = $1 or slug = $2
      order by case when name = $1 then 0 else 1 end
      limit 1
    `,
    [manufacturerName, slug]
  );

  if ((existing.rowCount ?? 0) > 0) {
    return existing.rows[0].id;
  }

  const result = await client.query<{ id: string }>(
    `
      insert into manufacturers (name, slug)
      values ($1, $2)
      on conflict (name) do update set
        name = excluded.name
      returning id
    `,
    [manufacturerName, slug]
  );

  return result.rows[0].id;
}

async function upsertManual(client: PoolClient, manual: ManualTextInput) {
  const categoryId = await findCategoryId(client, manual.categorySlugPath);
  const manufacturerId = await upsertManufacturer(client, manual.manufacturerName);

  const result = await client.query<{ id: string }>(
    `
      insert into manuals (
        category_id,
        manufacturer_id,
        title,
        model_name,
        normalized_model,
        language_code,
        source_url,
        pdf_url,
        storage_path,
        source_type,
        ingestion_status,
        rights_status,
        summary
      )
      values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        'ready',
        $11,
        $12
      )
      on conflict (source_url) where source_url is not null do update set
        category_id = excluded.category_id,
        manufacturer_id = excluded.manufacturer_id,
        title = excluded.title,
        model_name = excluded.model_name,
        normalized_model = excluded.normalized_model,
        language_code = excluded.language_code,
        pdf_url = excluded.pdf_url,
        storage_path = excluded.storage_path,
        source_type = excluded.source_type,
        ingestion_status = excluded.ingestion_status,
        rights_status = excluded.rights_status,
        summary = excluded.summary
      returning id
    `,
    [
      categoryId,
      manufacturerId,
      manual.title,
      manual.modelName ?? null,
      normalizeModel(manual.modelName),
      manual.languageCode,
      manual.sourceUrl,
      manual.pdfUrl ?? null,
      manual.storagePath ?? null,
      manual.sourceType,
      manual.rightsStatus,
      manual.summary ?? null
    ]
  );

  return result.rows[0].id;
}

async function replacePagesAndChunks(
  client: PoolClient,
  manualId: string,
  manual: ManualTextInput
) {
  await client.query("delete from manual_chunks where manual_id = $1", [manualId]);
  await client.query("delete from manual_pages where manual_id = $1", [manualId]);

  for (const page of manual.pages) {
    await client.query(
      `
        insert into manual_pages (manual_id, page_number, text_content)
        values ($1, $2, $3)
      `,
      [manualId, page.pageNumber, page.textContent]
    );
  }

  const chunks = buildChunks(manual);

  for (const [index, chunk] of chunks.entries()) {
    await client.query(
      `
        insert into manual_chunks (
          manual_id,
          page_start,
          page_end,
          chunk_index,
          content,
          token_count,
          metadata
        )
        values ($1, $2, $3, $4, $5, $6, $7::jsonb)
      `,
      [
        manualId,
        chunk.pageStart,
        chunk.pageEnd,
        index,
        chunk.content,
        chunk.tokenCount,
        JSON.stringify(chunk.metadata)
      ]
    );
  }

  return {
    pageCount: manual.pages.length,
    chunkCount: chunks.length
  };
}

async function markCandidateImported(client: PoolClient, manual: ManualTextInput, manualId: string) {
  const rightsStatus =
    manual.rightsStatus === "user_provided" ? "allowed" : manual.rightsStatus;

  await client.query(
    `
      update manual_import_candidates
      set
        manual_id = $2,
        candidate_status = 'imported',
        import_mode = 'full_text',
        rights_status = $3,
        text_ingested_at = now()
      where source_manual_url = $1
    `,
    [manual.sourceUrl, manualId, rightsStatus]
  );
}

export async function importManualTexts(
  manuals: ManualTextInput[],
  sourceName: string | undefined,
  dryRun: boolean,
  importerName = "manual-text"
) {
  const sourceSite = await getSourceSite(sourceName);
  const jobId = await createImportJob(sourceSite?.id ?? null, dryRun, importerName);
  let client: PoolClient | null = null;

  try {
    validateRights(sourceSite, manuals);

    client = await pool.connect();
    await client.query("begin");

    let pageCount = 0;
    let chunkCount = 0;

    if (!dryRun) {
      for (const manual of manuals) {
        const manualId = await upsertManual(client, manual);
        const counts = await replacePagesAndChunks(client, manualId, manual);
        await markCandidateImported(client, manual, manualId);

        pageCount += counts.pageCount;
        chunkCount += counts.chunkCount;
      }
    } else {
      for (const manual of manuals) {
        pageCount += manual.pages.length;
        chunkCount += buildChunks(manual).length;
      }
    }

    await client.query("commit");

    await finishImportJob(jobId, "succeeded", {
      foundCount: manuals.length,
      importedCount: dryRun ? 0 : manuals.length
    });

    return {
      jobId,
      foundCount: manuals.length,
      importedCount: dryRun ? 0 : manuals.length,
      pageCount,
      chunkCount,
      dryRun
    };
  } catch (error) {
    if (client) {
      await client.query("rollback");
    }

    const isBlocked =
      error instanceof Error &&
      (error.message.includes("Text ingestion requires source_sites.rights_status") ||
        error.message.includes("A source name is required"));

    await finishImportJob(jobId, isBlocked ? "blocked" : "failed", {
      foundCount: manuals.length,
      skippedCount: manuals.length,
      errorMessage: error instanceof Error ? error.message : "Unknown text import error"
    });

    throw error;
  } finally {
    client?.release();
  }
}

async function main() {
  const { filePath, sourceName, dryRun } = parseArgs();

  if (!filePath) {
    throw new Error("Missing --file=/path/to/manual-text.json or .jsonl");
  }

  const content = await readFile(filePath, "utf8");
  const manuals = parseInput(content);
  const result = await importManualTexts(manuals, sourceName, dryRun);

  console.log(JSON.stringify(result, null, 2));
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
