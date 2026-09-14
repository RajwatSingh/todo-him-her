import { useCallback, useMemo, useState } from "react"
import { motion } from "motion/react"
import { DaySwitcher } from "@/components/day-switcher"
import { OurFooter } from "@/components/footer"
import { HelloHeader } from "@/components/hello-header"
import { PersonColumn } from "@/components/person-column"
import { Pomodoro } from "@/components/pomodoro"
import { Sky, lightFor } from "@/components/sky"
import { TabSwitcher, type TabId } from "@/components/tab-switcher"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useOurDays } from "@/lib/store"
import { offsetBetween, partsIn, resolveSleep } from "@/lib/time"
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

const TAB_KEY = "our-days:tab"

export default function App() {
  const [tab, setTab] = useState<TabId>(() => {
    try {
      return localStorage.getItem(TAB_KEY) === "focus" ? "focus" : "days"
    } catch {
      return "days"
    }
  })
  const [chrome, setChrome] = useState(true)

  const openTab = useCallback((next: string) => {
    setTab(next as TabId)
    setChrome(true)
    try {
      localStorage.setItem(TAB_KEY, next)
    } catch {
      // private mode; it just won't reopen where you left off
    }
  }, [])

  return (
    <Tabs value={tab} onValueChange={openTab} className="gap-0">
      <TabSwitcher value={tab} hidden={tab === "focus" && !chrome} />

      {/* Both panels stay mounted: the timer has to keep counting while the
          list is up, and coming back to a block that had quietly reset itself
          would make the whole tab untrustworthy. Each one is told whether it
          is the one on screen, so only the visible tab puts a sky up — they
          are fixed, full-page layers, and there is only ever one sky. */}
      <TabsContent value="days" forceMount hidden={tab !== "days"}>
        <Days active={tab === "days"} />
      </TabsContent>

      <TabsContent value="focus" forceMount hidden={tab !== "focus"}>
        <Pomodoro active={tab === "focus"} onChromeChange={setChrome} />
      </TabsContent>
    </Tabs>
  )
}

function Days({ active }: { active: boolean }) {
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
    setSleeping,
  } = useOurDays(dayOffset)

  const gap = offsetBetween(profiles.a.timezone, profiles.b.timezone, now)

  const subtitle = useMemo(() => {
    const aSleep = resolveSleep(profiles.a, now).asleep
    const bSleep = resolveSleep(profiles.b, now).asleep

    if (aSleep && bSleep) return "you're both asleep. the list will wait."
    if (aSleep)
      return `${profiles.a.name} is asleep while ${profiles.b.name} is up`
    if (bSleep)
      return `${profiles.b.name} is asleep while ${profiles.a.name} is up`
    return `both awake at once, ${gap.label.replace(" ahead", " apart").replace(" behind", " apart")}`
  }, [gap.label, now, profiles])

  const note = NOTES[Math.floor(Date.now() / 86_400_000) % NOTES.length]
  const totalDone = columns.a.done + columns.b.done
  const totalAll = columns.a.total + columns.b.total

  // Their two lights, each sitting at the hour on their own clock: high and
  // bright at noon where they are, below the bottom edge in the middle of
  // their night. Whoever is in daylight lights their own side of the page.
  const lights = useMemo(() => {
    const a = partsIn(profiles.a.timezone, now)
    const b = partsIn(profiles.b.timezone, now)
    return [
      lightFor(a.hour, a.minute, 0.22, "warm"),
      lightFor(b.hour, b.minute, 0.78, "cool"),
    ]
  }, [now, profiles.a.timezone, profiles.b.timezone])

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pt-16 pb-10 sm:px-6">
      {active ? <Sky variant="day" lights={lights} /> : null}

      <HelloHeader subtitle={subtitle} />

      <div className="pt-4 pb-5">
        <DaySwitcher value={dayOffset} onChange={setDayOffset} />
      </div>

      <main className="relative z-10 grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6">
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
            onSetSleeping={(asleep) => setSleeping(id, asleep)}
          />
        ))}
      </main>

      {/* the seam between the two columns: one hairline, the shared count
          resting on it, reaching out to each of them */}
      <div className="pointer-events-none relative z-10 flex justify-center py-7">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="flex w-full max-w-md items-center gap-3"
        >
          <span
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(to right, transparent, var(--a-soft))",
            }}
          />
          {totalAll > 0 ? (
            <span className="font-display text-[0.8rem] whitespace-nowrap text-muted-foreground italic">
              {totalDone} of {totalAll} done between you
            </span>
          ) : null}
          <span
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(to left, transparent, var(--b-soft))",
            }}
          />
        </motion.div>
      </div>

      <OurFooter
        note={note}
        mode={mode}
        error={status === "error" ? error : null}
      />
    </div>
  )
}
