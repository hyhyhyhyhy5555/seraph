create table if not exists source_sites (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_url text not null unique,
  robots_txt_url text,
  terms_url text,
  contact_url text,
  owner_name text,
  import_policy text not null default 'metadata_only' check (
    import_policy in ('metadata_only', 'licensed_full_text', 'official_full_text', 'blocked')
  ),
  rights_status text not null default 'needs_permission' check (
    rights_status in ('needs_permission', 'allowed', 'licensed', 'blocked')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists source_categories (
  id uuid primary key default gen_random_uuid(),
  source_site_id uuid not null references source_sites(id) on delete cascade,
  parent_id uuid references source_categories(id) on delete cascade,
  source_url text not null,
  source_slug_path text not null,
  name text not null,
  depth smallint not null check (depth between 1 and 4),
  source_payload jsonb not null default '{}'::jsonb,
  discovered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_site_id, source_slug_path)
);

create index if not exists source_categories_site_parent_idx
  on source_categories(source_site_id, parent_id);

create table if not exists category_source_mappings (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  source_category_id uuid not null references source_categories(id) on delete cascade,
  confidence numeric(4, 3) not null default 1.0 check (
    confidence >= 0 and confidence <= 1
  ),
  mapping_status text not null default 'suggested' check (
    mapping_status in ('suggested', 'confirmed', 'rejected')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, source_category_id)
);

create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  source_site_id uuid references source_sites(id) on delete set null,
  job_type text not null check (
    job_type in ('discover_categories', 'discover_manuals', 'ingest_pdf_text', 'sync_metadata')
  ),
  scope_url text,
  status text not null default 'queued' check (
    status in ('queued', 'running', 'succeeded', 'failed', 'blocked')
  ),
  requested_mode text not null default 'metadata_only' check (
    requested_mode in ('metadata_only', 'full_text')
  ),
  started_at timestamptz,
  finished_at timestamptz,
  found_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists import_jobs_source_status_idx
  on import_jobs(source_site_id, status);

create table if not exists manual_import_candidates (
  id uuid primary key default gen_random_uuid(),
  source_site_id uuid not null references source_sites(id) on delete cascade,
  source_category_id uuid references source_categories(id) on delete set null,
  manual_id uuid references manuals(id) on delete set null,
  title text not null,
  manufacturer_name text,
  model_name text,
  source_manual_url text not null,
  source_pdf_url text,
  language_code text not null default 'ko',
  category_path text[] not null default array[]::text[],
  candidate_status text not null default 'discovered' check (
    candidate_status in ('discovered', 'mapped', 'imported', 'skipped', 'blocked')
  ),
  rights_status text not null default 'needs_permission' check (
    rights_status in ('needs_permission', 'allowed', 'licensed', 'blocked')
  ),
  import_mode text not null default 'metadata_only' check (
    import_mode in ('metadata_only', 'full_text')
  ),
  raw_payload jsonb not null default '{}'::jsonb,
  discovered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_site_id, source_manual_url)
);

create index if not exists manual_import_candidates_site_status_idx
  on manual_import_candidates(source_site_id, candidate_status);
create index if not exists manual_import_candidates_title_idx
  on manual_import_candidates using gin(to_tsvector('simple', coalesce(title, '')));

drop trigger if exists source_sites_set_updated_at on source_sites;
create trigger source_sites_set_updated_at
before update on source_sites
for each row execute function set_updated_at();

drop trigger if exists source_categories_set_updated_at on source_categories;
create trigger source_categories_set_updated_at
before update on source_categories
for each row execute function set_updated_at();

drop trigger if exists category_source_mappings_set_updated_at on category_source_mappings;
create trigger category_source_mappings_set_updated_at
before update on category_source_mappings
for each row execute function set_updated_at();

drop trigger if exists import_jobs_set_updated_at on import_jobs;
create trigger import_jobs_set_updated_at
before update on import_jobs
for each row execute function set_updated_at();

drop trigger if exists manual_import_candidates_set_updated_at on manual_import_candidates;
create trigger manual_import_candidates_set_updated_at
before update on manual_import_candidates
for each row execute function set_updated_at();

insert into source_sites (
  name,
  base_url,
  robots_txt_url,
  terms_url,
  contact_url,
  owner_name,
  import_policy,
  rights_status,
  notes
)
values (
  'Manuall KR',
  'https://manuall.kr',
  'https://manuall.kr/robots.txt',
  null,
  'https://manuall.kr/contact/',
  'HandleidingKwijt B.V.',
  'metadata_only',
  'needs_permission',
  'Public manual directory. Store categories/manual candidates only until written permission or a clear license allows PDF/text ingestion.'
)
on conflict (name) do update set
  base_url = excluded.base_url,
  robots_txt_url = excluded.robots_txt_url,
  contact_url = excluded.contact_url,
  owner_name = excluded.owner_name,
  import_policy = excluded.import_policy,
  rights_status = excluded.rights_status,
  notes = excluded.notes;
