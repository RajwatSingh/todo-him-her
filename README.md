# our days

A shared to-do list for two people in two time zones — Gettysburg, PA and
Pune, India. Each person gets a column, each column runs on its own clock, and
between midnight and 8am local the column turns into a night sky and says
they're asleep.

- **Nesting** — tasks nest up to three levels; ticking a parent ticks
  everything under it
- **Notes** — any task can carry a short description
- **Icons** — an emoji per task, picked from a categorised picker (or guessed
  from what you typed), rendered as Twemoji so they look identical on both
  your phones
- **Their own "today"** — the day switcher moves both columns by one day, but
  resolves against each person's own calendar, so "tomorrow" means tomorrow
  where they are
- **Goodnight** — the clock is only ever a guess, so either of you can tap
  *goodnight* (or *good morning*) to say it outright. The tap outranks the
  clock until the clock next crosses midnight or 8am, at which point it
  retires itself — so nobody shows as asleep all day for forgetting to tap
  back

The header writes out **love**, then **माया** — the Nepali word for the same
thing.

Built with Vite + React + Tailwind v4, [shadcn/ui](https://ui.shadcn.com), and
components from [chanhdai.com](https://chanhdai.com/components) (Twemoji and
the shimmering footer text).

### The handwriting

`src/components/handwriting.tsx` is generated, not hand-written. The glyph
outlines come from **Baloo 2** (Ek Type, OFL) — one upright, rounded family
that covers both Devanagari and Latin — inlined as SVG paths so no font is
fetched at runtime. Each glyph is revealed by a clip rectangle that opens left
to right, staggered in reading order, which is the direction both scripts are
written in, including the Devanagari शिरोरेखा along the top.

To change the wording, edit the two `layout(...)` calls at the bottom of
`tools/generate-handwriting.mjs` and re-run it — don't edit the path data by
hand:

```bash
node tools/generate-handwriting.mjs
```

It downloads the `.ttf` into `tools/fonts/` on first run (gitignored; only the
generated component is committed). Layout goes through fontkit, which does
real OpenType shaping and can instance the variable font's weight axis — worth
knowing because opentype.js silently can't do the latter: its
`variation.set()` leaves `getPath()` outlines untouched, so every weight came
out identical.

## Running it locally

```bash
npm install
npm run dev
```

That works immediately — with no Supabase credentials the app stores
everything in `localStorage` and shows a "not syncing yet" badge in the
footer.

## Turning on sync

1. Make a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor**, paste in [`supabase/schema.sql`](supabase/schema.sql),
   and run it. This creates the two tables, switches on realtime, and seeds
   both profiles.
3. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.
4. `cp .env.example .env` and paste both values in.
5. Restart `npm run dev`. The footer badge disappears — you're syncing.

`schema.sql` is safe to run again later: it adds anything new (the
`sleep_override` columns behind the goodnight switch, say) without touching
rows you already have.

Changes now appear on the other person's screen within a second or so, with no
refresh, because the app subscribes to Postgres changes on both tables.

### A note on access

The anon key ships inside the browser bundle, and the schema's row-level
security policies allow anyone holding it to read and write. In practice that
means **anyone with the site URL can edit the list** — the same trust model as
an unlisted shared document. For a private two-person list that's usually the
right trade-off against making someone log in. If you'd rather lock it down,
swap the policies in `schema.sql` for Supabase Auth with per-user rules.

## Deploying

The Vercel project is connected to this repository, so a push is a deploy:

| push to                | gets you                       |
| ---------------------- | ------------------------------ |
| `master`               | a production deploy            |
| any other branch, a PR | a preview deploy on its own URL |

To deploy by hand instead — or to set the project up from scratch:

```bash
npm i -g vercel      # if you don't have it
vercel               # first run links the project
vercel --prod
```

Both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must exist in the Vercel
project for Production, Preview and Development:

```bash
vercel env add VITE_SUPABASE_URL production      # repeat per variable/environment
vercel env ls                                    # check what's there
```

Vite inlines `VITE_*` values **at build time**, not at runtime, so a variable
added after a build has no effect until the next one. If the deployed site
still shows the "not syncing yet" badge, that is nearly always the reason —
add the variables, then redeploy.

## Layout

```
src/
  App.tsx                  page shell, header, the two columns
  lib/
    time.ts                clocks, per-person "today", sleep windows
    store.ts               the useOurDays hook — state + optimistic writes
    backend.ts             one interface, two impls: localStorage / Supabase
    supabase.ts            client (null when unconfigured)
    icons.ts               the emoji catalogue + the guess-from-text hints
  components/
    person-column.tsx      one person: clock, sleep state, progress, list
    todo-item.tsx          a task, recursive over its children
    icon-picker.tsx        the emoji popover
    night-sky.tsx          stars + moonglow for the sleeping state
```

The previous single-file version is kept at `legacy/v1-index.html`.
