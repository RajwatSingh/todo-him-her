import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { backend } from "@/lib/backend"
import { guessIcon } from "@/lib/icons"
import { localDay } from "@/lib/time"
import {
  DEFAULT_PROFILES,
  type PersonId,
  type Profile,
  type Todo,
  type TodoNode,
} from "@/lib/types"

/** Nest a flat list into the parent/child tree the columns render. */
export function buildTree(flat: Todo[]): TodoNode[] {
  const nodes = new Map<string, TodoNode>()
  for (const t of flat) nodes.set(t.id, { ...t, children: [] })

  const roots: TodoNode[] = []
  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  const sort = (list: TodoNode[]) => {
    list.sort((x, y) => x.position - y.position)
    for (const n of list) sort(n.children)
  }
  sort(roots)

  return roots
}

/** A task and everything nested beneath it — used for cascading writes. */
function withDescendants(all: Todo[], id: string): string[] {
  const out = [id]
  const queue = [id]
  while (queue.length) {
    const current = queue.pop()!
    for (const t of all) {
      if (t.parent_id === current) {
        out.push(t.id)
        queue.push(t.id)
      }
    }
  }
  return out
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  // Fallback for older Safari; shape still matches a uuid column.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export type Status = "loading" | "ready" | "error"

export function useOurDays(dayOffset: number) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [profiles, setProfiles] =
    useState<Record<PersonId, Profile>>(DEFAULT_PROFILES)
  const [status, setStatus] = useState<Status>("loading")
  const [error, setError] = useState<string | null>(null)

  // Keeps optimistic writes from being clobbered by an in-flight refresh.
  const todosRef = useRef<Todo[]>([])
  todosRef.current = todos

  const profilesRef = useRef(profiles)
  profilesRef.current = profiles

  const refresh = useCallback(async () => {
    try {
      const [nextTodos, nextProfiles] = await Promise.all([
        backend.loadTodos(),
        backend.loadProfiles(),
      ])
      setTodos(nextTodos)
      setProfiles(nextProfiles)
      setStatus("ready")
      setError(null)
    } catch (e) {
      setStatus("error")
      setError(e instanceof Error ? e.message : "could not reach the list")
    }
  }, [])

  useEffect(() => {
    void refresh()
    return backend.subscribe(() => void refresh())
  }, [refresh])

  /** Optimistic local update, then persist; on failure, re-sync from source. */
  const commit = useCallback(
    async (next: Todo[], persist: () => Promise<void>) => {
      setTodos(next)
      try {
        await persist()
      } catch (e) {
        setError(e instanceof Error ? e.message : "that didn't save")
        void refresh()
      }
    },
    [refresh]
  )

  const addTodo = useCallback(
    (owner: PersonId, text: string, parentId: string | null = null) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const all = todosRef.current
      const day = localDay(profiles[owner].timezone, dayOffset)
      const siblings = all.filter(
        (t) => t.owner === owner && t.day === day && t.parent_id === parentId
      )

      const todo: Todo = {
        id: newId(),
        owner,
        parent_id: parentId,
        text: trimmed,
        description: "",
        // the add box previews this same guess, so honour it — the picker is
        // still one click away if the guess is wrong
        icon: guessIcon(trimmed),
        completed: false,
        position:
          siblings.reduce((max, t) => Math.max(max, t.position), -1) + 1,
        day,
        created_at: new Date().toISOString(),
      }

      void commit([...all, todo], () => backend.upsertTodos([todo]))
      return todo.id
    },
    [commit, dayOffset, profiles]
  )

  const patchTodo = useCallback(
    (id: string, patch: Partial<Omit<Todo, "id">>) => {
      const all = todosRef.current
      const target = all.find((t) => t.id === id)
      if (!target) return

      const updated = { ...target, ...patch }
      void commit(
        all.map((t) => (t.id === id ? updated : t)),
        () => backend.upsertTodos([updated])
      )
    },
    [commit]
  )

  /** Ticking a parent ticks everything nested under it — and unticking clears it. */
  const toggleTodo = useCallback(
    (id: string) => {
      const all = todosRef.current
      const target = all.find((t) => t.id === id)
      if (!target) return

      const completed = !target.completed
      const affected = new Set(withDescendants(all, id))
      const next = all.map((t) =>
        affected.has(t.id) ? { ...t, completed } : t
      )

      void commit(next, () =>
        backend.upsertTodos(next.filter((t) => affected.has(t.id)))
      )
    },
    [commit]
  )

  const removeTodo = useCallback(
    (id: string) => {
      const all = todosRef.current
      const doomed = new Set(withDescendants(all, id))
      void commit(
        all.filter((t) => !doomed.has(t.id)),
        () => backend.deleteTodos([...doomed])
      )
    },
    [commit]
  )

  const clearCompleted = useCallback(
    (owner: PersonId, day: string) => {
      const all = todosRef.current
      const doomed = new Set<string>()
      for (const t of all) {
        if (t.owner === owner && t.day === day && t.completed) {
          for (const id of withDescendants(all, t.id)) doomed.add(id)
        }
      }
      if (doomed.size === 0) return

      void commit(
        all.filter((t) => !doomed.has(t.id)),
        () => backend.deleteTodos([...doomed])
      )
    },
    [commit]
  )

  const saveProfile = useCallback((profile: Profile) => {
    setProfiles((prev) => ({ ...prev, [profile.id]: profile }))
    void backend.saveProfile(profile).catch(() => {
      /* name changes are cosmetic; don't interrupt for them */
    })
  }, [])

  /**
   * "goodnight" / "good morning" — their own word about whether they're up,
   * which outranks the clock until the clock next crosses a sleep boundary.
   * Saved on the profile, so it travels to the other phone like a name change.
   */
  const setSleeping = useCallback((id: PersonId, asleep: boolean) => {
    const next: Profile = {
      ...profilesRef.current[id],
      sleep_override: asleep ? "asleep" : "awake",
      sleep_override_at: new Date().toISOString(),
    }
    setProfiles((prev) => ({ ...prev, [id]: next }))
    void backend.saveProfile(next).catch(() => {
      /* the light stays on locally; nothing worth interrupting the page for */
    })
  }, [])

  /** Per-person view of the currently selected day, already nested. */
  const columns = useMemo(() => {
    const build = (owner: PersonId) => {
      const day = localDay(profiles[owner].timezone, dayOffset)
      const mine = todos.filter((t) => t.owner === owner && t.day === day)
      const tree = buildTree(mine)
      return {
        day,
        tree,
        total: mine.length,
        done: mine.filter((t) => t.completed).length,
      }
    }
    return { a: build("a"), b: build("b") }
  }, [dayOffset, profiles, todos])

  return {
    profiles,
    columns,
    status,
    error,
    mode: backend.kind,
    addTodo,
    patchTodo,
    toggleTodo,
    removeTodo,
    clearCompleted,
    saveProfile,
    setSleeping,
  }
}
