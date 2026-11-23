import { createContext, useContext } from "react"

import type { PersonId, Todo } from "@/lib/types"

/**
 * What every task row in one list can do, and the colours it's drawn in.
 * Provided once per list (each person's column, the together list) so the
 * rows don't have to pass a dozen callbacks down through every level of
 * nesting.
 */
export type TaskActions = {
  tone: string
  glow: string
  toggle: (id: string) => void
  patch: (id: string, patch: Partial<Omit<Todo, "id">>) => void
  remove: (id: string) => void
  addChild: (parentId: string, text: string) => void
  /** new order of one set of siblings, by id */
  reorder: (ids: string[]) => void
  /** who is holding this phone — cheers go on the other one's tasks */
  me: PersonId
  /** whether the v3 fields (cheers, memories) can be saved */
  v3: boolean
  /** toggle this phone's cheer on a task */
  cheer: (id: string) => void
  /** keep a finished task in the scrapbook, or let it go */
  keep: (id: string) => void
}

export const TaskContext = createContext<TaskActions | null>(null)

export function useTasks() {
  const value = useContext(TaskContext)
  if (!value) throw new Error("useTasks needs a <TaskContext.Provider>")
  return value
}
