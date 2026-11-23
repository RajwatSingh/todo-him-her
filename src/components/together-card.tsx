import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"

import { TaskList } from "@/components/todo-item"
import { Twemoji } from "@/components/twemoji"
import { haptic } from "@/lib/haptic"
import { guessIcon } from "@/lib/icons"
import { TaskContext, type TaskActions } from "@/lib/task-context"
import type { TodoNode } from "@/lib/types"
import { cn } from "@/lib/utils"

const TONE = "var(--t-accent)"
const GLOW = "var(--t-glow)"

/**
 * The third list: things that belong to both of you — the Sunday call, the
 * film you'll start at the same moment, the flight. It has no clock and no
 * day; it isn't anyone's morning or night, so it sits below the two columns,
 * across both, and keeps everything until it's cleared.
 */
export function TogetherCard({
  tree,
  total,
  done,
  onAdd,
  onClearDone,
  actions,
}: {
  tree: TodoNode[]
  total: number
  done: number
  onAdd: (text: string) => void
  onClearDone: () => void
  actions: Omit<TaskActions, "tone" | "glow">
}) {
  const [draft, setDraft] = useState("")

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    onAdd(text)
    setDraft("")
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 30, delay: 0.1 }}
      aria-label="together"
      className="relative z-10 mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-[var(--ground-day)] shadow-[0_22px_54px_-26px_oklch(0.05_0.02_285/0.9)] md:mt-6"
    >
      {/* both of their lights, meeting in the middle */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-64 -translate-x-1/2 rounded-full opacity-80 blur-2xl"
        style={{ background: `radial-gradient(circle, ${GLOW} 0%, transparent 70%)` }}
      />

      <div className="relative z-10 flex items-baseline justify-between gap-3 px-5 pt-5">
        <div className="flex items-baseline gap-2">
          <span aria-hidden className="flex items-center gap-0.5 self-center">
            <span className="size-2 rounded-full" style={{ backgroundColor: "var(--a-accent)" }} />
            <span className="size-2 rounded-full border-[1.5px]" style={{ borderColor: "var(--b-accent)" }} />
          </span>
          <h2 className="text-lead leading-none font-medium tracking-[-0.02em]">together</h2>
          <span className="text-fine text-white/65">plans for both of you</span>
        </div>
        <span className="flex shrink-0 items-baseline gap-3 text-fine text-white/65 tnum">
          {total > 0 ? `${done} of ${total}` : null}
          {done > 0 ? (
            <button
              type="button"
              onClick={onClearDone}
              className="underline-offset-4 transition-colors outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
            >
              clear done
            </button>
          ) : null}
        </span>
      </div>

      <label
        className={cn(
          "group/add relative z-10 mx-5 mt-4 flex cursor-text items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2",
          "shadow-[inset_0_1px_2px_oklch(0.05_0.02_285/0.35)] transition-colors",
          "hover:border-white/15 focus-within:border-white/25 focus-within:bg-white/[0.07]"
        )}
      >
        <span className="grid size-5 shrink-0 place-items-center text-white/50 transition-colors group-focus-within/add:text-white/75">
          {draft.trim() ? (
            <Twemoji className="size-4">{guessIcon(draft)}</Twemoji>
          ) : (
            <Plus className="size-4" strokeWidth={2} />
          )}
        </span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit()
          }}
          placeholder="something to do together…"
          className="min-w-0 flex-1 bg-transparent text-body leading-6 outline-none placeholder:text-white/45"
        />
        <AnimatePresence>
          {draft.trim() ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              onClick={() => {
                haptic(8)
                submit()
              }}
              className="-my-0.5 rounded-md px-2 py-0.5 text-xs font-medium transition-[filter] outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/40"
              style={{ backgroundColor: TONE, color: "var(--void)" }}
            >
              add
            </motion.button>
          ) : null}
        </AnimatePresence>
      </label>

      <div className="relative z-10 px-3 pt-3 pb-4">
        {tree.length === 0 ? (
          <p className="px-2 pt-1 pb-2 text-small leading-relaxed text-white/65">
            nothing planned together yet — a call, a film, the next visit.
          </p>
        ) : (
          <TaskContext.Provider value={{ ...actions, tone: TONE, glow: GLOW }}>
            <TaskList nodes={tree} depth={0} />
          </TaskContext.Provider>
        )}
      </div>
    </motion.section>
  )
}
