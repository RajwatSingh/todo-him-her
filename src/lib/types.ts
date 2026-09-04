export type PersonId = "a" | "b"

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
}

export const DEFAULT_PROFILES: Record<PersonId, Profile> = {
  a: {
    id: "a",
    name: "me",
    emoji: "🌸",
    timezone: "America/New_York",
    location: "Gettysburg, PA",
    sleep_override: null,
    sleep_override_at: null,
  },
  b: {
    id: "b",
    name: "her",
    emoji: "🪷",
    timezone: "Asia/Kolkata",
    location: "Pune, India",
    sleep_override: null,
    sleep_override_at: null,
  },
}

export const PEOPLE: PersonId[] = ["a", "b"]
