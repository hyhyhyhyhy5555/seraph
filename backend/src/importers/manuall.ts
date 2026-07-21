import { query } from "../db";

type Link = {
  href: string;
  text: string;
};

type SourceCategoryKind = "department" | "product_type" | "manufacturer" | "category";

type DiscoverOptions = {
  rootUrl?: string;
  dryRun?: boolean;
};

class FetchStatusError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

class BlockedFetchError extends Error {}

const MANUALL_SOURCE_NAME = "Manuall KR";
const DEFAULT_ROOT_URL = "https://manuall.kr/";

function normalizeUrl(href: string, baseUrl: string) {
  return new URL(href, baseUrl).toString();
}

function extractLinks(html: string, baseUrl: string) {
  const links: Link[] = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = match[1];
    const rawText = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!href || !rawText) {
      continue;
    }

    const url = normalizeUrl(href, baseUrl);

    if (!url.startsWith("https://manuall.kr/")) {
      continue;
    }

    links.push({
      href: url,
      text: rawText
    });
  }

  return links;
}

function slugPathFromUrl(url: string) {
  const { pathname } = new URL(url);
  return pathname.replace(/^\/|\/$/g, "");
}

function categoryKindFromSlugPath(slugPath: string): SourceCategoryKind {
  const depth = slugPath.split("/").filter(Boolean).length;

  if (depth === 1) {
    return "department";
  }

  if (depth === 2) {
    return "product_type";
  }

  if (depth === 3) {
    return "manufacturer";
  }

  return "category";
}

function isBlockedChallengeHtml(html: string) {
  const lowerHtml = html.toLowerCase();

  return (
    lowerHtml.includes("<title>just a moment...</title>") ||
    lowerHtml.includes("challenges.cloudflare.com") ||
    lowerHtml.includes("enable javascript and cookies to continue")
  );
}

async function getManuallSourceSiteId() {
  const result = await query<{ id: string; import_policy: string; rights_status: string }>(
    `
      select id, import_policy, rights_status
      from source_sites
      where name = $1
    `,
    [MANUALL_SOURCE_NAME]
  );

  if (result.rowCount === 0) {
    throw new Error("Manuall KR source site is not seeded. Run DB migrations first.");
  }

  return result.rows[0];
}

async function createImportJob(sourceSiteId: string, scopeUrl: string, dryRun: boolean) {
  const result = await query<{ id: string }>(
    `
      insert into import_jobs (
        source_site_id,
        job_type,
        scope_url,
        status,
        requested_mode,
        started_at,
        metadata
      )
      values ($1, 'discover_categories', $2, 'running', 'metadata_only', now(), $3::jsonb)
      returning id
    `,
    [sourceSiteId, scopeUrl, JSON.stringify({ dryRun })]
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

async function upsertSourceCategory(sourceSiteId: string, link: Link) {
  const slugPath = slugPathFromUrl(link.href);
  const depth = Math.min(slugPath.split("/").filter(Boolean).length, 4);
  const categoryKind = categoryKindFromSlugPath(slugPath);

  await query(
    `
      insert into source_categories (
        source_site_id,
        source_url,
        source_slug_path,
        name,
        depth,
        category_kind,
        source_payload
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb)
      on conflict (source_site_id, source_slug_path) do update set
        source_url = excluded.source_url,
        name = excluded.name,
        depth = excluded.depth,
        category_kind = excluded.category_kind,
        source_payload = excluded.source_payload,
        discovered_at = now()
    `,
    [
      sourceSiteId,
      link.href,
      slugPath,
      link.text,
      depth,
      categoryKind,
      JSON.stringify({ discoveredBy: "manuall-metadata-importer" })
    ]
  );
}

async function discoverCategoryMetadata(options: DiscoverOptions = {}) {
  const rootUrl = options.rootUrl ?? DEFAULT_ROOT_URL;
  const dryRun = options.dryRun ?? false;
  const sourceSite = await getManuallSourceSiteId();
  const jobId = await createImportJob(sourceSite.id, rootUrl, dryRun);

  if (sourceSite.import_policy !== "metadata_only") {
    await finishImportJob(jobId, "blocked", {
      errorMessage: `Unexpected Manuall import policy: ${sourceSite.import_policy}`
    });
    throw new Error("Manuall importer only supports metadata_only mode.");
  }

  try {
    const response = await fetch(rootUrl, {
      headers: {
        "User-Agent": "SeraphBot/0.1 metadata-only contact: local-development"
      }
    });

    if (!response.ok) {
      throw new FetchStatusError(`Failed to fetch ${rootUrl}: ${response.status}`, response.status);
    }

    const html = await response.text();

    if (isBlockedChallengeHtml(html)) {
      throw new BlockedFetchError(
        `Blocked by anti-bot challenge while fetching ${rootUrl}. Use permissioned/API data or a provided export instead.`
      );
    }

    const links = extractLinks(html, rootUrl).filter((link) => {
      const slugPath = slugPathFromUrl(link.href);
      return slugPath.length > 0 && !slugPath.includes("manual/");
    });

    if (!dryRun) {
      for (const link of links) {
        await upsertSourceCategory(sourceSite.id, link);
      }
    }

    await finishImportJob(jobId, "succeeded", {
      foundCount: links.length,
      importedCount: dryRun ? 0 : links.length
    });

    return {
      jobId,
      foundCount: links.length,
      importedCount: dryRun ? 0 : links.length,
      dryRun
    };
  } catch (error) {
    const isBlocked =
      error instanceof BlockedFetchError ||
      (error instanceof FetchStatusError && (error.status === 401 || error.status === 403));

    await finishImportJob(jobId, isBlocked ? "blocked" : "failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown importer error"
    });
    throw error;
  }
}

async function main() {
  const mode = process.argv.includes("--dry-run") ? "dry-run" : "write";
  const urlArg = process.argv.find((arg) => arg.startsWith("--url="));

  const result = await discoverCategoryMetadata({
    rootUrl: urlArg?.replace("--url=", ""),
    dryRun: mode === "dry-run"
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
