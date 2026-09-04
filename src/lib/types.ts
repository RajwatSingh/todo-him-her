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

export type Profile = {
  id: PersonId
  name: string
  emoji: string
  timezone: string
  location: string
}

export const DEFAULT_PROFILES: Record<PersonId, Profile> = {
  a: {
    id: "a",
    name: "me",
    emoji: "🌸",
    timezone: "America/New_York",
    location: "Gettysburg, PA",
  },
  b: {
    id: "b",
    name: "her",
    emoji: "🪷",
    timezone: "Asia/Kolkata",
    location: "Pune, India",
  },
}

export const PEOPLE: PersonId[] = ["a", "b"]
