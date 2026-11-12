import { closePool, query } from "../db";
import {
  createEmbeddings,
  isEmbeddingConfigured,
  toVectorLiteral
} from "../embeddings";
import { env } from "../env";

type PendingChunk = {
  id: string;
  manualId: string;
  revisionId: string;
  embeddingContent: string;
  contentHash: string;
};

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs() {
  const manualArg = process.argv.find((arg) => arg.startsWith("--manual-id="));
  const revisionArg = process.argv.find((arg) =>
    arg.startsWith("--revision-id=")
  );
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const batchSizeArg = process.argv.find((arg) =>
    arg.startsWith("--batch-size=")
  );

  return {
    manualId: manualArg?.replace("--manual-id=", ""),
    revisionId: revisionArg?.replace("--revision-id=", ""),
    limit: Math.min(
      parsePositiveInteger(limitArg?.replace("--limit=", ""), 1000),
      10_000
    ),
    batchSize: Math.min(
      parsePositiveInteger(batchSizeArg?.replace("--batch-size=", ""), 64),
      256
    ),
    force: process.argv.includes("--force"),
    dryRun: process.argv.includes("--dry-run")
  };
}

async function createImportJob(dryRun: boolean, args: ReturnType<typeof parseArgs>) {
  const result = await query<{ id: string }>(
    `
      insert into import_jobs (
        job_type,
        status,
        requested_mode,
        started_at,
        metadata
      )
      values ('embed_manual_chunks', 'running', 'full_text', now(), $1::jsonb)
      returning id
    `,
    [
      JSON.stringify({
        dryRun,
        manualId: args.manualId,
        revisionId: args.revisionId,
        model: env.geminiEmbeddingModel,
        dimensions: env.geminiEmbeddingDimensions
      })
    ]
  );

  return result.rows[0].id;
}

async function finishImportJob(
  jobId: string,
  status: "succeeded" | "failed",
  importedCount: number,
  skippedCount: number,
  errorMessage?: string
) {
  await query(
    `
      update import_jobs
      set
        status = $2,
        finished_at = now(),
        found_count = $3::integer + $4::integer,
        imported_count = $3,
        skipped_count = $4,
        error_message = $5
      where id = $1
    `,
    [jobId, status, importedCount, skippedCount, errorMessage ?? null]
  );
}

async function loadPendingChunks(args: ReturnType<typeof parseArgs>) {
  const params: unknown[] = [
    env.geminiEmbeddingModel,
    env.geminiEmbeddingDimensions
  ];
  const filters = [
    "manual_revisions.ingestion_status in ('parsed', 'embedding', 'ready')"
  ];

  if (!args.force) {
    filters.push(`(
      manual_chunks.embedding is null or
      manual_chunks.embedding_model is distinct from $1 or
      manual_chunks.embedding_dimensions is distinct from $2 or
      manual_chunks.embedding_source_hash is distinct from manual_chunks.content_hash
    )`);
  }

  if (args.manualId) {
    params.push(args.manualId);
    filters.push(`manual_chunks.manual_id = $${params.length}`);
  }

  if (args.revisionId) {
    params.push(args.revisionId);
    filters.push(`manual_chunks.revision_id = $${params.length}`);
  }

  params.push(args.limit);
  const result = await query<PendingChunk>(
    `
      select
        manual_chunks.id,
        manual_chunks.manual_id as "manualId",
        manual_chunks.revision_id as "revisionId",
        manual_chunks.embedding_content as "embeddingContent",
        manual_chunks.content_hash as "contentHash"
      from manual_chunks
      join manual_revisions
        on manual_revisions.id = manual_chunks.revision_id
      where ${filters.join(" and ")}
      order by
        manual_revisions.created_at asc,
        manual_chunks.chunk_index asc
      limit $${params.length}
    `,
    params
  );

  return result.rows;
}

async function markRevisionsProcessing(revisionIds: string[]) {
  if (revisionIds.length === 0) {
    return;
  }

  await query(
    `
      update manual_revisions
      set
        ingestion_status = 'embedding',
        embedding_status = 'processing',
        error_message = null
      where id = any($1::uuid[])
    `,
    [revisionIds]
  );
  await query(
    `
      update manuals
      set ingestion_status = 'embedding'
      where id in (
        select manual_id
        from manual_revisions
        where id = any($1::uuid[])
      )
    `,
    [revisionIds]
  );
}

