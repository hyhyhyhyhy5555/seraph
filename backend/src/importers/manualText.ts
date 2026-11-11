import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import type { PoolClient } from "pg";
import { z } from "zod";

import { closePool, pool, query } from "../db";
import { countTokens } from "../textTokens";
import type { ManualChunkInput } from "./manualStructure";

type SourceSite = {
  id: string;
  name: string;
  rights_status: "needs_permission" | "allowed" | "licensed" | "blocked";
};

const contentTypeSchema = z.enum([
  "overview",
  "procedure",
  "warning",
  "note",
  "troubleshooting",
  "reference",
  "visual"
]);

export const pageSchema = z.object({
  pageNumber: z.number().int().positive(),
  printedPageLabel: z.string().max(40).optional(),
  textContent: z.string(),
  isEmbeddable: z.boolean().default(true),
  layoutMetadata: z.record(z.string(), z.unknown()).default({})
});

export const sectionSchema = z.object({
  sectionKey: z.string().min(1).max(180),
  parentSectionKey: z.string().min(1).max(180).optional(),
  level: z.number().int().min(1).max(6),
  ordinal: z.number().int().nonnegative(),
  title: z.string().min(1).max(500),
  pageStart: z.number().int().positive().nullable().optional(),
  pageEnd: z.number().int().positive().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const chunkSchema = z.object({
  pageStart: z.number().int().positive().nullable().optional(),
  pageEnd: z.number().int().positive().nullable().optional(),
  content: z.string().min(1),
  embeddingContent: z.string().min(1).optional(),
  tokenCount: z.number().int().positive().optional(),
  contentType: contentTypeSchema.default("reference"),
  sectionKey: z.string().min(1).max(180).optional(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const manualTextSchema = z.object({
  title: z.string().min(1).max(240),
  categorySlugPath: z.string().min(1),
  manufacturerName: z.string().min(1).max(160).optional(),
  modelName: z.string().min(1).max(160).optional(),
  languageCode: z.string().min(2).max(12).default("ko"),
  sourceUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  storagePath: z.string().min(1).optional(),
  sourceType: z
    .enum(["official", "partner", "user_upload", "sample"])
    .default("partner"),
  rightsStatus: z.enum(["allowed", "licensed", "user_provided"]),
  summary: z.string().max(2000).optional(),
  revisionKey: z.string().min(1).max(180).optional(),
  versionLabel: z.string().min(1).max(240).optional(),
  softwareVersion: z.string().min(1).max(240).optional(),
  fileSha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
  fileSizeBytes: z.number().int().positive().optional(),
  pageCount: z.number().int().positive().optional(),
  pdfCreatedAt: z.string().datetime().optional(),
  pdfModifiedAt: z.string().datetime().optional(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  parserVersion: z.string().max(120).optional(),
  chunkerVersion: z.string().max(120).optional(),
  applicableModels: z.array(z.string().min(1).max(160)).default([]),
  revisionMetadata: z.record(z.string(), z.unknown()).default({}),
  pages: z.array(pageSchema).min(1),
  sections: z.array(sectionSchema).default([]),
  chunks: z.array(chunkSchema).optional()
});

export const manualTextsSchema = z.array(manualTextSchema);
export type ManualTextInput = z.infer<typeof manualTextSchema>;

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
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

  return slug || "default";
}

function normalizeModel(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, "-") ?? null;
}

function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function defaultEmbeddingContent(manual: ManualTextInput, content: string) {
  return [
    `문서: ${manual.title}`,
    manual.softwareVersion ? `소프트웨어: ${manual.softwareVersion}` : null,
    "",
    content
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function buildChunks(manual: ManualTextInput): ManualChunkInput[] {
  if (manual.chunks?.length) {
    return manual.chunks.map((chunk) => {
      const embeddingContent =
        chunk.embeddingContent ?? defaultEmbeddingContent(manual, chunk.content);

      return {
        pageStart: chunk.pageStart ?? null,
        pageEnd: chunk.pageEnd ?? chunk.pageStart ?? null,
        content: chunk.content,
        embeddingContent,
        tokenCount: chunk.tokenCount ?? countTokens(embeddingContent),
        contentType: chunk.contentType,
        sectionKey: chunk.sectionKey,
        metadata: {
          ...chunk.metadata,
          providedBy: "manual-text-import"
        }
      };
    });
  }

  return manual.pages
    .filter((page) => page.isEmbeddable && page.textContent.trim())
    .map((page) => {
      const embeddingContent = defaultEmbeddingContent(
        manual,
        page.textContent
      );

      return {
        pageStart: page.pageNumber,
        pageEnd: page.pageNumber,
        content: page.textContent,
        embeddingContent,
        tokenCount: countTokens(embeddingContent),
        contentType: "reference",
        metadata: {
          generatedBy: "manual-text-importer-v2",
          pageNumber: page.pageNumber
        }
      };
    });
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
  for (const manual of manuals) {
    if (manual.rightsStatus === "user_provided") {
      continue;
    }

    if (!manual.sourceUrl) {
      throw new Error(
        `sourceUrl is required for allowed/licensed import: ${manual.title}`
      );
    }

    if (!sourceSite) {
      throw new Error(
        "A source name is required when importing allowed/licensed third-party text."
      );
    }

    if (
      sourceSite.rights_status !== "allowed" &&
      sourceSite.rights_status !== "licensed"
    ) {
      throw new Error(
        `${sourceSite.name} is ${sourceSite.rights_status}. Text ingestion requires source_sites.rights_status = allowed or licensed.`
      );
    }
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

async function upsertManufacturer(
  client: PoolClient,
  manufacturerName?: string
) {
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
  const manufacturerId = await upsertManufacturer(
    client,
    manual.manufacturerName
  );
  const normalizedModel = normalizeModel(manual.modelName);
  const existing = manual.sourceUrl
    ? await client.query<{ id: string }>(
        "select id from manuals where source_url = $1 limit 1",
        [manual.sourceUrl]
      )
    : await client.query<{ id: string }>(
        `
          select id
          from manuals
          where category_id = $1
            and manufacturer_id is not distinct from $2
            and title = $3
            and normalized_model is not distinct from $4
          order by created_at asc
          limit 1
        `,
        [categoryId, manufacturerId, manual.title, normalizedModel]
      );

  if ((existing.rowCount ?? 0) > 0) {
    const result = await client.query<{ id: string }>(
      `
        update manuals
        set
          category_id = $2,
          manufacturer_id = $3,
          title = $4,
          model_name = $5,
          normalized_model = $6,
          language_code = $7,
          source_url = coalesce($8, source_url),
          pdf_url = coalesce($9, pdf_url),
          storage_path = coalesce($10, storage_path),
          source_type = $11,
          ingestion_status = 'processing',
          rights_status = $12,
          summary = coalesce($13, summary)
        where id = $1
        returning id
      `,
      [
        existing.rows[0].id,
        categoryId,
        manufacturerId,
        manual.title,
        manual.modelName ?? null,
        normalizedModel,
        manual.languageCode,
        manual.sourceUrl ?? null,
        manual.pdfUrl ?? null,
        manual.storagePath ?? null,
        manual.sourceType,
        manual.rightsStatus,
        manual.summary ?? null
      ]
    );

    return result.rows[0].id;
  }

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
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'processing', $11, $12)
      returning id
    `,
    [
      categoryId,
      manufacturerId,
      manual.title,
      manual.modelName ?? null,
      normalizedModel,
      manual.languageCode,
      manual.sourceUrl ?? null,
      manual.pdfUrl ?? null,
      manual.storagePath ?? null,
      manual.sourceType,
      manual.rightsStatus,
      manual.summary ?? null
    ]
  );

  return result.rows[0].id;
}

function revisionKeyFor(manual: ManualTextInput) {
  return (
    manual.revisionKey ??
    slugify(
      manual.versionLabel ??
        manual.softwareVersion ??
        manual.fileSha256?.slice(0, 16) ??
        "default"
    )
  );
}

async function upsertRevision(
  client: PoolClient,
  manualId: string,
  manual: ManualTextInput
) {
  const revisionKey = revisionKeyFor(manual);
  const values = [
    manualId,
    revisionKey,
    manual.versionLabel ?? null,
    manual.softwareVersion ?? null,
    manual.languageCode,
    manual.sourceUrl ?? null,
    manual.pdfUrl ?? null,
    manual.storagePath ?? null,
    manual.sourceType,
    manual.rightsStatus,
    manual.fileSha256 ?? null,
    manual.fileSizeBytes ?? null,
    manual.pageCount ?? manual.pages.length,
    manual.pdfCreatedAt ?? null,
    manual.pdfModifiedAt ?? null,
    manual.publishedAt ?? null,
    manual.parserVersion ?? null,
    manual.chunkerVersion ?? null,
    JSON.stringify(manual.revisionMetadata)
  ];

  if (manual.fileSha256) {
    const byHash = await client.query<{ id: string; manual_id: string }>(
      `
        select id, manual_id
        from manual_revisions
        where file_sha256 = $1
        limit 1
      `,
      [manual.fileSha256]
    );

    if ((byHash.rowCount ?? 0) > 0) {
      if (byHash.rows[0].manual_id !== manualId) {
        throw new Error(
          `PDF hash already belongs to another manual: ${manual.fileSha256}`
        );
      }

      const updated = await client.query<{ id: string }>(
        `
          update manual_revisions
          set
            revision_key = $2,
            version_label = $3,
            software_version = $4,
            language_code = $5,
            source_url = $6,
            pdf_url = $7,
            storage_path = $8,
            source_type = $9,
            rights_status = $10,
            file_sha256 = $11,
            file_size_bytes = $12,
            page_count = $13,
            pdf_created_at = $14,
            pdf_modified_at = $15,
            published_at = $16,
            parser_version = $17,
            chunker_version = $18,
            ingestion_status = 'processing',
            embedding_status = 'pending',
            error_message = null,
            metadata = $19::jsonb
          where id = $1
          returning id
        `,
        [byHash.rows[0].id, ...values.slice(1)]
      );

      return updated.rows[0].id;
    }
  }

  const result = await client.query<{ id: string }>(
    `
      insert into manual_revisions (
        manual_id,
        revision_key,
        version_label,
        software_version,
        language_code,
        source_url,
        pdf_url,
        storage_path,
        source_type,
        rights_status,
        file_sha256,
        file_size_bytes,
        page_count,
        pdf_created_at,
        pdf_modified_at,
        published_at,
        parser_version,
        chunker_version,
        ingestion_status,
        embedding_status,
        metadata
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, 'processing', 'pending', $19::jsonb
      )
      on conflict (manual_id, revision_key, language_code) do update set
        version_label = excluded.version_label,
        software_version = excluded.software_version,
        source_url = excluded.source_url,
        pdf_url = excluded.pdf_url,
        storage_path = excluded.storage_path,
        source_type = excluded.source_type,
        rights_status = excluded.rights_status,
        file_sha256 = excluded.file_sha256,
        file_size_bytes = excluded.file_size_bytes,
        page_count = excluded.page_count,
        pdf_created_at = excluded.pdf_created_at,
        pdf_modified_at = excluded.pdf_modified_at,
        published_at = excluded.published_at,
        parser_version = excluded.parser_version,
        chunker_version = excluded.chunker_version,
        ingestion_status = 'processing',
        embedding_status = 'pending',
        error_message = null,
        metadata = excluded.metadata
      returning id
    `,
    values
  );

  return result.rows[0].id;
}

async function replaceRevisionContent(
  client: PoolClient,
  manualId: string,
  revisionId: string,
  manual: ManualTextInput
) {
  await client.query("delete from manual_chunks where revision_id = $1", [
    revisionId
  ]);
  await client.query("delete from manual_pages where revision_id = $1", [
    revisionId
  ]);
  await client.query("delete from manual_applicability where revision_id = $1", [
    revisionId
  ]);
  await client.query("delete from manual_sections where revision_id = $1", [
    revisionId
  ]);

  for (const page of manual.pages) {
    await client.query(
      `
        insert into manual_pages (
          manual_id,
          revision_id,
          page_number,
          printed_page_label,
          text_content,
          is_embeddable,
          layout_metadata
        )
        values ($1, $2, $3, $4, $5, $6, $7::jsonb)
      `,
      [
        manualId,
        revisionId,
        page.pageNumber,
        page.printedPageLabel ?? null,
        page.textContent,
        page.isEmbeddable,
        JSON.stringify(page.layoutMetadata)
      ]
    );
  }

  const sectionIds = new Map<string, string>();

  for (const section of [...manual.sections].sort(
    (left, right) => left.ordinal - right.ordinal
  )) {
    const result = await client.query<{ id: string }>(
      `
        insert into manual_sections (
          revision_id,
          section_key,
          level,
          ordinal,
          title,
          page_start,
          page_end,
          metadata
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        returning id
      `,
      [
        revisionId,
        section.sectionKey,
        section.level,
        section.ordinal,
        section.title,
        section.pageStart ?? null,
        section.pageEnd ?? section.pageStart ?? null,
        JSON.stringify(section.metadata)
      ]
    );

    sectionIds.set(section.sectionKey, result.rows[0].id);
  }

  for (const section of manual.sections) {
    if (!section.parentSectionKey) {
      continue;
    }

    const sectionId = sectionIds.get(section.sectionKey);
    const parentId = sectionIds.get(section.parentSectionKey);
    if (sectionId && parentId) {
      await client.query(
        "update manual_sections set parent_id = $2 where id = $1",
        [sectionId, parentId]
      );
    }
  }

  const productName = manual.modelName ?? manual.title;
  for (const applicableModel of manual.applicableModels) {
    await client.query(
      `
        insert into manual_applicability (
          revision_id,
          product_name,
          model_name,
          software_version
        )
        values ($1, $2, $3, $4)
        on conflict do nothing
      `,
      [
        revisionId,
        productName,
        applicableModel,
        manual.softwareVersion ?? null
      ]
    );
  }

  const chunks = buildChunks(manual);
  for (const [index, chunk] of chunks.entries()) {
    const contentHash = hashContent(chunk.embeddingContent);
    await client.query(
      `
        insert into manual_chunks (
          manual_id,
          revision_id,
          section_id,
          page_start,
          page_end,
          chunk_index,
          content,
          embedding_content,
          content_type,
          content_hash,
          token_count,
          metadata
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb
        )
      `,
      [
        manualId,
        revisionId,
        chunk.sectionKey ? sectionIds.get(chunk.sectionKey) ?? null : null,
        chunk.pageStart,
        chunk.pageEnd,
        index,
        chunk.content,
        chunk.embeddingContent,
        chunk.contentType,
        contentHash,
        chunk.tokenCount,
        JSON.stringify(chunk.metadata)
      ]
    );
  }

  await client.query(
    `
      update manual_revisions
      set
        ingestion_status = 'parsed',
        embedding_status = 'pending',
        error_message = null
      where id = $1
    `,
    [revisionId]
  );
  await client.query(
    "update manuals set ingestion_status = 'parsed' where id = $1",
    [manualId]
  );

  return {
    pageCount: manual.pages.length,
    sectionCount: manual.sections.length,
    chunkCount: chunks.length
  };
}

async function markCandidateImported(
  client: PoolClient,
  manual: ManualTextInput,
  manualId: string
) {
  if (!manual.sourceUrl) {
    return;
  }

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
  const jobId = await createImportJob(
    sourceSite?.id ?? null,
    dryRun,
    importerName
  );
  let client: PoolClient | null = null;

  try {
    validateRights(sourceSite, manuals);

    client = await pool.connect();
    await client.query("begin");

    let pageCount = 0;
    let sectionCount = 0;
    let chunkCount = 0;

    if (!dryRun) {
      for (const manual of manuals) {
        const manualId = await upsertManual(client, manual);
        const revisionId = await upsertRevision(client, manualId, manual);
        const counts = await replaceRevisionContent(
          client,
          manualId,
          revisionId,
          manual
        );
        await markCandidateImported(client, manual, manualId);

        pageCount += counts.pageCount;
        sectionCount += counts.sectionCount;
        chunkCount += counts.chunkCount;
      }
    } else {
      for (const manual of manuals) {
        pageCount += manual.pages.length;
        sectionCount += manual.sections.length;
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
      revisionCount: manuals.length,
      pageCount,
      sectionCount,
      chunkCount,
      dryRun
    };
  } catch (error) {
    if (client) {
      await client.query("rollback");
    }

    const isBlocked =
      error instanceof Error &&
      (error.message.includes(
        "Text ingestion requires source_sites.rights_status"
      ) ||
        error.message.includes("A source name is required") ||
        error.message.includes("sourceUrl is required"));

    await finishImportJob(jobId, isBlocked ? "blocked" : "failed", {
      foundCount: manuals.length,
      skippedCount: manuals.length,
      errorMessage:
        error instanceof Error ? error.message : "Unknown text import error"
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
