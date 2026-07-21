import { readFile } from "node:fs/promises";

import { z } from "zod";

import { closePool, query } from "../db";

type SourceSite = {
  id: string;
  name: string;
  rights_status: "needs_permission" | "allowed" | "licensed" | "blocked";
};

type CandidateRow = {
  title: string;
  manufacturerName?: string;
  modelName?: string;
  sourceManualUrl: string;
  sourcePdfUrl?: string;
  languageCode: string;
  sourceCategorySlugPath?: string;
  categoryPath: string[];
  rightsStatus: "needs_permission" | "allowed" | "licensed" | "blocked";
  importMode: "metadata_only" | "full_text";
  rawPayload: Record<string, unknown>;
};

const candidateSchema = z.object({
  title: z.string().min(1).max(240),
  manufacturerName: z.string().min(1).max(160).optional(),
  modelName: z.string().min(1).max(160).optional(),
  sourceManualUrl: z.string().url(),
  sourcePdfUrl: z.string().url().optional(),
  languageCode: z.string().min(2).max(12).default("ko"),
  sourceCategorySlugPath: z.string().min(1).optional(),
  categoryPath: z.array(z.string().min(1)).default([]),
  rightsStatus: z
    .enum(["needs_permission", "allowed", "licensed", "blocked"])
    .default("needs_permission"),
  importMode: z.enum(["metadata_only", "full_text"]).default("metadata_only")
});

const candidatesSchema = z.array(candidateSchema);

function parseArgs() {
  const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));

  return {
    filePath: fileArg?.replace("--file=", ""),
    sourceName: sourceArg?.replace("--source=", "") ?? "Manuall KR",
    dryRun: process.argv.includes("--dry-run")
  };
}

function parseInput(content: string) {
  const trimmed = content.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    return candidatesSchema.parse(JSON.parse(trimmed)).map(toCandidateRow);
  }

  return trimmed
    .split("\n")
    .map((line) => candidateSchema.parse(JSON.parse(line)))
    .map(toCandidateRow);
}

function toCandidateRow(input: z.infer<typeof candidateSchema>): CandidateRow {
  return {
    ...input,
    rawPayload: input
  };
}

async function getSourceSite(sourceName: string) {
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

async function createImportJob(sourceSiteId: string, dryRun: boolean, requestedMode: string) {
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
      values ($1, 'discover_manuals', 'running', $2, now(), $3::jsonb)
      returning id
    `,
    [sourceSiteId, requestedMode, JSON.stringify({ dryRun, importer: "manual-candidates" })]
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

async function findSourceCategoryId(sourceSiteId: string, sourceCategorySlugPath?: string) {
  if (!sourceCategorySlugPath) {
    return null;
  }

  const result = await query<{ id: string }>(
    `
      select id
      from source_categories
      where source_site_id = $1
        and source_slug_path = $2
    `,
    [sourceSiteId, sourceCategorySlugPath]
  );

  return result.rows[0]?.id ?? null;
}

async function upsertCandidate(sourceSiteId: string, candidate: CandidateRow) {
  const sourceCategoryId = await findSourceCategoryId(
    sourceSiteId,
    candidate.sourceCategorySlugPath
  );

  await query(
    `
      insert into manual_import_candidates (
        source_site_id,
        source_category_id,
        title,
        manufacturer_name,
        model_name,
        source_manual_url,
        source_pdf_url,
        language_code,
        category_path,
        candidate_status,
        rights_status,
        import_mode,
        raw_payload,
        last_seen_at,
        pdf_discovered_at
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
        $9::text[],
        'discovered',
        $10,
        $11,
        $12::jsonb,
        now(),
        case when $7::text is null then null else now() end
      )
      on conflict (source_site_id, source_manual_url) do update set
        source_category_id = excluded.source_category_id,
        title = excluded.title,
        manufacturer_name = excluded.manufacturer_name,
        model_name = excluded.model_name,
        source_pdf_url = excluded.source_pdf_url,
        language_code = excluded.language_code,
        category_path = excluded.category_path,
        rights_status = excluded.rights_status,
        import_mode = excluded.import_mode,
        raw_payload = excluded.raw_payload,
        last_seen_at = now(),
        pdf_discovered_at = coalesce(
          manual_import_candidates.pdf_discovered_at,
          excluded.pdf_discovered_at
        )
    `,
    [
      sourceSiteId,
      sourceCategoryId,
      candidate.title,
      candidate.manufacturerName ?? null,
      candidate.modelName ?? null,
      candidate.sourceManualUrl,
      candidate.sourcePdfUrl ?? null,
      candidate.languageCode,
      candidate.categoryPath,
      candidate.rightsStatus,
      candidate.importMode,
      JSON.stringify(candidate.rawPayload)
    ]
  );
}

function validateRights(sourceSite: SourceSite, candidates: CandidateRow[]) {
  if (sourceSite.rights_status === "blocked") {
    throw new Error(`Source site is blocked: ${sourceSite.name}`);
  }

  const wantsFullText = candidates.some((candidate) => candidate.importMode === "full_text");

  if (
    wantsFullText &&
    sourceSite.rights_status !== "allowed" &&
    sourceSite.rights_status !== "licensed"
  ) {
    throw new Error(
      `${sourceSite.name} is ${sourceSite.rights_status}. Full-text candidates require source_sites.rights_status = allowed or licensed.`
    );
  }
}

async function main() {
  const { filePath, sourceName, dryRun } = parseArgs();

  if (!filePath) {
    throw new Error("Missing --file=/path/to/candidates.json or .jsonl");
  }

  const sourceSite = await getSourceSite(sourceName);
  const content = await readFile(filePath, "utf8");
  const candidates = parseInput(content);
  const requestedMode = candidates.some((candidate) => candidate.importMode === "full_text")
    ? "full_text"
    : "metadata_only";
  const jobId = await createImportJob(sourceSite.id, dryRun, requestedMode);

  try {
    validateRights(sourceSite, candidates);

    if (!dryRun) {
      for (const candidate of candidates) {
        await upsertCandidate(sourceSite.id, candidate);
      }
    }

    await finishImportJob(jobId, "succeeded", {
      foundCount: candidates.length,
      importedCount: dryRun ? 0 : candidates.length
    });

    console.log(
      JSON.stringify(
        {
          jobId,
          sourceName: sourceSite.name,
          foundCount: candidates.length,
          importedCount: dryRun ? 0 : candidates.length,
          dryRun
        },
        null,
        2
      )
    );
  } catch (error) {
    const isBlocked =
      error instanceof Error &&
      (error.message.includes("Full-text candidates require") ||
        error.message.includes("Source site is blocked"));

    await finishImportJob(jobId, isBlocked ? "blocked" : "failed", {
      foundCount: candidates.length,
      skippedCount: candidates.length,
      errorMessage: error instanceof Error ? error.message : "Unknown candidate import error"
    });

    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
