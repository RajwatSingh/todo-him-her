import { useEffect, useRef, useState } from "react"
import { BookmarkX, X } from "lucide-react"

import { Twemoji } from "@/components/twemoji"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PersonId, Profile, Todo } from "@/lib/types"

/** "Sunday, November 22" for a "YYYY-MM-DD" key, without a timezone shift. */
function dayLabel(day: string) {
  const [y, m, d] = day.split("-").map(Number)
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)))
}

const TONES: Record<PersonId, string> = { a: "var(--a-accent)", b: "var(--b-accent)" }

/**
 * Everything either of you kept, in the order it happened, grouped by day.
 * Opens scrolled to the end — the newest — with the beginning above it.
 * Each memory can carry a line about why it was worth keeping.
 */
export function Scrapbook({
  open,
  onOpenChange,
  memories,
  profiles,
  onNote,
  onLetGo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  memories: Todo[]
  profiles: Record<PersonId, Profile>
  onNote: (id: string, note: string) => void
  onLetGo: (id: string) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      const el = listRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  const days: { day: string; items: Todo[] }[] = []
  for (const m of memories) {
    const last = days[days.length - 1]
    if (last?.day === m.day) last.items.push(m)
    else days.push({ day: m.day, items: [m] })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pt-5 pb-4">
          <div className="space-y-1.5">
            <DialogTitle>memories</DialogTitle>
            <DialogDescription>
              {memories.length === 0
                ? "the things you keep end up here"
                : `${memories.length} kept, from ${dayLabel(memories[0].day)}`}
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="close"
            className="-mt-1.5 -mr-2 grid size-10 place-items-center rounded-full text-white/60 transition-colors outline-none hover:bg-white/[0.08] hover:text-foreground focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <X className="size-4" />
          </DialogClose>
        </div>

        <div ref={listRef} className="pretty-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-6">
          {memories.length === 0 ? (
            <p className="py-10 text-center text-small leading-relaxed text-white/65">
              tear something off, then tap the bookmark on it
              <br />
              to keep it here.
            </p>
          ) : (
            <ol className="space-y-6">
              {days.map(({ day, items }) => (
                <li key={day}>
                  <h3 className="mb-2.5 flex items-center gap-3 text-fine font-medium tracking-wide text-white/65">
                    {dayLabel(day)}
                    <span aria-hidden className="h-px flex-1 bg-white/10" />
                  </h3>
                  <ul className="space-y-2">
                    {items.map((m) => (
                      <Memory
                        key={m.id}
                        memory={m}
                        owner={profiles[m.owner]}
                        together={m.scope === "together"}
                        onNote={(note) => onNote(m.id, note)}
                        onLetGo={() => onLetGo(m.id)}
                      />
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Memory({
  memory,
  owner,
  together,
  onNote,
  onLetGo,
}: {
  memory: Todo
  owner: Profile
  together: boolean
  onNote: (note: string) => void
  onLetGo: () => void
}) {
  const [draft, setDraft] = useState(memory.memory_note)
  // saved once typing pauses, not on every letter
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const tone = together ? "var(--t-accent)" : TONES[memory.owner]

  return (
    <li className="group/mem rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-5 shrink-0 place-items-center">
          {memory.icon ? (
            <Twemoji className="size-4">{memory.icon}</Twemoji>
          ) : (
            <span className="size-1.5 rounded-full" style={{ backgroundColor: tone }} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body leading-snug break-words">{memory.text}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-fine text-white/65">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: tone }} />
            {together ? "together" : owner.name}
            {memory.reactions.length > 0 ? (
              <span className="ml-1 inline-flex items-center gap-0.5">
                {[...new Set(memory.reactions.map((r) => r.emoji))].slice(0, 3).map((e) => (
                  <Twemoji key={e} className="size-3">
                    {e}
                  </Twemoji>
                ))}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onLetGo}
          aria-label={`let go of ‘${memory.text}’`}
          title="let it go"
          className="-mt-1 -mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-white/45 opacity-0 transition outline-none group-hover/mem:opacity-100 hover:bg-white/[0.08] hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/40 max-sm:opacity-60"
        >
          <BookmarkX className="size-3.5" />
        </button>
      </div>
      <input
        value={draft}
        maxLength={140}
        onChange={(e) => {
          const next = e.target.value
          setDraft(next)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => onNote(next), 600)
        }}
        placeholder="what made it worth keeping?"
        aria-label="a line about this memory"
        className="font-hand mt-1.5 ml-[1.875rem] block w-[calc(100%-1.875rem)] border-b border-dashed border-white/10 bg-transparent pb-0.5 text-[1.25rem] leading-tight text-foreground/90 outline-none placeholder:text-white/30 focus:border-white/30"
      />
    </li>
  )
}
