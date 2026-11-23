export type PersonId = "a" | "b"

/** The other one. */
export const other = (id: PersonId): PersonId => (id === "a" ? "b" : "a")

/** A tap-to-cheer on someone else's task. */
export type Reaction = {
  by: PersonId
  emoji: string
  /** ISO */
  at: string
}

/**
 * "personal" lives in its owner's column, on its owner's own day.
 * "together" is the shared list — undated, and ignoring both sleep clocks.
 */
export type Scope = "personal" | "together"

export type FocusMode = "focus" | "short" | "long"

export type Todo = {
  id: string
  owner: PersonId
  /** null for a top-level task; otherwise the id of the task it nests under */
  parent_id: string | null
  text: string
  description: string
  icon: string
  completed: boolean
  /** sort order among siblings */
  position: number
  /** the owner's *own* local date, "YYYY-MM-DD" — see lib/time.ts */
  day: string
  created_at: string
  reactions: Reaction[]
  /** a finished task kept for the scrapbook */
  is_memory: boolean
  memory_note: string
  scope: Scope
}

/** Defaults for the fields added after v2, so older rows load cleanly. */
export const TODO_DEFAULTS = {
  reactions: [] as Reaction[],
  is_memory: false,
  memory_note: "",
  scope: "personal" as Scope,
}

export function normalizeTodo(raw: Partial<Todo> & Pick<Todo, "id">): Todo {
  return {
    ...TODO_DEFAULTS,
    ...raw,
    reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
    scope: raw.scope === "together" ? "together" : "personal",
  } as Todo
}

/** A todo plus its nested children, as the list actually renders it. */
export type TodoNode = Todo & { children: TodoNode[] }

/**
 * A tap on "goodnight" / "good morning". It overrides the clock-based guess
 * until the clock itself crosses the next sleep boundary, at which point it
 * has said all it can and is ignored — so nobody is left showing as asleep
 * for a day and a half because they forgot to tap back.
 */
export type SleepOverride = "asleep" | "awake" | null

export type Profile = {
  id: PersonId
  name: string
  emoji: string
  timezone: string
  location: string
  sleep_override: SleepOverride
  /** when the override was tapped, ISO — null whenever the override is null */
  sleep_override_at: string | null
  /** the one line this person has left on the *other* person's card */
  note_for_partner: string
  /** when this person last sent "thinking of you", ISO */
  last_ping_at: string | null
  /** this person's focus timer, so the other phone can see it and join */
  focus_ends_at: string | null
  /** minutes */
  focus_duration: number | null
  focus_mode: FocusMode | null
  /** who started the block this person is in — themselves, or the one they joined */
  started_by: PersonId | null
}

const PROFILE_EXTRAS = {
  note_for_partner: "",
  last_ping_at: null,
  focus_ends_at: null,
  focus_duration: null,
  focus_mode: null,
  started_by: null,
} satisfies Partial<Profile>

/** The columns added in v3 — stripped on write when the database predates them. */
export const TODO_V3_KEYS = ["reactions", "is_memory", "memory_note", "scope"] as const
export const PROFILE_V3_KEYS = [
  "note_for_partner",
  "last_ping_at",
  "focus_ends_at",
  "focus_duration",
  "focus_mode",
  "started_by",
] as const

export const DEFAULT_PROFILES: Record<PersonId, Profile> = {
  a: {
    id: "a",
    name: "me",
    emoji: "🌸",
    timezone: "America/New_York",
    location: "Gettysburg, PA",
    sleep_override: null,
    sleep_override_at: null,
    ...PROFILE_EXTRAS,
  },
  b: {
    id: "b",
    name: "her",
    emoji: "🪷",
    timezone: "Asia/Kolkata",
    location: "Pune, India",
    sleep_override: null,
    sleep_override_at: null,
    ...PROFILE_EXTRAS,
  },
}

export const PEOPLE: PersonId[] = ["a", "b"]
