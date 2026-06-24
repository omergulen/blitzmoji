-- Blitzmoji schema. Apply to a Supabase project, then set NEXT_PUBLIC_SUPABASE_URL
-- and NEXT_PUBLIC_SUPABASE_ANON_KEY in the app to enable live trending.
--
-- emoji_stats is intentionally standalone (no FK to a catalog table): the client
-- already knows every emoji from the static catalog and maps trending ids to it,
-- so counters can be recorded for any id without a prior insert. The emojis table
-- is an optional canonical store (handy for R2 mirroring later).

create table if not exists emojis (
  id          text primary key,
  source      text not null,
  name        text not null,
  shortcodes  text[] not null default '{}',
  tags        text[] not null default '{}',
  category    text,
  credit      text,
  image_url   text,
  char        text,
  animated    boolean not null default false,
  width       int,
  height      int,
  created_at  timestamptz not null default now()
);

create table if not exists emoji_stats (
  emoji_id   text primary key,
  copies     bigint not null default 0,
  downloads  bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- Atomic, anonymous counter bump. SECURITY DEFINER so the anon key can call it
-- without table-level write grants. Validates kind to avoid arbitrary updates.
create or replace function increment_stat(p_emoji_id text, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind not in ('copy', 'download') then
    raise exception 'invalid kind: %', p_kind;
  end if;
  insert into emoji_stats (emoji_id, copies, downloads)
    values (p_emoji_id,
            case when p_kind = 'copy' then 1 else 0 end,
            case when p_kind = 'download' then 1 else 0 end)
  on conflict (emoji_id) do update set
    copies     = emoji_stats.copies     + (case when p_kind = 'copy' then 1 else 0 end),
    downloads  = emoji_stats.downloads  + (case when p_kind = 'download' then 1 else 0 end),
    updated_at = now();
end;
$$;

-- Top-N emoji ids by total interactions.
create or replace function get_trending(p_limit int default 24)
returns table (id text, score bigint)
language sql
stable
security definer
set search_path = public
as $$
  select emoji_id as id, (copies + downloads) as score
  from emoji_stats
  order by score desc, updated_at desc
  limit greatest(1, least(p_limit, 100));
$$;

-- Anyone (anon) may read aggregate stats and call the functions; nobody writes
-- the tables directly.
alter table emoji_stats enable row level security;
drop policy if exists emoji_stats_read on emoji_stats;
create policy emoji_stats_read on emoji_stats for select to anon, authenticated using (true);

grant execute on function increment_stat(text, text) to anon, authenticated;
grant execute on function get_trending(int) to anon, authenticated;
