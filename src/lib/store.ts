import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { partnerActivity, type RecentWrites } from "@/lib/activity"
import { backend } from "@/lib/backend"
import { guessIcon } from "@/lib/icons"
import { clip, toast } from "@/lib/toast"
import { localDay } from "@/lib/time"
import {
  DEFAULT_PROFILES,
  TODO_DEFAULTS,
  other,
  type FocusMode,
  type PersonId,
  type Profile,
  type Scope,
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

/** Parents before children, so a restore never inserts an orphan. */
function parentsFirst(rows: Todo[]): Todo[] {
  const ids = new Set(rows.map((r) => r.id))
  const depth = new Map<string, number>()
  const byId = new Map(rows.map((r) => [r.id, r]))
  const depthOf = (r: Todo): number => {
    const known = depth.get(r.id)
    if (known !== undefined) return known
    const parent = r.parent_id && ids.has(r.parent_id) ? byId.get(r.parent_id) : undefined
    const d = parent ? depthOf(parent) + 1 : 0
    depth.set(r.id, d)
    return d
  }
  return [...rows].sort((x, y) => depthOf(x) - depthOf(y))
}

const UNDO_MS = 5000

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

/** A system notification, if they've allowed them and aren't looking. */
function notify(title: string) {
  try {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted" &&
      document.visibilityState === "hidden"
    ) {
      new Notification(title, { tag: "our-days", silent: false })
    }
  } catch {
    // some browsers only allow notifications from a service worker
  }
}

export type FocusSession = {
  mode: FocusMode
  /** ms epoch */
  endsAt: number
  /** minutes */
  minutes: number
  startedBy: PersonId
} | null

