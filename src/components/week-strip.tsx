import { BookOpen } from "lucide-react"

import { localDay } from "@/lib/time"
import { PEOPLE, type PersonId, type Profile, type Todo } from "@/lib/types"
import { cn } from "@/lib/utils"

const TONES: Record<PersonId, string> = { a: "var(--a-accent)", b: "var(--b-accent)" }

/**
 * This week at a glance: Monday to Sunday on this phone's calendar, with a
 * dot for each of you under every day — filled the more of that day was
 * done, in the same pair of shapes as the cards (one solid, one ring). Each
 * person's dot counts *their* day, so "Wednesday" is Wednesday in Pune for
 * her and Wednesday in Gettysburg for him. Tap a day to go to it.
 */
export function WeekStrip({
  todos,
  profiles,
  me,
  dayOffset,
  now,
  onPick,
  memories,
  onOpenMemories,
}: {
  todos: Todo[]
  profiles: Record<PersonId, Profile>
  me: PersonId
  dayOffset: number
  now: Date
  onPick: (offset: number) => void
  memories: number
  /** absent when memories can't be saved */
  onOpenMemories?: () => void
}) {
  const today = localDay(profiles[me].timezone, 0, now)
  const [y, m, d] = today.split("-").map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  const mondayOffset = -((dow + 6) % 7)

  let weekDone = 0
  let weekTotal = 0

  const days = Array.from({ length: 7 }, (_, i) => {
    const offset = mondayOffset + i
    const date = new Date(Date.UTC(y, m - 1, d + offset))
    const per = PEOPLE.map((id) => {
      const key = localDay(profiles[id].timezone, offset, now)
      const mine = todos.filter((t) => t.scope === "personal" && t.owner === id && t.day === key)
      const done = mine.filter((t) => t.completed).length
      weekDone += done
      weekTotal += mine.length
      return { id, done, total: mine.length }
    })
    return {
      offset,
      letter: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(date),
      date: date.getUTCDate(),
      per,
    }
  })

  return (
    <div className="relative z-10 mx-auto mb-4 w-full max-w-md">
      <div role="group" aria-label="this week" className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const selected = day.offset === dayOffset
          const isToday = day.offset === 0
          return (
            <button
              key={day.offset}
              type="button"
              onClick={() => onPick(day.offset)}
              aria-pressed={selected}
              aria-label={`${day.letter} ${day.date}: ${day.per
                .map((p) => `${profiles[p.id].name} ${p.done} of ${p.total}`)
                .join(", ")}`}
              className={cn(
                "flex min-h-10 flex-col items-center gap-1 rounded-xl border py-1.5 outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-white/40",
                selected
                  ? "border-white/12 bg-white/[0.08]"
                  : "border-transparent hover:bg-white/[0.04]"
              )}
            >
              <span className={cn("text-[0.6875rem] leading-none", isToday ? "font-medium text-foreground" : "text-white/55")}>
                {day.letter.toLowerCase()}
              </span>
              <span className={cn("text-small leading-none tnum", isToday ? "font-medium text-foreground" : "text-white/75")}>
                {day.date}
              </span>
              <span className="flex items-center gap-1" aria-hidden>
                {day.per.map((p) => (
                  <Dot key={p.id} id={p.id} done={p.done} total={p.total} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3 px-1">
        <span className="text-fine text-white/65 tnum">
          {weekTotal === 0
            ? "a fresh week"
            : weekDone === weekTotal
              ? `all ${weekTotal} done between you this week`
              : `${weekDone} of ${weekTotal} between you this week`}
        </span>
        {onOpenMemories ? (
          <button
            type="button"
            onClick={onOpenMemories}
            className="group/mem -my-2 inline-flex min-h-10 shrink-0 items-center outline-none"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-white/80 transition-colors group-hover/mem:bg-white/[0.12] group-hover/mem:text-foreground group-focus-visible/mem:ring-2 group-focus-visible/mem:ring-white/40">
              <BookOpen className="size-3" />
              memories{memories > 0 ? ` · ${memories}` : ""}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** Filled for one of you, a ring for the other; brighter the more got done. */
function Dot({ id, done, total }: { id: PersonId; done: number; total: number }) {
  const tone = TONES[id]
  const share = total === 0 ? 0 : done / total
  const strength = total === 0 ? 0 : 0.3 + 0.7 * share
  const mix = `color-mix(in oklab, ${tone} ${Math.round(strength * 100)}%, transparent)`
  const empty = "oklch(1 0 0 / 14%)"
  return id === "a" ? (
    <span className="size-1.5 rounded-full" style={{ backgroundColor: total === 0 ? empty : mix }} />
  ) : (
    <span
      className="size-1.5 rounded-full border-[1.5px]"
      style={{ borderColor: total === 0 ? empty : mix }}
    />
  )
}
