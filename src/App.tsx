import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { RotateCcw } from "lucide-react"
import { DaySwitcher } from "@/components/day-switcher"
import { OurFooter } from "@/components/footer"
import { HelloHeader } from "@/components/hello-header"
import { PersonColumn } from "@/components/person-column"
import { Pomodoro, type PomodoroSession } from "@/components/pomodoro"
import { Sky, lightFor } from "@/components/sky"
import { TabSwitcher, type TabId } from "@/components/tab-switcher"
import { Toaster } from "@/components/toaster"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useMe } from "@/lib/identity"
import { useOurDays } from "@/lib/store"
import { offsetBetween, partsIn, resolveSleep } from "@/lib/time"
import { DEFAULT_PROFILES, PEOPLE, other, type PersonId } from "@/lib/types"
import { useDailyIntro } from "@/lib/use-daily-intro"
import { useNow } from "@/lib/use-now"

const TAB_KEY = "our-days:tab"

type Store = ReturnType<typeof useOurDays>

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

  // The list and who's holding the phone live up here, above both tabs,
  // because the focus tab needs them too: its timer is mirrored onto this
  // person's profile so the other phone can see it and join in.
  const [dayOffset, setDayOffset] = useState(0)
  const [me, setMe] = useMe(DEFAULT_PROFILES)
  const store = useOurDays(dayOffset, me)
  const { setFocus, profiles, v3, status } = store

  // joining the other one's focus block: the timer is handed their end time
  const [join, setJoin] = useState<{ endsAt: number; minutes: number; key: number } | null>(null)
  const joinedFrom = useRef<PersonId | null>(null)

  const onSession = useCallback(
    (session: PomodoroSession) => {
      if (!v3) return
      if (!session) joinedFrom.current = null
      setFocus(session ? { ...session, startedBy: joinedFrom.current ?? me } : null)
    },
    [me, setFocus, v3]
  )

  // A block this person already has running — started before a reload, or on
  // their other device — is picked back up once, as soon as the list loads,
  // so the card and the timer never disagree about whether they're focusing.
  const resumed = useRef(false)
  useEffect(() => {
    if (resumed.current || status !== "ready" || !v3) return
    resumed.current = true
    const mine = profiles[me]
    if (mine.focus_mode !== "focus" || !mine.focus_ends_at) return
    const endsAt = Date.parse(mine.focus_ends_at)
    if (endsAt <= Date.now()) return
    joinedFrom.current = mine.started_by && mine.started_by !== me ? mine.started_by : null
    setJoin({ endsAt, minutes: mine.focus_duration ?? 25, key: Date.now() })
  }, [me, profiles, status, v3])

  const joinPartner = useCallback(() => {
    const them = profiles[other(me)]
    if (!them.focus_ends_at) return
    joinedFrom.current = them.started_by ?? them.id
    setJoin({
      endsAt: Date.parse(them.focus_ends_at),
      minutes: them.focus_duration ?? 25,
      key: Date.now(),
    })
  }, [me, profiles])

  return (
    <Tabs value={tab} onValueChange={openTab} className="gap-0">
      <TabSwitcher value={tab} hidden={tab === "focus" && !chrome} />

      {/* Both panels stay mounted: the timer has to keep counting while the
          list is up, and coming back to a block that had quietly reset itself
          would make the whole tab untrustworthy. Each one is told whether it
          is the one on screen, so only the visible tab puts a sky up — they
          are fixed, full-page layers, and there is only ever one sky. */}
      <TabsContent value="days" forceMount hidden={tab !== "days"}>
        <Days
          active={tab === "days"}
          store={store}
          dayOffset={dayOffset}
          setDayOffset={setDayOffset}
          me={me}
          setMe={setMe}
          onJoin={joinPartner}
        />
      </TabsContent>

      <TabsContent value="focus" forceMount hidden={tab !== "focus"}>
        <Pomodoro
          active={tab === "focus"}
          onChromeChange={setChrome}
          onSession={onSession}
          join={join}
        />
      </TabsContent>

      <Toaster />
    </Tabs>
  )
}

function Days({
  active,
  store,
  dayOffset,
  setDayOffset,
  me,
  setMe,
  onJoin,
}: {
  active: boolean
  store: Store
  dayOffset: number
  setDayOffset: (n: number) => void
  me: PersonId
  setMe: (id: PersonId) => void
  onJoin: () => void
}) {
  const now = useNow()
  const intro = useDailyIntro()

  const {
    profiles,
    columns,
    status,
    error,
    mode,
    v3,
    addTodo,
    patchTodo,
    toggleTodo,
    removeTodo,
    clearCompleted,
    saveProfile,
    setSleeping,
    leftovers,
    bringOver,
    reorder,
    toggleReaction,
    setNoteForPartner,
    ping,
  } = store

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

      <HelloHeader
        subtitle={subtitle}
        compact={!intro.full}
        onReplay={intro.replay}
      />

      <div className={intro.full ? "pt-4 pb-5" : "pt-2 pb-3"}>
        {/* The reset pill hangs off the right of the switcher rather than
            sitting in the row, so the switcher stays dead centre and doesn't
            jump sideways every time you leave today or come back to it. */}
        <div className="relative z-10 mx-auto w-fit">
          <DaySwitcher value={dayOffset} onChange={setDayOffset} />
          <AnimatePresence>
            {dayOffset !== 0 ? (
              <motion.button
                key="today"
                type="button"
                onClick={() => setDayOffset(0)}
                initial={{ opacity: 0, x: -6, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -6, scale: 0.94 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                whileTap={{ scale: 0.95 }}
                className="group/today absolute top-0 left-full inline-flex min-h-10 items-center pl-1 outline-none"
              >
                <span className="inline-flex h-6 items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2.5 text-xs font-medium whitespace-nowrap text-white/75 transition-colors group-hover/today:bg-white/[0.12] group-hover/today:text-foreground group-focus-visible/today:ring-2 group-focus-visible/today:ring-white/40">
                  <RotateCcw className="size-3" strokeWidth={2.2} />
                  today
                </span>
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <main className="relative z-10 grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6">
        {PEOPLE.map((id) => {
          const them = profiles[other(id)]
          const mine = id === me
          return (
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
              leftovers={leftovers[id].length}
              onBringOver={() => bringOver(id)}
              onReorder={reorder}
              viewer={me}
              v3={v3}
              onCheer={toggleReaction}
              note={them.note_for_partner}
              noteAuthor={them.name}
              onNoteChange={mine ? undefined : setNoteForPartner}
              onPing={mine ? undefined : ping}
              pingedAt={them.last_ping_at}
              otherProfile={them}
              onJoin={mine ? undefined : onJoin}
            />
          )
        })}
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
            <span className="text-fine whitespace-nowrap text-white/65 tnum">
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
        mode={mode}
        error={status === "error" ? error : null}
        me={me}
        profiles={profiles}
        onSwitchMe={() => setMe(other(me))}
        needsMigration={!v3 && mode === "cloud"}
      />
    </div>
  )
}
