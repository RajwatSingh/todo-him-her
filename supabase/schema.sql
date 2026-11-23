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

-- v3: cheers, memories, the together list, notes, pings, shared focus -------
-- Everything below is additive and safe to re-run. The app checks for these
-- columns on start-up and keeps the new features switched off until they
-- exist, so it is fine to deploy the code before running this.

-- [{ "by": "a", "emoji": "💛", "at": "2026-…" }, …]
alter table public.todos add column if not exists reactions   jsonb   not null default '[]'::jsonb;
-- a finished task kept for the scrapbook
alter table public.todos add column if not exists is_memory   boolean not null default false;
alter table public.todos add column if not exists memory_note text    not null default '';
-- 'personal' lives in its owner's column on its owner's day; 'together' is
-- the shared, undated list. `owner` on a together task is whoever added it.
alter table public.todos add column if not exists scope       text    not null default 'personal';

do $$
begin
  alter table public.todos
    add constraint todos_scope_check check (scope in ('personal', 'together'));
exception when duplicate_object then null;
end $$;

create index if not exists todos_scope_idx  on public.todos (scope);
create index if not exists todos_memory_idx on public.todos (is_memory) where is_memory;

-- the one line each of you leaves on the other's card
alter table public.profiles add column if not exists note_for_partner text not null default '';
-- "thinking of you": when this person last sent one
alter table public.profiles add column if not exists last_ping_at     timestamptz;
-- the focus timer, so the other phone can see it and join in
alter table public.profiles add column if not exists focus_ends_at    timestamptz;
alter table public.profiles add column if not exists focus_duration   integer;
alter table public.profiles add column if not exists focus_mode       text;
alter table public.profiles add column if not exists started_by       text;

do $$
begin
  alter table public.profiles
    add constraint profiles_focus_mode_check
    check (focus_mode is null or focus_mode in ('focus', 'short', 'long'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_started_by_check
    check (started_by is null or started_by in ('a', 'b'));
exception when duplicate_object then null;
end $$;

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
