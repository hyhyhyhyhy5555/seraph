import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response
} from "express";
import { z } from "zod";

import { query } from "./db";
import { env } from "./env";

type CategoryRow = {
  id: string;
  parent_id: string | null;
  depth: number;
  slug: string;
  slug_path: string;
  name: string;
  description: string | null;
  sort_order: number;
  manual_count: number;
};

type CategoryNode = {
  id: string;
  parentId: string | null;
  depth: number;
  slug: string;
  slugPath: string;
  name: string;
  description: string | null;
  sortOrder: number;
  manualCount: number;
  children: CategoryNode[];
};

type SourceCategoryRow = {
  id: string;
  parent_id: string | null;
  source_site_id: string;
  source_url: string;
  source_slug_path: string;
  name: string;
  depth: number;
  category_kind: string;
  discovered_at: string;
  mappings: unknown[];
};

type SourceCategoryNode = {
  id: string;
  parentId: string | null;
  sourceSiteId: string;
  sourceUrl: string;
  sourceSlugPath: string;
  name: string;
  depth: number;
  categoryKind: string;
  discoveredAt: string;
  mappings: unknown[];
  children: SourceCategoryNode[];
};

type RagEvidence = {
  chunkId: string;
  manualId: string;
  title: string;
  modelName: string | null;
  manufacturerName: string | null;
  categoryName: string;
  categorySlugPath: string;
  sourceUrl: string | null;
  pdfUrl: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  content: string;
  score: number;
};

const importPolicySchema = z.enum([
  "metadata_only",
  "licensed_full_text",
  "official_full_text",
  "blocked"
]);
const rightsStatusSchema = z.enum([
  "needs_permission",
  "allowed",
  "licensed",
  "blocked"
]);

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

function buildCategoryTree(rows: CategoryRow[]) {
  const nodes = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const row of rows) {
    nodes.set(row.id, {
      id: row.id,
      parentId: row.parent_id,
      depth: row.depth,
      slug: row.slug,
      slugPath: row.slug_path,
      name: row.name,
      description: row.description,
      sortOrder: row.sort_order,
      manualCount: row.manual_count,
      children: []
    });
  }

  for (const node of nodes.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }

    nodes.get(node.parentId)?.children.push(node);
  }

  return roots;
}

function buildSourceCategoryTree(rows: SourceCategoryRow[]) {
  const nodes = new Map<string, SourceCategoryNode>();
  const roots: SourceCategoryNode[] = [];

  for (const row of rows) {
    nodes.set(row.id, {
      id: row.id,
      parentId: row.parent_id,
      sourceSiteId: row.source_site_id,
      sourceUrl: row.source_url,
      sourceSlugPath: row.source_slug_path,
      name: row.name,
      depth: row.depth,
      categoryKind: row.category_kind,
      discoveredAt: row.discovered_at,
      mappings: row.mappings,
      children: []
    });
  }

  for (const node of nodes.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }

    nodes.get(node.parentId)?.children.push(node);
  }

  return roots;
}

