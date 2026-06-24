-- Blitzmoji schema. Apply to a Supabase project, then set NEXT_PUBLIC_SUPABASE_URL
-- and NEXT_PUBLIC_SUPABASE_ANON_KEY in the app to enable live trending.

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
  emoji_id   text primary key references emojis(id) on delete cascade,
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
  select s.emoji_id as id, (s.copies + s.downloads) as score
  from emoji_stats s
  join emojis e on e.id = s.emoji_id
  order by score desc, s.updated_at desc
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function increment_stat(text, text) to anon, authenticated;
grant execute on function get_trending(int) to anon, authenticated;
