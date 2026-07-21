create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete cascade,
  depth smallint not null check (depth between 1 and 3),
  slug text not null,
  slug_path text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_parent_depth_check check (
    (depth = 1 and parent_id is null) or
    (depth > 1 and parent_id is not null)
  )
);

create unique index if not exists categories_parent_slug_idx
  on categories (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create index if not exists categories_parent_id_idx on categories(parent_id);
create index if not exists categories_depth_idx on categories(depth);

create table if not exists manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  country_code char(2),
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists manuals (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  manufacturer_id uuid references manufacturers(id) on delete set null,
  title text not null,
  model_name text,
  normalized_model text,
  language_code text not null default 'ko',
  source_url text,
  pdf_url text,
  storage_path text,
  source_type text not null default 'sample' check (
    source_type in ('official', 'partner', 'user_upload', 'sample')
  ),
  ingestion_status text not null default 'pending' check (
    ingestion_status in ('pending', 'processing', 'ready', 'failed')
  ),
  rights_status text not null default 'unknown' check (
    rights_status in ('unknown', 'allowed', 'licensed', 'user_provided', 'blocked')
  ),
  summary text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(model_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(normalized_model, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manuals_category_id_idx on manuals(category_id);
create index if not exists manuals_manufacturer_id_idx on manuals(manufacturer_id);
create index if not exists manuals_ingestion_status_idx on manuals(ingestion_status);
create index if not exists manuals_rights_status_idx on manuals(rights_status);
create index if not exists manuals_search_vector_idx on manuals using gin(search_vector);
create unique index if not exists manuals_source_url_unique_idx
  on manuals(source_url)
  where source_url is not null;

create table if not exists manual_pages (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references manuals(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  text_content text not null,
  created_at timestamptz not null default now(),
  unique (manual_id, page_number)
);

create index if not exists manual_pages_manual_id_idx on manual_pages(manual_id);

create table if not exists manual_chunks (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references manuals(id) on delete cascade,
  page_start integer check (page_start is null or page_start > 0),
  page_end integer check (page_end is null or page_end > 0),
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  token_count integer check (token_count is null or token_count > 0),
  embedding double precision[],
  embedding_model text,
  embedding_dimensions integer check (
    embedding_dimensions is null or embedding_dimensions > 0
  ),
  metadata jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(content, ''))
  ) stored,
  created_at timestamptz not null default now(),
  unique (manual_id, chunk_index),
  constraint manual_chunks_page_range_check check (
    page_start is null or page_end is null or page_start <= page_end
  ),
  constraint manual_chunks_embedding_length_check check (
    embedding is null or
    embedding_dimensions is null or
    array_length(embedding, 1) = embedding_dimensions
  )
);

create index if not exists manual_chunks_manual_id_idx on manual_chunks(manual_id);
create index if not exists manual_chunks_search_vector_idx on manual_chunks using gin(search_vector);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  title text,
  client_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_created_idx
  on chat_messages(session_id, created_at);

create table if not exists contact_requests (
  id uuid primary key default gen_random_uuid(),
  email text,
  subject text not null,
  message text not null,
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'closed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists manual_requests (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  manufacturer_name text,
  model_name text,
  requester_email text,
  note text,
  status text not null default 'open' check (
    status in ('open', 'searching', 'added', 'rejected')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists categories_set_updated_at on categories;
create trigger categories_set_updated_at
before update on categories
for each row execute function set_updated_at();

drop trigger if exists manufacturers_set_updated_at on manufacturers;
create trigger manufacturers_set_updated_at
before update on manufacturers
for each row execute function set_updated_at();

drop trigger if exists manuals_set_updated_at on manuals;
create trigger manuals_set_updated_at
before update on manuals
for each row execute function set_updated_at();

drop trigger if exists chat_sessions_set_updated_at on chat_sessions;
create trigger chat_sessions_set_updated_at
before update on chat_sessions
for each row execute function set_updated_at();

drop trigger if exists contact_requests_set_updated_at on contact_requests;
create trigger contact_requests_set_updated_at
before update on contact_requests
for each row execute function set_updated_at();

drop trigger if exists manual_requests_set_updated_at on manual_requests;
create trigger manual_requests_set_updated_at
before update on manual_requests
for each row execute function set_updated_at();

create or replace function cosine_similarity(
  left_embedding double precision[],
  right_embedding double precision[]
)
returns double precision
language sql
immutable
strict
as $$
  with pairs as (
    select left_value, right_value
    from unnest(left_embedding, right_embedding) as pair(left_value, right_value)
    where left_value is not null and right_value is not null
  ),
  stats as (
    select
      sum(left_value * right_value) as dot_product,
      sqrt(sum(left_value * left_value)) as left_norm,
      sqrt(sum(right_value * right_value)) as right_norm
    from pairs
  )
  select case
    when left_norm is null or right_norm is null then 0
    when left_norm = 0 or right_norm = 0 then 0
    else dot_product / (left_norm * right_norm)
  end
  from stats;
$$;

create or replace function match_manual_chunks(
  query_embedding double precision[],
  match_count integer default 8,
  manual_filter uuid default null
)
returns table (
  chunk_id uuid,
  manual_id uuid,
  title text,
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
    manuals.title,
    manufacturers.name as manufacturer_name,
    manual_chunks.page_start,
    manual_chunks.page_end,
    manual_chunks.content,
    cosine_similarity(manual_chunks.embedding, query_embedding) as similarity
  from manual_chunks
  join manuals on manuals.id = manual_chunks.manual_id
  left join manufacturers on manufacturers.id = manuals.manufacturer_id
  where manual_chunks.embedding is not null
    and (manual_filter is null or manual_chunks.manual_id = manual_filter)
  order by cosine_similarity(manual_chunks.embedding, query_embedding) desc
  limit match_count;
$$;
