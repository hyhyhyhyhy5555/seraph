create extension if not exists vector;
create extension if not exists pg_trgm;

alter table manuals
  drop constraint if exists manuals_ingestion_status_check;

alter table manuals
  add constraint manuals_ingestion_status_check check (
    ingestion_status in (
      'pending',
      'processing',
      'parsed',
      'embedding',
      'ready',
      'failed'
    )
  );

alter table import_jobs
  drop constraint if exists import_jobs_job_type_check;

alter table import_jobs
  add constraint import_jobs_job_type_check check (
    job_type in (
      'discover_categories',
      'discover_manuals',
      'ingest_pdf_text',
      'sync_metadata',
      'embed_manual_chunks'
    )
  );

create table if not exists manual_revisions (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references manuals(id) on delete cascade,
  revision_key text not null,
  version_label text,
  software_version text,
  language_code text not null default 'ko',
  source_url text,
  pdf_url text,
  storage_path text,
  source_type text not null default 'sample' check (
    source_type in ('official', 'partner', 'user_upload', 'sample')
  ),
  rights_status text not null default 'unknown' check (
    rights_status in ('unknown', 'allowed', 'licensed', 'user_provided', 'blocked')
  ),
  file_sha256 text check (
    file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'
  ),
  file_size_bytes bigint check (
    file_size_bytes is null or file_size_bytes > 0
  ),
  page_count integer check (
    page_count is null or page_count > 0
  ),
  pdf_created_at timestamptz,
  pdf_modified_at timestamptz,
  published_at date,
  parser_version text,
  chunker_version text,
  ingestion_status text not null default 'pending' check (
    ingestion_status in (
      'pending',
      'processing',
      'parsed',
      'embedding',
      'ready',
      'failed'
    )
  ),
  embedding_status text not null default 'pending' check (
    embedding_status in ('pending', 'processing', 'ready', 'failed')
  ),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manual_id, revision_key, language_code)
);

create unique index if not exists manual_revisions_file_sha256_idx
  on manual_revisions(file_sha256)
  where file_sha256 is not null;

create index if not exists manual_revisions_manual_status_idx
  on manual_revisions(manual_id, ingestion_status, embedding_status);

drop trigger if exists manual_revisions_set_updated_at on manual_revisions;
create trigger manual_revisions_set_updated_at
before update on manual_revisions
for each row execute function set_updated_at();

