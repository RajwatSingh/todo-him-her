import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { MoonStar, Plus, Sunrise } from "lucide-react"

import { Figures } from "@/components/figures"
import { ScrollFadeEffect } from "@/components/scroll-fade-effect"
import { TodoItem } from "@/components/todo-item"
import { Twemoji } from "@/components/twemoji"
import { haptic } from "@/lib/haptic"
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

/**
 * One person's day, on its own card.
 *
 * The card opens the way a clock face opens: the hour where they are, big,
 * with everything else arranged around it. Name and place sit above it, the
 * day beside it, and a rule closes the head off from how they are and how
 * much of the day is behind them.
 *
 * The fill is their own hour — the card is bluer at dawn, warmer at dusk,
 * deepest in the middle of their night — and their own colour blooms in one
 * corner. That is what keeps the two of them from being the same rectangle
 * twice: each card is lit from its own side, in its own light.
 */
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
  // the card is filled by the hour where *they* are, not where the page is
  const tint = `var(--ground-${dayPhaseIn(profile.timezone, now)})`

  const sleep = resolveSleep(profile, now)
  const time = clockIn(profile.timezone, now)
  // Split "5:17 pm" so the hour can be set large and the suffix small beside
  // it. A 24-hour locale has no suffix, and then there is nothing to put there.
  const [clock, suffix = ""] = time.split(" ")
  const dateLabel = longDateIn(profile.timezone, dayOffset, now)
  const progress = total === 0 ? 0 : done / total

  const condition = sleep.asleep
    ? sleep.manual
      ? `asleep, tucked in ${sinceLabel(sleep.minutesSinceTap)}`
      : `asleep, wakes in ${humanDuration(sleep.minutesUntilChange)}`
    : sleep.manual
      ? `still up, ${sinceLabel(sleep.minutesSinceTap)}`
      : "awake"

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    onAdd(profile.id, text, null)
    setDraft("")
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: sleep.asleep ? 0.72 : 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 30 }}
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-[22px]",
        "border border-white/10",
        "shadow-[0_22px_54px_-26px_oklch(0.05_0.02_285/0.9)]"
      )}
      style={{ backgroundColor: tint, ["--tone" as string]: tone }}
    >
      {/* their own light, in their own corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-14 -right-10 z-0 size-52 rounded-full opacity-80 blur-2xl"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }}
      />
      {/* ------------------------------------------------------------------ */}
      {/* who, where, and what time it is where they are                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 px-5 pt-5">
        {/* who, and where they are */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {/* one filled, one open — the same pair as the favicon, so the two
                of them are told apart by shape as well as by colour */}
            <span
              className="size-2 shrink-0 rounded-full"
              aria-hidden
              style={
                isA
                  ? { backgroundColor: tone }
                  : { border: `1.5px solid ${tone}` }
              }
            />
            <input
              value={profile.name}
              onChange={(e) => onRename(e.target.value)}
              aria-label="name"
              size={Math.max(profile.name.length, 3)}
              className="font-display min-w-0 max-w-[8rem] bg-transparent text-lead leading-none text-foreground outline-none"
            />
          </div>
          <span className="shrink-0 text-fine text-muted-foreground">
            {profile.location}
          </span>
        </div>

        {/* the hour where they are, and the day it belongs to */}
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-display-xl text-hour leading-[0.9] text-foreground">
              <Figures>{clock}</Figures>
            </span>
            {suffix ? (
              <span className="text-small text-muted-foreground">{suffix}</span>
            ) : null}
          </div>
          <span className="shrink-0 text-fine text-muted-foreground">
            {dateLabel}
          </span>
        </div>

        <div className="mt-4 h-px w-full bg-white/10" />

        {/* how they are, and their own word about it — the clock is only
            ever a guess */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-small text-muted-foreground">{condition}</span>
          <button
            type="button"
            onClick={() => {
              haptic(8)
              onSetSleeping(!sleep.asleep)
            }}
            className="inline-flex shrink-0 items-center gap-1.5 text-fine text-muted-foreground underline-offset-4 transition-colors outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
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
          </button>
        </div>

        {/* "clear done" belongs beside the count it changes */}
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <span className="text-small text-foreground/80">
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
              className="text-fine text-muted-foreground underline-offset-4 transition-colors outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
            >
              clear done
            </button>
          ) : null}
        </div>

        {/* The bar sits directly under the count it measures, so it reads as
            the measure of that number rather than as a divider nearby. */}
        <div className="relative mt-2 h-px w-full bg-white/12">
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{ background: tone }}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 26 }}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* the next thing — a line to write on, not a box to fill in          */}
      {/* ------------------------------------------------------------------ */}
      <div className="group/add relative z-10 mx-5 mt-5 flex items-center gap-2.5 border-b border-white/14 pb-2.5 transition-colors focus-within:border-[var(--tone)]">
        <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
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
          placeholder={`what's on ${profile.name}'s day?`}
          className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground/70"
        />
        <AnimatePresence>
          {draft.trim() ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              onClick={submit}
              className="text-fine font-medium underline-offset-4 transition-opacity hover:underline"
              style={{ color: tone }}
            >
              add
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* the day itself                                                     */}
      {/* ------------------------------------------------------------------ */}
      {tree.length === 0 ? (
        <div className="relative z-10 px-5 pt-5 pb-6">
          <EmptyState asleep={sleep.asleep} name={profile.name} />
        </div>
      ) : (
        // A long day shouldn't end in a hard crop; the list dissolves at
        // whichever end there is still more to scroll toward.
        <ScrollFadeEffect className="pretty-scroll relative z-10 max-h-[24rem] flex-1 px-3 pt-3 pb-4">
          <ul className="space-y-0.5">
            <AnimatePresence initial={false}>
              {tree.map((node) => (
                <TodoItem
                  key={node.id}
                  node={node}
                  depth={0}
                  tone={tone}
                  glow={glow}
                  onToggle={(id) => {
                    haptic(8)
                    onToggle(id)
                  }}
                  onPatch={onPatch}
                  onRemove={onRemove}
                  onAddChild={(parentId, text) => onAdd(profile.id, text, parentId)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </ScrollFadeEffect>
      )}
    </motion.section>
  )
}

/** "just now" / "20m ago" — how long they've been in this state. */
function sinceLabel(minutes: number) {
  return minutes < 1 ? "just now" : `${humanDuration(minutes)} ago`
}

function EmptyState({ asleep, name }: { asleep: boolean; name: string }) {
  return (
    <p className="font-display max-w-[26ch] text-lead leading-snug text-muted-foreground italic">
      {asleep
        ? `${name} is asleep. the day hasn't started yet.`
        : "a blank day. add the first thing."}
    </p>
  )
}