async function updateRevisionCompletion(revisionIds: string[]) {
  for (const revisionId of revisionIds) {
    const result = await query<{ manualId: string; remaining: number }>(
      `
        select
          manual_revisions.manual_id as "manualId",
          count(manual_chunks.id) filter (
            where manual_chunks.embedding is null or
              manual_chunks.embedding_source_hash is distinct from manual_chunks.content_hash
          )::int as remaining
        from manual_revisions
        left join manual_chunks
          on manual_chunks.revision_id = manual_revisions.id
        where manual_revisions.id = $1
        group by manual_revisions.manual_id
      `,
      [revisionId]
    );

    if (result.rowCount === 0) {
      continue;
    }

    const { manualId, remaining } = result.rows[0];
    await query(
      `
        update manual_revisions
        set
          ingestion_status = case when $2 = 0 then 'ready' else 'parsed' end,
          embedding_status = case when $2 = 0 then 'ready' else 'pending' end,
          error_message = null
        where id = $1
      `,
      [revisionId, remaining]
    );
    await query(
      `
        update manuals
        set ingestion_status = case
          when exists (
            select 1
            from manual_revisions
            where manual_revisions.manual_id = manuals.id
              and manual_revisions.ingestion_status = 'ready'
          ) then 'ready'
          else 'parsed'
        end
        where id = $1
      `,
      [manualId]
    );
  }
}

async function main() {
  const args = parseArgs();

  if (env.geminiEmbeddingDimensions !== 1024) {
    throw new Error(
      "GEMINI_EMBEDDING_DIMENSIONS must be 1024 for the current vector(1024) schema."
    );
  }

  const jobId = await createImportJob(args.dryRun, args);
  const chunks = await loadPendingChunks(args);
  const revisionIds = Array.from(
    new Set(chunks.map((chunk) => chunk.revisionId))
  );

  if (args.dryRun) {
    await finishImportJob(jobId, "succeeded", 0, chunks.length);
    console.log(
      JSON.stringify(
        {
          jobId,
          configured: isEmbeddingConfigured(),
          pendingChunkCount: chunks.length,
          revisionCount: revisionIds.length,
          model: env.geminiEmbeddingModel,
          dimensions: env.geminiEmbeddingDimensions,
          dryRun: true
        },
        null,
        2
      )
    );
    return;
  }

  if (!isEmbeddingConfigured()) {
    await finishImportJob(
      jobId,
      "failed",
      0,
      chunks.length,
      "GEMINI_API_KEY is required."
    );
    throw new Error(
      "GEMINI_API_KEY is required. Run with --dry-run to inspect pending chunks."
    );
  }

  await markRevisionsProcessing(revisionIds);
  let embeddedCount = 0;

  try {
    for (let index = 0; index < chunks.length; index += args.batchSize) {
      const batch = chunks.slice(index, index + args.batchSize);
      const embeddings = await createEmbeddings(
        batch.map((chunk) => chunk.embeddingContent)
      );

      if (embeddings.length !== batch.length) {
        throw new Error(
          `Embedding response count mismatch: expected ${batch.length}, received ${embeddings.length}`
        );
      }

      for (const [batchIndex, chunk] of batch.entries()) {
        await query(
          `
            update manual_chunks
            set
              embedding = $2::vector(1024),
              embedding_model = $3,
              embedding_dimensions = $4,
              embedding_source_hash = $5,
              embedded_at = now()
            where id = $1
          `,
          [
            chunk.id,
            toVectorLiteral(embeddings[batchIndex]),
            env.geminiEmbeddingModel,
            env.geminiEmbeddingDimensions,
            chunk.contentHash
          ]
        );
        embeddedCount += 1;
      }
    }

    await updateRevisionCompletion(revisionIds);
    await finishImportJob(
      jobId,
      "succeeded",
      embeddedCount,
      chunks.length - embeddedCount
    );

    console.log(
      JSON.stringify(
        {
          jobId,
          embeddedChunkCount: embeddedCount,
          revisionCount: revisionIds.length,
          model: env.geminiEmbeddingModel,
          dimensions: env.geminiEmbeddingDimensions,
          dryRun: false
        },
        null,
        2
      )
    );
  } catch (error) {
    if (revisionIds.length > 0) {
      await query(
        `
          update manual_revisions
          set
            ingestion_status = 'failed',
            embedding_status = 'failed',
            error_message = $2
          where id = any($1::uuid[])
        `,
        [
          revisionIds,
          error instanceof Error ? error.message : "Unknown embedding error"
        ]
      );
    }

    await finishImportJob(
      jobId,
      "failed",
      embeddedCount,
      chunks.length - embeddedCount,
      error instanceof Error ? error.message : "Unknown embedding error"
    );
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
