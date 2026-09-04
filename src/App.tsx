import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { CloudOff, Heart } from "lucide-react"

import { DaySwitcher } from "@/components/day-switcher"
import { HelloHeader } from "@/components/hello-header"
import { PersonColumn } from "@/components/person-column"
import { ShimmeringText } from "@/components/shimmering-text"
import { useOurDays } from "@/lib/store"
import { offsetBetween, sleepStateIn } from "@/lib/time"
import { PEOPLE } from "@/lib/types"
import { useNow } from "@/lib/use-now"

const NOTES = [
  "small steps still count",
  "one day at a time",
  "you're both doing fine",
  "good things take time",
  "be kind to yourself today",
  "the distance is temporary",
  "proud of you both",
]

export default function App() {
  const [dayOffset, setDayOffset] = useState(0)
  const now = useNow()

  const {
    profiles,
    columns,
    status,
    error,
    mode,
    addTodo,
    patchTodo,
    toggleTodo,
    removeTodo,
    clearCompleted,
    saveProfile,
  } = useOurDays(dayOffset)

  const gap = offsetBetween(profiles.a.timezone, profiles.b.timezone, now)

  const subtitle = useMemo(() => {
    const aSleep = sleepStateIn(profiles.a.timezone, now).asleep
    const bSleep = sleepStateIn(profiles.b.timezone, now).asleep

    if (aSleep && bSleep) return "you're both asleep. the list will wait."
    if (aSleep) return `${profiles.a.name} is asleep · ${profiles.b.name} is up`
    if (bSleep) return `${profiles.b.name} is asleep · ${profiles.a.name} is up`
    return `both awake at the same time — ${gap.label.replace(" ahead", " apart").replace(" behind", " apart")}`
  }, [gap.label, now, profiles])

  const note = NOTES[Math.floor(Date.now() / 86_400_000) % NOTES.length]
  const totalDone = columns.a.done + columns.b.done
  const totalAll = columns.a.total + columns.b.total

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-10 sm:px-6">
      <HelloHeader subtitle={subtitle} />

      <div className="pt-4 pb-5">
        <DaySwitcher value={dayOffset} onChange={setDayOffset} />
      </div>

      <main className="relative z-10 grid flex-1 grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-5">
        {PEOPLE.map((id) => (
          <PersonColumn
            key={id}
            profile={profiles[id]}
            tree={columns[id].tree}
            total={columns[id].total}
            done={columns[id].done}
            dayOffset={dayOffset}
            now={now}
            onAdd={addTodo}
            onToggle={toggleTodo}
            onPatch={patchTodo}
            onRemove={removeTodo}
            onRename={(name) => saveProfile({ ...profiles[id], name })}
            onClearCompleted={() => clearCompleted(id, columns[id].day)}
          />
        ))}
      </main>

      {/* the thread between the two columns */}
      <div className="pointer-events-none relative z-10 flex justify-center py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 text-[0.72rem] text-muted-foreground"
        >
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-border" />
          <motion.span
            animate={{ scale: [1, 1.16, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart
              className="size-3.5"
              style={{ color: "var(--a-accent)" }}
              fill="currentColor"
            />
          </motion.span>
          <span>
            {totalAll > 0
              ? `${totalDone} of ${totalAll} done between you`
              : note}
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-border" />
        </motion.div>
      </div>

      <footer className="relative z-10 flex flex-col items-center gap-2 pb-2 text-center">
        <ShimmeringText
          text={note}
          duration={3.2}
          className="font-display text-[0.82rem] font-light [--color:var(--muted-foreground)] [--shimmering-color:var(--a-accent)]"
        />

        {mode === "local" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-[0.65rem] text-muted-foreground ring-1 ring-black/5">
            <CloudOff className="size-3" />
            saved on this device only — not syncing yet
          </span>
        ) : null}

        {status === "error" && error ? (
          <span className="text-[0.65rem] text-destructive/80">{error}</span>
        ) : null}
      </footer>
    </div>
  )
}
