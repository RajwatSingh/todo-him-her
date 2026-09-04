import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Coffee, MoonStar, Plus, Sun, Sunrise } from "lucide-react"

import { NightSky } from "@/components/night-sky"
import { TodoItem } from "@/components/todo-item"
import { Twemoji } from "@/components/twemoji"
import { guessIcon } from "@/lib/icons"
import {
  clockIn,
  dayPhaseIn,
  humanDuration,
  longDateIn,
  resolveSleep,
} from "@/lib/time"
import type { PersonId, Profile, Todo, TodoNode } from "@/lib/types"
import { cn } from "@/lib/utils"

export type PersonColumnProps = {
  profile: Profile
  tree: TodoNode[]
  total: number
  done: number
  dayOffset: number
  now: Date
  onAdd: (owner: PersonId, text: string, parentId?: string | null) => void
  onToggle: (id: string) => void
  onPatch: (id: string, patch: Partial<Omit<Todo, "id">>) => void
  onRemove: (id: string) => void
  onRename: (name: string) => void
  onClearCompleted: () => void
  /** their own "goodnight" / "good morning", which outranks the clock */
  onSetSleeping: (asleep: boolean) => void
}

export function PersonColumn({
  profile,
  tree,
  total,
  done,
  dayOffset,
  now,
  onAdd,
  onToggle,
  onPatch,
  onRemove,
  onRename,
  onClearCompleted,
  onSetSleeping,
}: PersonColumnProps) {
  const [draft, setDraft] = useState("")

  const isA = profile.id === "a"
  const tone = isA ? "var(--a-accent)" : "var(--b-accent)"
  const glow = isA ? "var(--a-glow)" : "var(--b-glow)"
  // the ground is set by the hour where *they* are, not where the page is
  const tint = `var(--ground-${dayPhaseIn(profile.timezone, now)})`

  const sleep = resolveSleep(profile, now)
  const time = clockIn(profile.timezone, now)
  const dateLabel = longDateIn(profile.timezone, dayOffset, now)
  const progress = total === 0 ? 0 : done / total

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    onAdd(profile.id, text, null)
    setDraft("")
  }

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl",
        "border border-border bg-card",
        "shadow-[0_1px_2px_rgba(20,26,38,0.04)]"
      )}
      style={{ backgroundColor: tint }}
    >
      {/* ---------------------------------------------------------------- */}
      {/* header — turns into a night scene while they're asleep            */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative overflow-hidden">
        <AnimatePresence>
          {sleep.asleep ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(160deg, var(--night) 0%, var(--night-soft) 100%)",
              }}
            >
              <NightSky seed={profile.id} className="absolute inset-0" />
              {/* dissolve the night into the card rather than cutting it off.
                  Kept to the empty strip below the progress bar so the white
                  header text never sits on the light end of the gradient. */}
              <div
                className="absolute inset-x-0 bottom-0 h-7"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${tint})`,
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="relative px-5 pt-5 pb-7">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {/* one filled, one open — the same pair as the favicon, so the
                  two of them are told apart by shape as well as by colour */}
              <span
                className="mb-0.5 size-2.5 shrink-0 self-center rounded-full"
                aria-hidden
                style={
                  isA
                    ? { backgroundColor: sleep.asleep ? "#fff" : tone }
                    : {
                        border: `1.5px solid ${sleep.asleep ? "#fff" : tone}`,
                      }
                }
              />

              <input
                value={profile.name}
                onChange={(e) => onRename(e.target.value)}
                aria-label="name"
                size={Math.max(profile.name.length, 3)}
                className={cn(
                  "min-w-0 max-w-[9rem] bg-transparent font-display text-[1.6rem] leading-none font-light tracking-tight",
                  "outline-none transition-colors",
                  sleep.asleep ? "text-white/95" : "text-foreground"
                )}
              />
            </div>

            <div className="text-right">
              <div
                className={cn(
                  "font-display text-lg leading-none tabular-nums transition-colors",
                  sleep.asleep ? "text-white/90" : "text-foreground/85"
                )}
              >
                {time}
              </div>
              <div
                className={cn(
                  "mt-1 text-[0.68rem] transition-colors",
                  sleep.asleep ? "text-white/55" : "text-muted-foreground"
                )}
              >
                {profile.location}
              </div>
            </div>
          </div>

          {/* status pill + the goodnight switch */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <motion.span
              layout
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
                "text-[0.7rem] font-medium",
                sleep.asleep
                  ? "bg-white/10 text-white/90 ring-1 ring-white/15"
                  : "bg-background/70 text-foreground/75 ring-1 ring-border"
              )}
            >
              {sleep.asleep ? (
                <>
                  <motion.span
                    animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="grid place-items-center"
                  >
                    <MoonStar className="size-3.5" />
                  </motion.span>
                  {sleep.manual
                    ? `asleep, tucked in ${sinceLabel(sleep.minutesSinceTap)}`
                    : `asleep, wakes in ${humanDuration(sleep.minutesUntilChange)}`}
                </>
              ) : sleep.manual ? (
                <>
                  <Coffee className="size-3.5" style={{ color: tone }} />
                  still up, {sinceLabel(sleep.minutesSinceTap)}
                </>
              ) : (
                <>
                  <Sun className="size-3.5" style={{ color: tone }} />
                  awake
                </>
              )}
            </motion.span>

            <span
              className={cn(
                "text-[0.7rem] transition-colors",
                sleep.asleep ? "text-white/50" : "text-muted-foreground"
              )}
            >
              {dateLabel}
            </span>

            {/* Their own word about it — the clock is only ever a guess. */}
            <motion.button
              layout
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onSetSleeping(!sleep.asleep)}
              title={
                sleep.asleep
                  ? `mark ${profile.name} as awake`
                  : `mark ${profile.name} as asleep`
              }
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1",
                "text-[0.68rem] font-medium transition-colors",
                sleep.asleep
                  ? "text-white/65 ring-1 ring-white/15 hover:bg-white/12 hover:text-white"
                  : "text-muted-foreground ring-1 ring-border hover:bg-background/80 hover:text-foreground"
              )}
            >
              {sleep.asleep ? (
                <>
                  <Sunrise className="size-3.5" />
                  good morning
                </>
              ) : (
                <>
                  <MoonStar className="size-3.5" />
                  goodnight
                </>
              )}
            </motion.button>
          </div>

          {/* progress */}
          <div className="mt-3.5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span
                className={cn(
                  "text-[0.7rem]",
                  sleep.asleep ? "text-white/60" : "text-muted-foreground"
                )}
              >
                {total === 0
                  ? "nothing planned yet"
                  : done === total
                    ? "everything done"
                    : `${done} of ${total} done`}
              </span>
              {done > 0 ? (
                <button
                  type="button"
                  onClick={onClearCompleted}
                  className={cn(
                    "text-[0.66rem] underline-offset-2 transition-colors hover:underline",
                    sleep.asleep
                      ? "text-white/45 hover:text-white/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  clear done
                </button>
              ) : null}
            </div>

            <div
              className={cn(
                "h-[3px] w-full overflow-hidden rounded-full",
                sleep.asleep ? "bg-white/12" : "bg-foreground/8"
              )}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: tone }}
                initial={false}
                animate={{ width: `${progress * 100}%` }}
                transition={{ type: "spring", stiffness: 180, damping: 26 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* add                                                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="px-4 pt-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg bg-background/70 px-3 py-2",
            "ring-1 ring-border transition-colors",
            "focus-within:ring-[1.5px] focus-within:ring-[var(--tone)]"
          )}
          style={{ ["--tone" as string]: tone }}
        >
          <span className="grid size-5 shrink-0 place-items-center opacity-45">
            {draft.trim() ? (
              <Twemoji className="size-4">{guessIcon(draft)}</Twemoji>
            ) : (
              <Plus className="size-4" strokeWidth={2.5} />
            )}
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit()
            }}
            placeholder={`what's on ${profile.name}'s day?`}
            className="min-w-0 flex-1 bg-transparent text-[0.88rem] outline-none placeholder:text-muted-foreground/55"
          />
          <AnimatePresence>
            {draft.trim() ? (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                whileTap={{ scale: 0.9 }}
                onClick={submit}
                className="rounded-md px-2.5 py-1 text-[0.7rem] font-medium text-white"
                style={{ background: tone }}
              >
                add
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* list                                                             */}
      {/* ---------------------------------------------------------------- */}
      <div className="min-h-[9rem] flex-1 px-2.5 pt-2 pb-4">
        {tree.length === 0 ? (
          <EmptyState asleep={sleep.asleep} name={profile.name} />
        ) : (
          <ul className="space-y-0.5">
            <AnimatePresence initial={false}>
              {tree.map((node) => (
                <TodoItem
                  key={node.id}
                  node={node}
                  depth={0}
                  tone={tone}
                  glow={glow}
                  onToggle={onToggle}
                  onPatch={onPatch}
                  onRemove={onRemove}
                  onAddChild={(parentId, text) =>
                    onAdd(profile.id, text, parentId)
                  }
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </motion.section>
  )
}

/** "just now" / "20m ago" — how long they've been in this state. */
function sinceLabel(minutes: number) {
  return minutes < 1 ? "just now" : `${humanDuration(minutes)} ago`
}

function EmptyState({ asleep, name }: { asleep: boolean; name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid h-36 place-items-center px-6 text-center"
    >
      <p className="font-display text-[0.85rem] leading-relaxed text-muted-foreground italic">
        {asleep
          ? `${name} is asleep. the day hasn't started yet.`
          : "a blank day. add the first thing."}
      </p>
    </motion.div>
  )
}
