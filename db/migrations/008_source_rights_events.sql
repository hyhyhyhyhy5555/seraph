alter table source_sites
  add column if not exists permission_checked_by text;

create table if not exists source_rights_events (
  id uuid primary key default gen_random_uuid(),
  source_site_id uuid not null references source_sites(id) on delete cascade,
  previous_import_policy text not null check (
    previous_import_policy in (
      'metadata_only',
      'licensed_full_text',
      'official_full_text',
      'blocked'
    )
  ),
  new_import_policy text not null check (
    new_import_policy in (
      'metadata_only',
      'licensed_full_text',
      'official_full_text',
      'blocked'
    )
  ),
  previous_rights_status text not null check (
    previous_rights_status in ('needs_permission', 'allowed', 'licensed', 'blocked')
  ),
  new_rights_status text not null check (
    new_rights_status in ('needs_permission', 'allowed', 'licensed', 'blocked')
  ),
  license_url text,
  permission_document_url text,
  reviewed_by text,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists source_rights_events_site_created_idx
  on source_rights_events(source_site_id, created_at desc);