export function useOurDays(dayOffset: number, me: PersonId) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [profiles, setProfiles] =
    useState<Record<PersonId, Profile>>(DEFAULT_PROFILES)
  const [status, setStatus] = useState<Status>("loading")
  const [error, setError] = useState<string | null>(null)
  // Local storage always can; the cloud can once the v3 SQL has been run.
  // Starts false so nothing v3 flashes up and then vanishes.
  const [v3, setV3] = useState(false)

  useEffect(() => {
    let live = true
    void backend.supportsV3().then((ok) => {
      if (live) setV3(ok)
    })
    return () => {
      live = false
    }
  }, [])

  // Keeps optimistic writes from being clobbered by an in-flight refresh.
  const todosRef = useRef<Todo[]>([])
  todosRef.current = todos

  const profilesRef = useRef(profiles)
  profilesRef.current = profiles

  const meRef = useRef(me)
  meRef.current = me

  /** what this device wrote lately, so it isn't announced back to itself */
  const recentRef = useRef<RecentWrites>(new Map())
  const markRecent = useCallback((keys: Iterable<string>) => {
    const at = Date.now()
    for (const k of keys) recentRef.current.set(k, at)
  }, [])
  const loadedRef = useRef(false)
  const noteToastAt = useRef(0)

  const refresh = useCallback(async () => {
    try {
      const [nextTodos, nextProfiles] = await Promise.all([
        backend.loadTodos(),
        backend.loadProfiles(),
      ])

      // what changed on the other phone since we last looked
      if (loadedRef.current) {
        for (const a of partnerActivity({
          me: meRef.current,
          prevTodos: todosRef.current,
          nextTodos,
          prevProfiles: profilesRef.current,
          nextProfiles,
          recent: recentRef.current,
        })) {
          // a note is saved as it's typed — announce it once, not per word
          if (a.icon === "💌") {
            if (Date.now() - noteToastAt.current < 60_000) continue
            noteToastAt.current = Date.now()
          }
          toast({ message: a.message, icon: a.icon, duration: 4500 })
          if (a.ping) notify(`💛 ${a.message}`)
        }
      }
      loadedRef.current = true

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
      const before = new Map(todosRef.current.map((t) => [t.id, t]))
      const touched: string[] = []
      for (const t of next) if (before.get(t.id) !== t) touched.push(t.id)
      markRecent(touched)
      setTodos(next)
      try {
        await persist()
      } catch (e) {
        setError(e instanceof Error ? e.message : "that didn't save")
        void refresh()
      }
    },
    [markRecent, refresh]
  )

  const addTodo = useCallback(
    (
      owner: PersonId,
      text: string,
      parentId: string | null = null,
      scope: Scope = "personal"
    ) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const all = todosRef.current
      // A sub-task belongs wherever its parent does — same list, same day —
      // whoever happens to be adding it.
      const parent = parentId ? all.find((t) => t.id === parentId) : undefined
      const inScope: Scope = parent?.scope ?? scope
      const day = parent?.day ?? localDay(profiles[owner].timezone, dayOffset)
      const siblings = all.filter((t) =>
        inScope === "together"
          ? t.scope === "together" && t.parent_id === parentId
          : t.scope === "personal" &&
            t.owner === owner &&
            t.day === day &&
            t.parent_id === parentId
      )

      const todo: Todo = {
        ...TODO_DEFAULTS,
        scope: inScope,
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

  /** One set of siblings in a new order: their positions become 0..n-1. */
  const reorder = useCallback(
    (ids: string[]) => {
      const all = todosRef.current
      const position = new Map(ids.map((id, i) => [id, i]))
      const changed: Todo[] = []
      const next = all.map((t) => {
        const p = position.get(t.id)
        if (p === undefined || p === t.position) return t
        const moved = { ...t, position: p }
        changed.push(moved)
        return moved
      })
      if (changed.length === 0) return
      void commit(next, () => backend.upsertTodos(changed))
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

  /**
   * Put deleted rows back exactly as they were — same ids, parents, positions,
   * notes, icons — so an undo is indistinguishable from never having deleted.
   * The delete itself went out straight away (the other phone saw it go); this
   * writes the rows back, parents first.
   */
  const restore = useCallback(
    (rows: Todo[]) => {
      const present = new Set(todosRef.current.map((t) => t.id))
      const back = parentsFirst(rows.filter((r) => !present.has(r.id)))
      if (back.length === 0) return
      void commit([...todosRef.current, ...back], () => backend.upsertTodos(back))
    },
    [commit]
  )

  const removeTodo = useCallback(
    (id: string) => {
      const all = todosRef.current
      const target = all.find((t) => t.id === id)
      const doomed = new Set(withDescendants(all, id))
      const snapshot = all.filter((t) => doomed.has(t.id))
      void commit(
        all.filter((t) => !doomed.has(t.id)),
        () => backend.deleteTodos([...doomed])
      )
      if (target) {
        toast({
          message: `deleted ‘${clip(target.text)}’`,
          action: { label: "undo", onClick: () => restore(snapshot) },
          duration: UNDO_MS,
        })
      }
    },
    [commit, restore]
  )

  const clearCompleted = useCallback(
    (owner: PersonId, day: string) => {
      const all = todosRef.current
      const doomed = new Set<string>()
      for (const t of all) {
        if (
          t.scope === "personal" &&
          t.owner === owner &&
          t.day === day &&
          t.completed
        ) {
          for (const id of withDescendants(all, t.id)) doomed.add(id)
        }
      }
      if (doomed.size === 0) return

      const snapshot = all.filter((t) => doomed.has(t.id))
      void commit(
        all.filter((t) => !doomed.has(t.id)),
        () => backend.deleteTodos([...doomed])
      )
      toast({
        message: `cleared ${doomed.size}`,
        action: { label: "undo", onClick: () => restore(snapshot) },
        duration: UNDO_MS,
      })
    },
    [commit, restore]
  )

  const saveProfile = useCallback((profile: Profile) => {
    markRecent([`profile:${profile.id}`])
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
    markRecent([`profile:${id}`])
    setProfiles((prev) => ({ ...prev, [id]: next }))
    void backend.saveProfile(next).catch(() => {
      /* the light stays on locally; nothing worth interrupting the page for */
    })
  }, [markRecent])

  const saveTimers = useRef<Record<string, number>>({})

  /** Change some of one profile's fields, locally at once and then saved. */
  const updateProfile = useCallback(
    (id: PersonId, patch: Partial<Profile>, save: "now" | "soon" = "now") => {
      const next: Profile = { ...profilesRef.current[id], ...patch }
      profilesRef.current = { ...profilesRef.current, [id]: next }
      markRecent([`profile:${id}`])
      setProfiles((prev) => ({ ...prev, [id]: next }))
      const write = () => {
        markRecent([`profile:${id}`])
        void backend
          .saveProfile(profilesRef.current[id])
          .catch((e) => setError(e instanceof Error ? e.message : "that didn't save"))
      }
      window.clearTimeout(saveTimers.current[id])
      if (save === "now") write()
      else saveTimers.current[id] = window.setTimeout(write, 600)
    },
    [markRecent]
  )

  /** Tap-to-cheer on someone else's task: toggles this person's emoji on it. */
  const toggleReaction = useCallback(
    (id: string, emoji = "💛") => {
      const all = todosRef.current
      const target = all.find((t) => t.id === id)
      if (!target) return
      const by = meRef.current
      const mine = target.reactions.some((r) => r.by === by && r.emoji === emoji)
      const reactions = mine
        ? target.reactions.filter((r) => !(r.by === by && r.emoji === emoji))
        : [...target.reactions, { by, emoji, at: new Date().toISOString() }]
      const updated = { ...target, reactions }
      void commit(
        all.map((t) => (t.id === id ? updated : t)),
        () => backend.upsertTodos([updated])
      )
    },
    [commit]
  )

  /** The line this person leaves on the other's card. Saved as they pause. */
  const setNoteForPartner = useCallback(
    (text: string) => updateProfile(meRef.current, { note_for_partner: text }, "soon"),
    [updateProfile]
  )

  /** "thinking of you" */
  const ping = useCallback(() => {
    updateProfile(meRef.current, { last_ping_at: new Date().toISOString() })
  }, [updateProfile])

  /**
   * Mirror this person's focus timer onto their profile, so the other phone
   * can show it and join. Only writes when something actually changed.
   */
  const setFocus = useCallback(
    (session: FocusSession) => {
      const id = meRef.current
      const cur = profilesRef.current[id]
      const patch: Partial<Profile> = session
        ? {
            focus_ends_at: new Date(session.endsAt).toISOString(),
            focus_duration: session.minutes,
            focus_mode: session.mode,
            started_by: session.startedBy,
          }
        : {
            focus_ends_at: null,
            focus_duration: null,
            focus_mode: null,
            started_by: null,
          }
      const same =
        (cur.focus_ends_at ? Date.parse(cur.focus_ends_at) : null) ===
          (patch.focus_ends_at ? Date.parse(patch.focus_ends_at) : null) &&
        cur.focus_mode === patch.focus_mode &&
        cur.started_by === patch.started_by
      if (same) return
      updateProfile(id, patch)
    },
    [updateProfile]
  )

  /**
   * Yesterday's unfinished top-level tasks, by owner — "yesterday" being
   * *their* yesterday. Only offered while looking at today.
   */
  const leftovers = useMemo(() => {
    const find = (owner: PersonId) => {
      if (dayOffset !== 0) return []
      const yesterday = localDay(profiles[owner].timezone, -1)
      return todos.filter(
        (t) =>
          t.scope === "personal" &&
          t.owner === owner &&
          t.day === yesterday &&
          t.parent_id === null &&
          !t.completed
      )
    }
    return { a: find("a"), b: find("b") }
  }, [dayOffset, profiles, todos])

  /**
   * Move yesterday's unfinished tasks onto today, each with everything nested
   * under it, after whatever is already planned. Moved rather than copied, so
   * the same task never shows up on two days.
   */
  const bringOver = useCallback(
    (owner: PersonId) => {
      const all = todosRef.current
      const today = localDay(profilesRef.current[owner].timezone)
      const yesterday = localDay(profilesRef.current[owner].timezone, -1)
      const roots = all
        .filter(
          (t) =>
            t.scope === "personal" &&
            t.owner === owner &&
            t.day === yesterday &&
            t.parent_id === null &&
            !t.completed
        )
        .sort((x, y) => x.position - y.position)
      if (roots.length === 0) return

      let next = all
        .filter(
          (t) =>
            t.scope === "personal" &&
            t.owner === owner &&
            t.day === today &&
            t.parent_id === null
        )
        .reduce((max, t) => Math.max(max, t.position), -1)

      const moved = new Map<string, Todo>()
      for (const root of roots) {
        next += 1
        for (const id of withDescendants(all, root.id)) {
          const t = all.find((x) => x.id === id)!
          moved.set(id, {
            ...t,
            day: today,
            position: id === root.id ? next : t.position,
          })
        }
      }

      void commit(
        all.map((t) => moved.get(t.id) ?? t),
        () => backend.upsertTodos([...moved.values()])
      )
      toast({
        message: `brought over ${roots.length} from yesterday`,
        icon: "🌅",
        duration: 3500,
      })
    },
    [commit]
  )

  /** Per-person view of the currently selected day, already nested. */
  const columns = useMemo(() => {
    const build = (owner: PersonId) => {
      const day = localDay(profiles[owner].timezone, dayOffset)
      const mine = todos.filter(
        (t) => t.scope === "personal" && t.owner === owner && t.day === day
      )
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
    leftovers,
    bringOver,
    reorder,
    toggleReaction,
    setNoteForPartner,
    ping,
    setFocus,
    partner: other(me),
    /** whether cheers, memories, notes, together and shared focus can be saved */
    v3: backend.kind === "local" || v3,
  }
}
