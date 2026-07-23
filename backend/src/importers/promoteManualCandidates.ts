import type { PoolClient } from "pg";

import { closePool, pool, query } from "../db";

type SourceSite = {
  id: string;
  name: string;
  rights_status: "needs_permission" | "allowed" | "licensed" | "blocked";
};

type CandidateRow = {
  id: string;
  source_category_id: string | null;
  title: string;
  manufacturer_name: string | null;
  model_name: string | null;
  source_manual_url: string;
  source_pdf_url: string | null;
  language_code: string;
  rights_status: "needs_permission" | "allowed" | "licensed" | "blocked";
};

type PromotionResult = {
  jobId: string;
  sourceName: string;
  foundCount: number;
  importedCount: number;
  skippedCount: number;
  dryRun: boolean;
};

function parseArgs() {
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const statusArg = process.argv.find((arg) => arg.startsWith("--status="));

  return {
    sourceName: sourceArg?.replace("--source=", "") ?? "Manuall KR",
    limit: Number(limitArg?.replace("--limit=", "") ?? 100),
    status: statusArg?.replace("--status=", "") ?? "discovered",
    dryRun: process.argv.includes("--dry-run")
  };
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "unknown";
}

function normalizeModel(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "-") ?? null;
}

function toManualRightsStatus(candidateRightsStatus: CandidateRow["rights_status"]) {
  if (candidateRightsStatus === "allowed" || candidateRightsStatus === "licensed") {
    return candidateRightsStatus;
  }

  return "unknown";
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

async function createImportJob(sourceSiteId: string, dryRun: boolean) {
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
      values ($1, 'sync_metadata', 'running', 'metadata_only', now(), $2::jsonb)
      returning id
    `,
    [
      sourceSiteId,
      JSON.stringify({ dryRun, importer: "promote-manual-candidates" })
    ]
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

async function getCandidates(sourceSiteId: string, status: string, limit: number) {
  const result = await query<CandidateRow>(
    `
      select
        id,
        source_category_id,
        title,
        manufacturer_name,
        model_name,
        source_manual_url,
        source_pdf_url,
        language_code,
        rights_status
      from manual_import_candidates
      where source_site_id = $1
        and candidate_status = $2
      order by updated_at asc
      limit $3
    `,
    [sourceSiteId, status, limit]
  );

  return result.rows;
}

async function findMappedCategoryId(sourceCategoryId: string | null) {
  if (!sourceCategoryId) {
    return null;
  }

  const result = await query<{ id: string }>(
    `
      select categories.id
      from category_source_mappings
      join categories on categories.id = category_source_mappings.category_id
      where category_source_mappings.source_category_id = $1
        and category_source_mappings.mapping_status = 'confirmed'
      order by category_source_mappings.confidence desc, categories.depth desc
      limit 1
    `,
    [sourceCategoryId]
  );

  return result.rows[0]?.id ?? null;
}

async function upsertManufacturer(
  client: PoolClient,
  manufacturerName: string | null
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

async function upsertPendingManual(
  client: PoolClient,
  candidate: CandidateRow,
  categoryId: string
) {
  const manufacturerId = await upsertManufacturer(client, candidate.manufacturer_name);
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
        'partner',
        'pending',
        $9,
        '메타데이터만 등록된 설명서입니다. 본문은 권한 확인 후 적재됩니다.'
      )
      on conflict (source_url) where source_url is not null do update set
        category_id = excluded.category_id,
        manufacturer_id = excluded.manufacturer_id,
        title = excluded.title,
        model_name = excluded.model_name,
        normalized_model = excluded.normalized_model,
        language_code = excluded.language_code,
        pdf_url = excluded.pdf_url,
        source_type = excluded.source_type,
        ingestion_status = case
          when manuals.ingestion_status = 'ready' then manuals.ingestion_status
          else excluded.ingestion_status
        end,
        rights_status = case
          when manuals.rights_status in ('allowed', 'licensed', 'user_provided') then manuals.rights_status
          else excluded.rights_status
        end,
        summary = case
          when manuals.ingestion_status = 'ready' then manuals.summary
          else excluded.summary
        end
      returning id
    `,
    [
      categoryId,
      manufacturerId,
      candidate.title,
      candidate.model_name,
      normalizeModel(candidate.model_name),
      candidate.language_code,
      candidate.source_manual_url,
      candidate.source_pdf_url,
      toManualRightsStatus(candidate.rights_status)
    ]
  );

  return result.rows[0].id;
}

async function markCandidate(
  client: PoolClient,
  candidateId: string,
  candidateStatus: "mapped" | "skipped" | "blocked",
  manualId: string | null
) {
  await client.query(
    `
      update manual_import_candidates
      set
        manual_id = $2,
        candidate_status = $3
      where id = $1
    `,
    [candidateId, manualId, candidateStatus]
  );
}

export async function promoteManualCandidates(
  sourceName = "Manuall KR",
  limit = 100,
  status = "discovered",
  dryRun = false
): Promise<PromotionResult> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 1000) : 100;
  const sourceSite = await getSourceSite(sourceName);
  const jobId = await createImportJob(sourceSite.id, dryRun);

  try {
    if (sourceSite.rights_status === "blocked") {
      throw new Error(`Source site is blocked: ${sourceSite.name}`);
    }

    const candidates = await getCandidates(sourceSite.id, status, safeLimit);
    let importedCount = 0;
    let skippedCount = 0;

    const client = await pool.connect();

    try {
      await client.query("begin");

      for (const candidate of candidates) {
        if (candidate.rights_status === "blocked") {
          skippedCount += 1;

          if (!dryRun) {
            await markCandidate(client, candidate.id, "blocked", null);
          }

          continue;
        }

        const categoryId = await findMappedCategoryId(candidate.source_category_id);

        if (!categoryId) {
          skippedCount += 1;

          if (!dryRun) {
            await markCandidate(client, candidate.id, "skipped", null);
          }

          continue;
        }

        importedCount += 1;

        if (!dryRun) {
          const manualId = await upsertPendingManual(client, candidate, categoryId);
          await markCandidate(client, candidate.id, "mapped", manualId);
        }
      }

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }

    await finishImportJob(jobId, "succeeded", {
      foundCount: candidates.length,
      importedCount: dryRun ? 0 : importedCount,
      skippedCount
    });

    return {
      jobId,
      sourceName: sourceSite.name,
      foundCount: candidates.length,
      importedCount: dryRun ? 0 : importedCount,
      skippedCount,
      dryRun
    };
  } catch (error) {
    const isBlocked =
      error instanceof Error && error.message.includes("Source site is blocked");

    await finishImportJob(jobId, isBlocked ? "blocked" : "failed", {
      skippedCount: safeLimit,
      errorMessage: error instanceof Error ? error.message : "Unknown promotion error"
    });

    throw error;
  }
}

async function main() {
  const { sourceName, limit, status, dryRun } = parseArgs();
  const result = await promoteManualCandidates(sourceName, limit, status, dryRun);

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
