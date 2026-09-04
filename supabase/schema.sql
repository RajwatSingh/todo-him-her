-- ---------------------------------------------------------------------------
-- our days — database schema
--
-- Paste this whole file into the Supabase SQL editor and hit Run. It is safe
-- to run more than once.
-- ---------------------------------------------------------------------------

-- the two of you ------------------------------------------------------------
create table if not exists public.profiles (
  id        text primary key check (id in ('a', 'b')),
  name      text not null default '',
  emoji     text not null default '',
  timezone  text not null,
  location  text not null default '',
  -- a tap on "goodnight" / "good morning". null = trust the clock instead.
  sleep_override    text check (sleep_override in ('asleep', 'awake')),
  sleep_override_at timestamptz
);

-- for lists created before the goodnight switch existed
alter table public.profiles add column if not exists sleep_override    text;
alter table public.profiles add column if not exists sleep_override_at timestamptz;

insert into public.profiles (id, name, emoji, timezone, location) values
  ('a', 'me',  '🌸', 'America/New_York', 'Gettysburg, PA'),
  ('b', 'her', '🪷', 'Asia/Kolkata',     'Pune, India')
on conflict (id) do nothing;

-- the list ------------------------------------------------------------------
create table if not exists public.todos (
  id          uuid primary key,
  owner       text not null references public.profiles (id) on delete cascade,
  -- self-reference gives unlimited nesting; deleting a parent takes its
  -- children with it, which matches what the UI does optimistically
  parent_id   uuid references public.todos (id) on delete cascade,
  text        text not null,
  description text not null default '',
  icon        text not null default '',
  completed   boolean not null default false,
  position    integer not null default 0,
  -- the OWNER's local date, so "today" means today where they are
  day         date not null,
  created_at  timestamptz not null default now()
);

create index if not exists todos_owner_day_idx on public.todos (owner, day);
create index if not exists todos_parent_idx    on public.todos (parent_id);

-- realtime ------------------------------------------------------------------
-- this is what makes her checkbox tick on your screen without a refresh
alter table public.todos    replica identity full;
alter table public.profiles replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.todos;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

-- access --------------------------------------------------------------------
-- NOTE: this opens both tables to anyone holding the anon key, which is
-- shipped in the browser bundle. In other words, anyone who has the site URL
-- can read and edit the list — the same trust model as an unlisted shared
-- doc. That is deliberate for a two-person app with no login. If you'd rather
-- lock it down, replace these policies with Supabase Auth + per-user rules.
alter table public.todos    enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "open access to todos"    on public.todos;
drop policy if exists "open access to profiles" on public.profiles;

create policy "open access to todos"
  on public.todos for all
  to anon, authenticated
  using (true) with check (true);

create policy "open access to profiles"
  on public.profiles for all
  to anon, authenticated
  using (true) with check (true);