create table if not exists manual_applicability (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references manual_revisions(id) on delete cascade,
  product_name text not null,
  model_name text,
  software_version text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists manual_applicability_unique_idx
  on manual_applicability (
    revision_id,
    product_name,
    coalesce(model_name, ''),
    coalesce(software_version, '')
  );

insert into manual_revisions (
  manual_id,
  revision_key,
  version_label,
  language_code,
  source_url,
  pdf_url,
  storage_path,
  source_type,
  rights_status,
  ingestion_status,
  embedding_status,
  parser_version,
  chunker_version,
  metadata
)
select
  manuals.id,
  'legacy',
  'Legacy import',
  manuals.language_code,
  manuals.source_url,
  manuals.pdf_url,
  manuals.storage_path,
  manuals.source_type,
  manuals.rights_status,
  case
    when manuals.ingestion_status = 'ready' then 'parsed'
    else manuals.ingestion_status
  end,
  'pending',
  'legacy',
  'legacy',
  jsonb_build_object('backfilledBy', '009_manual_revisions_and_vector_search')
from manuals
where not exists (
  select 1
  from manual_revisions
  where manual_revisions.manual_id = manuals.id
);

alter table manual_pages
  add column if not exists revision_id uuid references manual_revisions(id) on delete cascade,
  add column if not exists printed_page_label text,
  add column if not exists is_embeddable boolean not null default true,
  add column if not exists layout_metadata jsonb not null default '{}'::jsonb;

update manual_pages
set revision_id = (
  select manual_revisions.id
  from manual_revisions
  where manual_revisions.manual_id = manual_pages.manual_id
  order by manual_revisions.created_at asc
  limit 1
)
where manual_pages.revision_id is null;

alter table manual_pages
  alter column revision_id set not null;

alter table manual_pages
  drop constraint if exists manual_pages_manual_id_page_number_key;

create unique index if not exists manual_pages_revision_page_idx
  on manual_pages(revision_id, page_number);

create index if not exists manual_pages_revision_id_idx
  on manual_pages(revision_id);

create table if not exists manual_sections (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references manual_revisions(id) on delete cascade,
  parent_id uuid references manual_sections(id) on delete cascade,
  section_key text not null,
  level smallint not null check (level between 1 and 6),
  ordinal integer not null check (ordinal >= 0),
  title text not null,
  page_start integer check (page_start is null or page_start > 0),
  page_end integer check (page_end is null or page_end > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (revision_id, section_key),
  unique (revision_id, ordinal),
  constraint manual_sections_page_range_check check (
    page_start is null or page_end is null or page_start <= page_end
  )
);

create index if not exists manual_sections_revision_ordinal_idx
  on manual_sections(revision_id, ordinal);

alter table manual_chunks
  add column if not exists revision_id uuid references manual_revisions(id) on delete cascade,
  add column if not exists section_id uuid references manual_sections(id) on delete set null,
  add column if not exists embedding_content text,
  add column if not exists content_type text not null default 'reference' check (
    content_type in (
      'overview',
      'procedure',
      'warning',
      'note',
      'troubleshooting',
      'reference',
      'visual'
    )
  ),
  add column if not exists content_hash text,
  add column if not exists embedding_source_hash text,
  add column if not exists embedded_at timestamptz;

update manual_chunks
set revision_id = (
  select manual_revisions.id
  from manual_revisions
  where manual_revisions.manual_id = manual_chunks.manual_id
  order by manual_revisions.created_at asc
  limit 1
)
where manual_chunks.revision_id is null;

update manual_chunks
set
  embedding_content = coalesce(embedding_content, content),
  content_hash = coalesce(
    content_hash,
    encode(digest(coalesce(embedding_content, content), 'sha256'), 'hex')
  )
where embedding_content is null or content_hash is null;

alter table manual_chunks
  alter column revision_id set not null,
  alter column embedding_content set not null,
  alter column content_hash set not null;

alter table manual_chunks
  drop constraint if exists manual_chunks_manual_id_chunk_index_key,
  drop constraint if exists manual_chunks_embedding_length_check;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = current_schema()
      and table_name = 'manual_chunks'
      and column_name = 'embedding'
      and data_type = 'ARRAY'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = current_schema()
      and table_name = 'manual_chunks'
      and column_name = 'embedding_legacy'
  ) then
    alter table manual_chunks rename column embedding to embedding_legacy;
  end if;
end
$$;

alter table manual_chunks
  add column if not exists embedding vector(1024);

create unique index if not exists manual_chunks_revision_chunk_idx
  on manual_chunks(revision_id, chunk_index);

create index if not exists manual_chunks_revision_id_idx
  on manual_chunks(revision_id);

create index if not exists manual_chunks_section_id_idx
  on manual_chunks(section_id);

create index if not exists manual_chunks_content_trgm_idx
  on manual_chunks using gin(content gin_trgm_ops);

create index if not exists manual_chunks_embedding_hnsw_idx
  on manual_chunks using hnsw(embedding vector_cosine_ops)
  where embedding is not null;

drop function if exists match_manual_chunks(double precision[], integer, uuid);

create or replace function match_manual_chunks(
  query_embedding vector(1024),
  match_count integer default 8,
  manual_filter uuid default null,
  revision_filter uuid default null
)
returns table (
  chunk_id uuid,
  manual_id uuid,
  revision_id uuid,
  title text,
  version_label text,
  software_version text,
  manufacturer_name text,
  page_start integer,
  page_end integer,
  content text,
  similarity double precision
)
language sql
stable
as $$
  select
    manual_chunks.id as chunk_id,
    manuals.id as manual_id,
    manual_revisions.id as revision_id,
    manuals.title,
    manual_revisions.version_label,
    manual_revisions.software_version,
    manufacturers.name as manufacturer_name,
    manual_chunks.page_start,
    manual_chunks.page_end,
    manual_chunks.content,
    1 - (manual_chunks.embedding <=> query_embedding) as similarity
  from manual_chunks
  join manual_revisions on manual_revisions.id = manual_chunks.revision_id
  join manuals on manuals.id = manual_revisions.manual_id
  left join manufacturers on manufacturers.id = manuals.manufacturer_id
  where manual_chunks.embedding is not null
    and manual_revisions.embedding_status = 'ready'
    and (manual_filter is null or manuals.id = manual_filter)
    and (revision_filter is null or manual_revisions.id = revision_filter)
  order by manual_chunks.embedding <=> query_embedding
  limit match_count;
$$;
