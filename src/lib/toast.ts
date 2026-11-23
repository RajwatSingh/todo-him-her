import { useSyncExternalStore } from "react"

/**
 * A very small toast queue: a module-level list and a subscribe function, so
 * the data hooks can raise a toast without threading a context through them.
 * The <Toaster /> is the only thing that renders it.
 */

export type ToastAction = { label: string; onClick: () => void }

export type Toast = {
  id: number
  message: string
  action?: ToastAction
  /** a small mark at the front — an emoji, usually */
  icon?: string
  /** ms on screen */
  duration: number
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const timers = new Map<number, number>()

function emit() {
  for (const l of listeners) l()
}

/** Show a toast. Returns its id, for `dismiss`. */
export function toast(input: Omit<Toast, "id" | "duration"> & { duration?: number }) {
  const t: Toast = { duration: 5000, ...input, id: nextId++ }
  // three at most; the oldest makes room
  toasts = [...toasts, t].slice(-3)
  emit()
  timers.set(
    t.id,
    window.setTimeout(() => dismiss(t.id), t.duration)
  )
  return t.id
}

export function dismiss(id: number) {
  const timer = timers.get(id)
  if (timer !== undefined) window.clearTimeout(timer)
  timers.delete(id)
  const next = toasts.filter((t) => t.id !== id)
  if (next.length === toasts.length) return
  toasts = next
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts)
}

/** "finish the reading respo…" — short enough to sit in a toast. */
export function clip(text: string, max = 28) {
  const t = text.trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}
