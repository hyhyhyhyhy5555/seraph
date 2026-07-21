alter table source_sites
  add column if not exists license_url text,
  add column if not exists permission_document_url text,
  add column if not exists permission_checked_at timestamptz;

alter table source_categories
  add column if not exists category_kind text not null default 'category' check (
    category_kind in (
      'department',
      'product_type',
      'manufacturer',
      'model_collection',
      'category'
    )
  );

update source_categories
set category_kind = case
  when depth = 1 then 'department'
  when depth = 2 then 'product_type'
  else category_kind
end
where category_kind = 'category';

create index if not exists source_categories_site_kind_idx
  on source_categories(source_site_id, category_kind);

alter table manual_import_candidates
  add column if not exists last_seen_at timestamptz,
  add column if not exists pdf_discovered_at timestamptz,
  add column if not exists text_ingested_at timestamptz;

update manual_import_candidates
set last_seen_at = coalesce(last_seen_at, discovered_at);
