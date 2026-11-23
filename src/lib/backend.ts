import { supabase } from "@/lib/supabase"
import {
  DEFAULT_PROFILES,
  PROFILE_V3_KEYS,
  TODO_V3_KEYS,
  normalizeTodo,
  type PersonId,
  type Profile,
  type Todo,
} from "@/lib/types"

/**
 * One tiny persistence interface, two implementations: `localBackend` (this
 * browser only) and `cloudBackend` (Supabase, shared + realtime). The app
 * picks whichever is configured and never branches again.
 */
export type Backend = {
  readonly kind: "local" | "cloud"
  /**
   * Whether the store can hold the v3 fields (cheers, memories, notes, the
   * together list, shared focus). Always true locally; in the cloud it is
   * true once `supabase/schema.sql` has been re-run.
   */
  supportsV3(): Promise<boolean>
  loadTodos(): Promise<Todo[]>
  upsertTodos(todos: Todo[]): Promise<void>
  deleteTodos(ids: string[]): Promise<void>
  loadProfiles(): Promise<Record<PersonId, Profile>>
  saveProfile(profile: Profile): Promise<void>
  /** Fires whenever data changed somewhere else (another tab, or Pune). */
  subscribe(onChange: () => void): () => void
}

const TODOS_KEY = "ourdays:todos:v2"
const PROFILES_KEY = "ourdays:profiles:v2"

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode / quota — the session still works, it just won't persist */
  }
}

/* -------------------------------------------------------------------------- */
/* local                                                                      */
/* -------------------------------------------------------------------------- */

export const localBackend: Backend = {
  kind: "local",

  async supportsV3() {
    return true
  },

  async loadTodos() {
    return readJSON<Todo[]>(TODOS_KEY, []).map(normalizeTodo)
  },

  async upsertTodos(todos) {
    const all = readJSON<Todo[]>(TODOS_KEY, [])
    const byId = new Map(all.map((t) => [t.id, t]))
    for (const t of todos) byId.set(t.id, t)
    writeJSON(TODOS_KEY, [...byId.values()])
  },

  async deleteTodos(ids) {
    const drop = new Set(ids)
    const all = readJSON<Todo[]>(TODOS_KEY, [])
    writeJSON(
      TODOS_KEY,
      all.filter((t) => !drop.has(t.id))
    )
  },

  async loadProfiles() {
    const saved = readJSON<Partial<Record<PersonId, Profile>>>(PROFILES_KEY, {})
    return {
      a: { ...DEFAULT_PROFILES.a, ...saved.a },
      b: { ...DEFAULT_PROFILES.b, ...saved.b },
    }
  },

  async saveProfile(profile) {
    const saved = readJSON<Partial<Record<PersonId, Profile>>>(PROFILES_KEY, {})
    writeJSON(PROFILES_KEY, { ...saved, [profile.id]: profile })
  },

  subscribe(onChange) {
    const handler = (e: StorageEvent) => {
      if (e.key === TODOS_KEY || e.key === PROFILES_KEY) onChange()
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  },
}

/* -------------------------------------------------------------------------- */
/* cloud                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Asked once per page: do the v3 columns exist yet? A select naming a column
 * that isn't there fails, which is the whole test — it reads nothing. Until
 * the answer is yes, writes leave those fields out, so a database that hasn't
 * been migrated keeps working exactly as before instead of rejecting saves.
 */
let v3: Promise<boolean> | null = null
function probeV3() {
  v3 ??= (async () => {
    const [todos, profiles] = await Promise.all([
      supabase!.from("todos").select(TODO_V3_KEYS.join(",")).limit(1),
      supabase!.from("profiles").select(PROFILE_V3_KEYS.join(",")).limit(1),
    ])
    return !todos.error && !profiles.error
  })().catch(() => false)
  return v3
}

function strip<T extends object>(row: T, keys: readonly string[]): T {
  const copy = { ...row } as Record<string, unknown>
  for (const k of keys) delete copy[k]
  return copy as T
}

export const cloudBackend: Backend = {
  kind: "cloud",

  supportsV3: probeV3,

  async loadTodos() {
    const { data, error } = await supabase!
      .from("todos")
      .select("*")
      .order("position", { ascending: true })

    if (error) throw error
    return ((data ?? []) as Todo[]).map(normalizeTodo)
  },

  async upsertTodos(todos) {
    if (todos.length === 0) return
    const rows = (await probeV3())
      ? todos
      : todos.map((t) => strip(t, TODO_V3_KEYS))
    const { error } = await supabase!.from("todos").upsert(rows)
    if (error) throw error
  },

  async deleteTodos(ids) {
    if (ids.length === 0) return
    const { error } = await supabase!.from("todos").delete().in("id", ids)
    if (error) throw error
  },

  async loadProfiles() {
    const { data, error } = await supabase!.from("profiles").select("*")
    if (error) throw error

    const rows = (data ?? []) as Profile[]
    const find = (id: PersonId) => rows.find((r) => r.id === id)
    return {
      a: { ...DEFAULT_PROFILES.a, ...find("a") },
      b: { ...DEFAULT_PROFILES.b, ...find("b") },
    }
  },

  async saveProfile(profile) {
    const row = (await probeV3()) ? profile : strip(profile, PROFILE_V3_KEYS)
    const { error } = await supabase!.from("profiles").upsert(row)
    if (error) throw error
  },

  subscribe(onChange) {
    // For a two-person list the cheapest correct thing is to refetch on any
    // change rather than patch rows in place from the payload.
    const channel = supabase!
      .channel("our-days")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        onChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        onChange
      )
      .subscribe()

    return () => {
      void supabase!.removeChannel(channel)
    }
  },
}

export const backend: Backend = supabase ? cloudBackend : localBackend
