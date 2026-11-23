import { createContext, useContext } from "react"

import type { Todo } from "@/lib/types"

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
}

export const TaskContext = createContext<TaskActions | null>(null)

export function useTasks() {
  const value = useContext(TaskContext)
  if (!value) throw new Error("useTasks needs a <TaskContext.Provider>")
  return value
}