function toPositiveInteger(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function defaultImportPolicyForRights(rightsStatus: z.infer<typeof rightsStatusSchema>) {
  if (rightsStatus === "allowed") {
    return "official_full_text";
  }

  if (rightsStatus === "licensed") {
    return "licensed_full_text";
  }

  if (rightsStatus === "blocked") {
    return "blocked";
  }

  return "metadata_only";
}

function extractSearchTerms(question: string) {
  const normalized = question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  const stopWords = new Set([
    "이거",
    "그거",
    "저거",
    "어떻게",
    "어디",
    "뭐야",
    "무엇",
    "설명서",
    "사용",
    "방법",
    "알려줘",
    "해주세요",
    "해줘",
    "하는",
    "하고",
    "있어",
    "있나요",
    "되나요",
    "please"
  ]);

  return Array.from(new Set(normalized.filter((term) => !stopWords.has(term)))).slice(
    0,
    12
  );
}

async function retrieveRagEvidence(question: string, limit = 5) {
  const terms = extractSearchTerms(question);
  const searchText = terms.length > 0 ? terms.join(" ") : question;
  const exactPattern = `%${question}%`;

  const result = await query<RagEvidence>(
    `
      with ranked_chunks as (
        select
          manual_chunks.id as "chunkId",
          manuals.id as "manualId",
          manuals.title,
          manuals.model_name as "modelName",
          manufacturers.name as "manufacturerName",
          categories.name as "categoryName",
          categories.slug_path as "categorySlugPath",
          manuals.source_url as "sourceUrl",
          manuals.pdf_url as "pdfUrl",
          manual_chunks.page_start as "pageStart",
          manual_chunks.page_end as "pageEnd",
          manual_chunks.content,
          (
            case
              when manual_chunks.search_vector @@ plainto_tsquery('simple', $1) then 16
              else 0
            end +
            case when manual_chunks.content ilike $2 then 12 else 0 end +
            coalesce((
              select sum(
                case
                  when
                    manual_chunks.content ilike '%' || term || '%' and
                    term ~ '[0-9]' and
                    term ~ '[[:alpha:]]' and
                    length(term) <= 8
                  then 30
                  when
                    manual_chunks.content ilike '%' || term || '%' and
                    term ~ '^[0-9]+$'
                  then 4
                  when
                    manual_chunks.content ilike '%' || term || '%' and
                    length(term) >= 3
                  then 12
                  when manual_chunks.content ilike '%' || term || '%' then 3
                  else 0
                end
              )
              from unnest($3::text[]) as term
            ), 0)
          )::int as content_score,
          (
            case when manuals.title ilike $2 then 10 else 0 end +
            case when coalesce(manuals.model_name, '') ilike $2 then 10 else 0 end +
            case when coalesce(manufacturers.name, '') ilike $2 then 8 else 0 end +
            coalesce((
              select sum(
                case when manuals.title ilike '%' || term || '%' then 3 else 0 end +
                case when coalesce(manuals.model_name, '') ilike '%' || term || '%' then 3 else 0 end +
                case when coalesce(manufacturers.name, '') ilike '%' || term || '%' then 2 else 0 end +
                case when categories.name ilike '%' || term || '%' then 2 else 0 end
              )
              from unnest($3::text[]) as term
            ), 0)
          )::int as metadata_score
        from manual_chunks
        join manuals on manuals.id = manual_chunks.manual_id
        join categories on categories.id = manuals.category_id
        left join manufacturers on manufacturers.id = manuals.manufacturer_id
        where manuals.ingestion_status = 'ready'
      )
      select
        "chunkId",
        "manualId",
        title,
        "modelName",
        "manufacturerName",
        "categoryName",
        "categorySlugPath",
        "sourceUrl",
        "pdfUrl",
        "pageStart",
        "pageEnd",
        content,
        (content_score + metadata_score) as score
      from ranked_chunks
      where content_score + metadata_score > 0
      order by content_score + metadata_score desc, content_score desc, title asc, "pageStart" asc nulls last
      limit $4
    `,
    [searchText, exactPattern, terms, limit]
  );

  return result.rows;
}

function buildRagAnswer(question: string, evidence: RagEvidence[]) {
  if (evidence.length === 0) {
    return {
      answer:
        "현재 더미 설명서에서는 질문과 직접 연결되는 내용을 찾지 못했습니다. 제품명, 제조사, 모델명, 증상을 더 구체적으로 입력하면 검색 범위를 좁힐 수 있습니다.",
      citations: []
    };
  }

  const primary = evidence[0];
  const pageText =
    primary.pageStart && primary.pageEnd
      ? primary.pageStart === primary.pageEnd
        ? `${primary.pageStart}페이지`
        : `${primary.pageStart}-${primary.pageEnd}페이지`
      : "페이지 정보 없음";

  const answer = [
    `${primary.title} 기준으로 보면, 관련 내용은 다음과 같습니다.`,
    "",
    primary.content,
    "",
    `출처: ${primary.manufacturerName ?? "제조사 미상"} · ${primary.categoryName} · ${pageText}`
  ].join("\n");

  const citations = evidence.map((item) => ({
    chunkId: item.chunkId,
    manualId: item.manualId,
    title: item.title,
    manufacturerName: item.manufacturerName,
    modelName: item.modelName,
    categoryName: item.categoryName,
    categorySlugPath: item.categorySlugPath,
    pageStart: item.pageStart,
    pageEnd: item.pageEnd,
    sourceUrl: item.sourceUrl,
    pdfUrl: item.pdfUrl,
    score: item.score,
    excerpt: item.content
  }));

  return {
    answer,
    citations
  };
}

app.get(
  "/health",
  asyncHandler(async (_request, response) => {
    const startedAt = Date.now();

    try {
      await query("select 1 as ok");

      response.json({
        ok: true,
        service: "seraph-backend",
        db: "up",
        latencyMs: Date.now() - startedAt
      });
    } catch (error) {
      response.status(503).json({
        ok: false,
        service: "seraph-backend",
        db: "down",
        message: error instanceof Error ? error.message : "Database unavailable"
      });
    }
  })
);

app.get(
  "/api/categories",
  asyncHandler(async (_request, response) => {
    const result = await query<CategoryRow>(`
      select
        c.id,
        c.parent_id,
        c.depth,
        c.slug,
        c.slug_path,
        c.name,
        c.description,
        c.sort_order,
        count(m.id)::int as manual_count
      from categories c
      left join manuals m on m.category_id = c.id
      group by c.id
      order by c.depth asc, c.sort_order asc, c.name asc
    `);

    response.json({
      data: buildCategoryTree(result.rows)
    });
  })
);

app.get(
  "/api/manufacturers",
  asyncHandler(async (_request, response) => {
    const result = await query(`
      select
        manufacturers.id,
        manufacturers.name,
        manufacturers.slug,
        manufacturers.country_code as "countryCode",
        manufacturers.website_url as "websiteUrl",
        count(manuals.id)::int as "manualCount"
      from manufacturers
      left join manuals on manuals.manufacturer_id = manufacturers.id
      group by manufacturers.id
      order by manufacturers.name asc
    `);

    response.json({ data: result.rows });
  })
);

app.get(
  "/api/source-sites",
  asyncHandler(async (_request, response) => {
    const result = await query(`
      select
        source_sites.id,
        source_sites.name,
        source_sites.base_url as "baseUrl",
        source_sites.robots_txt_url as "robotsTxtUrl",
        source_sites.terms_url as "termsUrl",
        source_sites.contact_url as "contactUrl",
        source_sites.owner_name as "ownerName",
        source_sites.import_policy as "importPolicy",
        source_sites.rights_status as "rightsStatus",
        source_sites.license_url as "licenseUrl",
        source_sites.permission_document_url as "permissionDocumentUrl",
        source_sites.permission_checked_at as "permissionCheckedAt",
        source_sites.permission_checked_by as "permissionCheckedBy",
        source_sites.notes,
        coalesce(category_counts.category_count, 0)::int as "categoryCount",
        coalesce(candidate_counts.candidate_count, 0)::int as "candidateCount",
        latest_job.job as "latestJob"
      from source_sites
      left join lateral (
        select count(*)::int as category_count
        from source_categories
        where source_categories.source_site_id = source_sites.id
      ) category_counts on true
      left join lateral (
        select count(*)::int as candidate_count
        from manual_import_candidates
        where manual_import_candidates.source_site_id = source_sites.id
      ) candidate_counts on true
      left join lateral (
        select json_build_object(
          'id', import_jobs.id,
          'jobType', import_jobs.job_type,
          'status', import_jobs.status,
          'requestedMode', import_jobs.requested_mode,
          'scopeUrl', import_jobs.scope_url,
          'foundCount', import_jobs.found_count,
          'importedCount', import_jobs.imported_count,
          'skippedCount', import_jobs.skipped_count,
          'errorMessage', import_jobs.error_message,
          'startedAt', import_jobs.started_at,
          'finishedAt', import_jobs.finished_at
        ) as job
        from import_jobs
        where import_jobs.source_site_id = source_sites.id
        order by import_jobs.created_at desc
        limit 1
      ) latest_job on true
      order by source_sites.name asc
    `);

    response.json({ data: result.rows });
  })
);

app.get(
  "/api/source-sites/:id/categories",
  asyncHandler(async (request, response) => {
    const result = await query<SourceCategoryRow>(
      `
        select
          source_categories.id,
          source_categories.parent_id,
          source_categories.source_site_id,
          source_categories.source_url,
          source_categories.source_slug_path,
          source_categories.name,
          source_categories.depth,
          source_categories.category_kind,
          source_categories.discovered_at,
          coalesce(
            json_agg(
              json_build_object(
                'id', category_source_mappings.id,
                'status', category_source_mappings.mapping_status,
                'confidence', category_source_mappings.confidence,
                'categoryId', categories.id,
                'categoryName', categories.name,
                'categorySlugPath', categories.slug_path
              )
              order by category_source_mappings.confidence desc
            ) filter (where category_source_mappings.id is not null),
            '[]'::json
          ) as mappings
        from source_categories
        left join category_source_mappings
          on category_source_mappings.source_category_id = source_categories.id
        left join categories
          on categories.id = category_source_mappings.category_id
        where source_categories.source_site_id = $1
        group by source_categories.id
        order by
          source_categories.depth asc,
          source_categories.category_kind asc,
          source_categories.name asc
      `,
      [request.params.id]
    );

    response.json({
      data: buildSourceCategoryTree(result.rows)
    });
  })
);

app.get(
  "/api/source-sites/:id/rights-events",
  asyncHandler(async (request, response) => {
    const limit = toPositiveInteger(request.query.limit, 50, 200);

    const result = await query(
      `
        select
          id,
          previous_import_policy as "previousImportPolicy",
          new_import_policy as "newImportPolicy",
          previous_rights_status as "previousRightsStatus",
          new_rights_status as "newRightsStatus",
          license_url as "licenseUrl",
          permission_document_url as "permissionDocumentUrl",
          reviewed_by as "reviewedBy",
          reason,
          metadata,
          created_at as "createdAt"
        from source_rights_events
        where source_site_id = $1
        order by created_at desc
        limit $2
      `,
      [request.params.id, limit]
    );

    response.json({ data: result.rows });
  })
);

const updateSourceRightsSchema = z
  .object({
    rightsStatus: rightsStatusSchema,
    importPolicy: importPolicySchema.optional(),
    licenseUrl: z.string().url().nullable().optional(),
    permissionDocumentUrl: z.string().url().nullable().optional(),
    permissionCheckedBy: z.string().min(1).max(120).optional(),
    notes: z.string().max(4000).optional(),
    reason: z.string().min(1).max(2000),
    metadata: z.record(z.string(), z.unknown()).default({})
  })
  .superRefine((value, context) => {
    const opensFullText =
      value.rightsStatus === "allowed" || value.rightsStatus === "licensed";

    if (opensFullText && !value.licenseUrl && !value.permissionDocumentUrl) {
      context.addIssue({
        code: "custom",
        path: ["permissionDocumentUrl"],
        message:
          "allowed/licensed 상태로 변경하려면 licenseUrl 또는 permissionDocumentUrl이 필요합니다."
      });
    }
  });

app.patch(
  "/api/source-sites/:id/rights",
  asyncHandler(async (request, response) => {
    const body = updateSourceRightsSchema.parse(request.body);
    const nextImportPolicy =
      body.importPolicy ?? defaultImportPolicyForRights(body.rightsStatus);
    const checkedAt =
      body.rightsStatus === "needs_permission" ? null : new Date().toISOString();
    const checkedBy =
      body.rightsStatus === "needs_permission" ? null : body.permissionCheckedBy ?? null;

    const result = await query(
      `
        with current_source as (
          select
            id,
            import_policy,
            rights_status,
            license_url,
            permission_document_url,
            permission_checked_by,
            notes
          from source_sites
          where id = $1
        ),
        updated_source as (
          update source_sites
          set
            import_policy = $2,
            rights_status = $3,
            license_url = $4,
            permission_document_url = $5,
            permission_checked_at = $6,
            permission_checked_by = $7,
            notes = $8
          from current_source
          where source_sites.id = current_source.id
          returning
            source_sites.*,
            current_source.import_policy as previous_import_policy,
            current_source.rights_status as previous_rights_status
        ),
        rights_event as (
          insert into source_rights_events (
            source_site_id,
            previous_import_policy,
            new_import_policy,
            previous_rights_status,
            new_rights_status,
            license_url,
            permission_document_url,
            reviewed_by,
            reason,
            metadata
          )
          select
            updated_source.id,
            updated_source.previous_import_policy,
            updated_source.import_policy,
            updated_source.previous_rights_status,
            updated_source.rights_status,
            updated_source.license_url,
            updated_source.permission_document_url,
            $9,
            $10,
            $11::jsonb
          from updated_source
          returning
            id,
            previous_import_policy,
            new_import_policy,
            previous_rights_status,
            new_rights_status,
            license_url,
            permission_document_url,
            reviewed_by,
            reason,
            metadata,
            created_at
        )
        select json_build_object(
          'sourceSite',
          json_build_object(
            'id', updated_source.id,
            'name', updated_source.name,
            'baseUrl', updated_source.base_url,
            'importPolicy', updated_source.import_policy,
            'rightsStatus', updated_source.rights_status,
            'licenseUrl', updated_source.license_url,
            'permissionDocumentUrl', updated_source.permission_document_url,
            'permissionCheckedAt', updated_source.permission_checked_at,
            'permissionCheckedBy', updated_source.permission_checked_by,
            'notes', updated_source.notes
          ),
          'event',
          json_build_object(
            'id', rights_event.id,
            'previousImportPolicy', rights_event.previous_import_policy,
            'newImportPolicy', rights_event.new_import_policy,
            'previousRightsStatus', rights_event.previous_rights_status,
            'newRightsStatus', rights_event.new_rights_status,
            'licenseUrl', rights_event.license_url,
            'permissionDocumentUrl', rights_event.permission_document_url,
            'reviewedBy', rights_event.reviewed_by,
            'reason', rights_event.reason,
            'metadata', rights_event.metadata,
            'createdAt', rights_event.created_at
          )
        ) as data
        from updated_source
        join rights_event on true
      `,
      [
        request.params.id,
        nextImportPolicy,
        body.rightsStatus,
        body.licenseUrl ?? null,
        body.permissionDocumentUrl ?? null,
        checkedAt,
        checkedBy,
        body.notes ?? null,
        body.permissionCheckedBy ?? null,
        body.reason,
        JSON.stringify(body.metadata)
      ]
    );

    if (result.rowCount === 0) {
      response.status(404).json({ error: "Source site not found" });
      return;
    }

    response.json({ data: result.rows[0].data });
  })
);

app.get(
  "/api/import-jobs",
  asyncHandler(async (request, response) => {
    const sourceSiteId =
      typeof request.query.sourceSiteId === "string" ? request.query.sourceSiteId : "";
    const status = typeof request.query.status === "string" ? request.query.status : "";
    const jobType = typeof request.query.jobType === "string" ? request.query.jobType : "";
    const limit = toPositiveInteger(request.query.limit, 50, 200);

    const params: unknown[] = [];
    const filters: string[] = [];

    if (sourceSiteId) {
      params.push(sourceSiteId);
      filters.push(`import_jobs.source_site_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      filters.push(`import_jobs.status = $${params.length}`);
    }

    if (jobType) {
      params.push(jobType);
      filters.push(`import_jobs.job_type = $${params.length}`);
    }

    params.push(limit);
    const where = filters.length > 0 ? `where ${filters.join(" and ")}` : "";

    const result = await query(
      `
        select
          import_jobs.id,
          import_jobs.job_type as "jobType",
          import_jobs.scope_url as "scopeUrl",
          import_jobs.status,
          import_jobs.requested_mode as "requestedMode",
          import_jobs.started_at as "startedAt",
          import_jobs.finished_at as "finishedAt",
          import_jobs.found_count as "foundCount",
          import_jobs.imported_count as "importedCount",
          import_jobs.skipped_count as "skippedCount",
          import_jobs.error_message as "errorMessage",
          import_jobs.metadata,
          import_jobs.created_at as "createdAt",
          case when source_sites.id is null then null else json_build_object(
            'id', source_sites.id,
            'name', source_sites.name,
            'rightsStatus', source_sites.rights_status,
            'importPolicy', source_sites.import_policy
          ) end as "sourceSite"
        from import_jobs
        left join source_sites on source_sites.id = import_jobs.source_site_id
        ${where}
        order by import_jobs.created_at desc
        limit $${params.length}
      `,
      params
    );

    response.json({ data: result.rows });
  })
);

app.get(
  "/api/manual-import-candidates",
  asyncHandler(async (request, response) => {
    const sourceSiteId =
      typeof request.query.sourceSiteId === "string" ? request.query.sourceSiteId : "";
    const status = typeof request.query.status === "string" ? request.query.status : "";
    const search = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const limit = toPositiveInteger(request.query.limit, 50, 200);

    const params: unknown[] = [];
    const filters: string[] = [];

    if (sourceSiteId) {
      params.push(sourceSiteId);
      filters.push(`manual_import_candidates.source_site_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      filters.push(`manual_import_candidates.candidate_status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      filters.push(`(
        manual_import_candidates.title ilike $${params.length} or
        coalesce(manual_import_candidates.manufacturer_name, '') ilike $${params.length} or
        coalesce(manual_import_candidates.model_name, '') ilike $${params.length}
      )`);
    }

    params.push(limit);
    const where = filters.length > 0 ? `where ${filters.join(" and ")}` : "";

    const result = await query(
      `
        select
          manual_import_candidates.id,
          manual_import_candidates.title,
          manual_import_candidates.manufacturer_name as "manufacturerName",
          manual_import_candidates.model_name as "modelName",
          manual_import_candidates.source_manual_url as "sourceManualUrl",
          manual_import_candidates.source_pdf_url as "sourcePdfUrl",
          manual_import_candidates.language_code as "languageCode",
          manual_import_candidates.category_path as "categoryPath",
          manual_import_candidates.candidate_status as "candidateStatus",
          manual_import_candidates.rights_status as "rightsStatus",
          manual_import_candidates.import_mode as "importMode",
          manual_import_candidates.discovered_at as "discoveredAt",
          manual_import_candidates.last_seen_at as "lastSeenAt",
          source_sites.name as "sourceSiteName",
          source_categories.name as "sourceCategoryName",
          source_categories.source_slug_path as "sourceCategorySlugPath"
        from manual_import_candidates
        join source_sites on source_sites.id = manual_import_candidates.source_site_id
        left join source_categories
          on source_categories.id = manual_import_candidates.source_category_id
        ${where}
        order by manual_import_candidates.discovered_at desc
        limit $${params.length}
      `,
      params
    );

    response.json({ data: result.rows });
  })
);

app.get(
  "/api/manuals",
  asyncHandler(async (request, response) => {
    const search = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const categoryId =
      typeof request.query.categoryId === "string" ? request.query.categoryId : "";
    const manufacturerId =
      typeof request.query.manufacturerId === "string"
        ? request.query.manufacturerId
        : "";
    const limit = toPositiveInteger(request.query.limit, 30, 100);

    const params: unknown[] = [];
    const filters: string[] = [];

    if (search) {
      params.push(search);
      const textParam = `$${params.length}`;
      params.push(`%${search}%`);
      const likeParam = `$${params.length}`;

      filters.push(`(
        manuals.search_vector @@ plainto_tsquery('simple', ${textParam}) or
        manuals.title ilike ${likeParam} or
        coalesce(manuals.model_name, '') ilike ${likeParam} or
        coalesce(manuals.summary, '') ilike ${likeParam} or
        coalesce(manufacturers.name, '') ilike ${likeParam} or
        categories.name ilike ${likeParam}
      )`);
    }

    if (categoryId) {
      params.push(categoryId);
      const categoryParam = `$${params.length}`;

      filters.push(`manuals.category_id in (
        with recursive category_tree as (
          select id from categories where id = ${categoryParam}
          union all
          select child.id
          from categories child
          join category_tree parent on parent.id = child.parent_id
        )
        select id from category_tree
      )`);
    }

    if (manufacturerId) {
      params.push(manufacturerId);
      filters.push(`manuals.manufacturer_id = $${params.length}`);
    }

    params.push(limit);
    const where = filters.length > 0 ? `where ${filters.join(" and ")}` : "";

    const result = await query(
      `
        select
          manuals.id,
          manuals.title,
          manuals.model_name as "modelName",
          manuals.language_code as "languageCode",
          manuals.source_url as "sourceUrl",
          manuals.pdf_url as "pdfUrl",
          manuals.source_type as "sourceType",
          manuals.ingestion_status as "ingestionStatus",
          manuals.rights_status as "rightsStatus",
          manuals.summary,
          json_build_object(
            'id', categories.id,
            'name', categories.name,
            'slugPath', categories.slug_path
          ) as category,
          case when manufacturers.id is null then null else json_build_object(
            'id', manufacturers.id,
            'name', manufacturers.name,
            'slug', manufacturers.slug
          ) end as manufacturer
        from manuals
        join categories on categories.id = manuals.category_id
        left join manufacturers on manufacturers.id = manuals.manufacturer_id
        ${where}
        order by manuals.updated_at desc, manuals.title asc
        limit $${params.length}
      `,
      params
    );

    response.json({ data: result.rows });
  })
);

app.get(
  "/api/manuals/:id",
  asyncHandler(async (request, response) => {
    const manualResult = await query(
      `
        select
          manuals.id,
          manuals.title,
          manuals.model_name as "modelName",
          manuals.normalized_model as "normalizedModel",
          manuals.language_code as "languageCode",
          manuals.source_url as "sourceUrl",
          manuals.pdf_url as "pdfUrl",
          manuals.storage_path as "storagePath",
          manuals.source_type as "sourceType",
          manuals.ingestion_status as "ingestionStatus",
          manuals.rights_status as "rightsStatus",
          manuals.summary,
          manuals.created_at as "createdAt",
          manuals.updated_at as "updatedAt",
          json_build_object(
            'id', categories.id,
            'name', categories.name,
            'slugPath', categories.slug_path
          ) as category,
          case when manufacturers.id is null then null else json_build_object(
            'id', manufacturers.id,
            'name', manufacturers.name,
            'slug', manufacturers.slug,
            'websiteUrl', manufacturers.website_url
          ) end as manufacturer
        from manuals
        join categories on categories.id = manuals.category_id
        left join manufacturers on manufacturers.id = manuals.manufacturer_id
        where manuals.id = $1
      `,
      [request.params.id]
    );

    if (manualResult.rowCount === 0) {
      response.status(404).json({ error: "Manual not found" });
      return;
    }

    const pagesResult = await query(
      `
        select page_number as "pageNumber", text_content as "textContent"
        from manual_pages
        where manual_id = $1
        order by page_number asc
      `,
      [request.params.id]
    );

    const chunksResult = await query(
      `
        select
          id,
          page_start as "pageStart",
          page_end as "pageEnd",
          chunk_index as "chunkIndex",
          content,
          token_count as "tokenCount",
          metadata
        from manual_chunks
        where manual_id = $1
        order by chunk_index asc
        limit 20
      `,
      [request.params.id]
    );

    response.json({
      data: {
        ...manualResult.rows[0],
        pages: pagesResult.rows,
        chunks: chunksResult.rows
      }
    });
  })
);

const contactRequestSchema = z.object({
  email: z.string().email().optional(),
  subject: z.string().min(1).max(120),
  message: z.string().min(1).max(4000)
});

app.post(
  "/api/contact-requests",
  asyncHandler(async (request, response) => {
    const body = contactRequestSchema.parse(request.body);
    const result = await query(
      `
        insert into contact_requests (email, subject, message)
        values ($1, $2, $3)
        returning id, email, subject, message, status, created_at as "createdAt"
      `,
      [body.email ?? null, body.subject, body.message]
    );

    response.status(201).json({ data: result.rows[0] });
  })
);

const manualRequestSchema = z.object({
  productName: z.string().min(1).max(160),
  manufacturerName: z.string().max(120).optional(),
  modelName: z.string().max(120).optional(),
  requesterEmail: z.string().email().optional(),
  note: z.string().max(2000).optional()
});

app.post(
  "/api/manual-requests",
  asyncHandler(async (request, response) => {
    const body = manualRequestSchema.parse(request.body);
    const result = await query(
      `
        insert into manual_requests (
          product_name,
          manufacturer_name,
          model_name,
          requester_email,
          note
        )
        values ($1, $2, $3, $4, $5)
        returning
          id,
          product_name as "productName",
          manufacturer_name as "manufacturerName",
          model_name as "modelName",
          requester_email as "requesterEmail",
          note,
          status,
          created_at as "createdAt"
      `,
      [
        body.productName,
        body.manufacturerName ?? null,
        body.modelName ?? null,
        body.requesterEmail ?? null,
        body.note ?? null
      ]
    );

    response.status(201).json({ data: result.rows[0] });
  })
);

const createChatSessionSchema = z.object({
  title: z.string().max(120).optional(),
  clientId: z.string().max(120).optional()
});

app.post(
  "/api/chat/sessions",
  asyncHandler(async (request, response) => {
    const body = createChatSessionSchema.parse(request.body);
    const result = await query(
      `
        insert into chat_sessions (title, client_id)
        values ($1, $2)
        returning id, title, client_id as "clientId", created_at as "createdAt"
      `,
      [body.title ?? null, body.clientId ?? null]
    );

    response.status(201).json({ data: result.rows[0] });
  })
);

app.get(
  "/api/chat/sessions/:id/messages",
  asyncHandler(async (request, response) => {
    const result = await query(
      `
        select id, role, content, citations, created_at as "createdAt"
        from chat_messages
        where session_id = $1
        order by created_at asc
      `,
      [request.params.id]
    );

    response.json({ data: result.rows });
  })
);

const createChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]).default("user"),
  content: z.string().min(1).max(12000),
  citations: z.array(z.unknown()).default([])
});

app.post(
  "/api/chat/sessions/:id/messages",
  asyncHandler(async (request, response) => {
    const body = createChatMessageSchema.parse(request.body);
    const result = await query(
      `
        insert into chat_messages (session_id, role, content, citations)
        values ($1, $2, $3, $4::jsonb)
        returning id, session_id as "sessionId", role, content, citations, created_at as "createdAt"
      `,
      [request.params.id, body.role, body.content, JSON.stringify(body.citations)]
    );

    response.status(201).json({ data: result.rows[0] });
  })
);

const ragSearchSchema = z.object({
  question: z.string().min(1).max(12000),
  limit: z.number().int().min(1).max(10).optional()
});

app.post(
  "/api/rag/search",
  asyncHandler(async (request, response) => {
    const body = ragSearchSchema.parse(request.body);
    const evidence = await retrieveRagEvidence(body.question, body.limit ?? 5);

    response.json({
      data: {
        query: body.question,
        evidence
      }
    });
  })
);

const askSchema = z.object({
  sessionId: z.string().uuid().optional(),
  question: z.string().min(1).max(12000),
  clientId: z.string().max(120).optional()
});

app.post(
  "/api/chat/ask",
  asyncHandler(async (request, response) => {
    const body = askSchema.parse(request.body);
    const sessionId = body.sessionId ?? (await createChatSession(body.clientId));
    const evidence = await retrieveRagEvidence(body.question);
    const ragResponse = buildRagAnswer(body.question, evidence);

    const userMessage = await insertChatMessage(sessionId, "user", body.question, []);
    const assistantMessage = await insertChatMessage(
      sessionId,
      "assistant",
      ragResponse.answer,
      ragResponse.citations
    );

    response.status(201).json({
      data: {
        sessionId,
        answer: ragResponse.answer,
        citations: ragResponse.citations,
        messages: [userMessage, assistantMessage]
      }
    });
  })
);

async function createChatSession(clientId?: string) {
  const result = await query<{ id: string }>(
    `
      insert into chat_sessions (title, client_id)
      values ($1, $2)
      returning id
    `,
    ["새 설명서 질문", clientId ?? null]
  );

  return result.rows[0].id;
}

async function insertChatMessage(
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  citations: unknown[]
) {
  const result = await query(
    `
      insert into chat_messages (session_id, role, content, citations)
      values ($1, $2, $3, $4::jsonb)
      returning id, session_id as "sessionId", role, content, citations, created_at as "createdAt"
    `,
    [sessionId, role, content, JSON.stringify(citations)]
  );

  return result.rows[0];
}

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({
      error: "Invalid request",
      issues: error.issues
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: "Internal server error"
  });
});

app.listen(env.port, () => {
  console.log(`Seraph backend listening on http://localhost:${env.port}`);
});
