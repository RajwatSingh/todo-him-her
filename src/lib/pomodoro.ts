import { useCallback, useEffect, useRef, useState } from "react"

/**
 * The focus timer. Everything here runs off a wall-clock `endsAt` rather than
 * a decrementing counter, so a session that spends twenty minutes in a
 * background tab — where browsers throttle timers hard — still ends on time.
 */

export type Phase = "focus" | "short" | "long"

export type FocusSettings = {
  /** minutes */
  focus: number
  short: number
  long: number
  /** roll straight into the next phase instead of waiting for a tap */
  autoContinue: boolean
}

export const DEFAULT_SETTINGS: FocusSettings = {
  focus: 25,
  short: 5,
  long: 15,
  autoContinue: true,
}

/** focus blocks between long breaks — also the number of dots on screen */
export const SET_LENGTH = 4

export const LIMITS: Record<"focus" | "short" | "long", [number, number]> = {
  focus: [5, 90],
  short: [1, 30],
  long: [5, 60],
}

export const PHASE_LABEL: Record<Phase, string> = {
  focus: "focus",
  short: "break",
  long: "long break",
}

const STORAGE_KEY = "our-days:focus"

function loadSettings(): FocusSettings {
  if (typeof localStorage === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const saved = JSON.parse(raw) as Partial<FocusSettings>
    const clamp = (key: "focus" | "short" | "long") => {
      const [min, max] = LIMITS[key]
      const value = Math.round(Number(saved[key]))
      return Number.isFinite(value)
        ? Math.min(max, Math.max(min, value))
        : DEFAULT_SETTINGS[key]
    }
    return {
      focus: clamp("focus"),
      short: clamp("short"),
      long: clamp("long"),
      autoContinue: saved.autoContinue ?? DEFAULT_SETTINGS.autoContinue,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** minutes -> ms */
const ms = (minutes: number) => minutes * 60_000

export function formatClock(remainingMs: number) {
  const total = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

/**
 * A short, soft two-note chime, synthesised rather than fetched so the page
 * still has nothing to download. Rings a fifth up when a break ends and a
 * fifth down when focus does, so you can tell which happened without looking.
 */
function chime(direction: "up" | "down") {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) return

    const ctx = new Ctx()
    const notes = direction === "up" ? [523.25, 783.99] : [783.99, 523.25]

    notes.forEach((freq, i) => {
      const at = ctx.currentTime + i * 0.22
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(0.12, at + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.6)
      osc.connect(gain).connect(ctx.destination)
      osc.start(at)
      osc.stop(at + 1.7)
    })

    setTimeout(() => void ctx.close(), 2600)
  } catch {
    // an audio device we can't have is not worth breaking the timer over
  }
}

export function usePomodoro() {
  const [settings, setSettings] = useState<FocusSettings>(loadSettings)
  const [phase, setPhase] = useState<Phase>("focus")
  const [running, setRunning] = useState(false)
  /** focus blocks finished in the current set of four */
  const [inSet, setInSet] = useState(0)
  /** focus blocks finished since the page was opened */
  const [finished, setFinished] = useState(0)

  const durationMs = ms(settings[phase])

  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(durationMs)

  // Keep an idle clock in step with its own setting: nudging "focus" from 25
  // to 30 between blocks should show 30:00, not a stale 25:00. It watches the
  // length rather than `running`, so pausing leaves the remaining time alone
  // instead of winding the block back to the top.
  const lengthRef = useRef(durationMs)
  useEffect(() => {
    if (lengthRef.current === durationMs) return
    lengthRef.current = durationMs
    // A block that's actually counting down keeps the length it began
    // with; anything else takes the new one straight away.
    if (!running) setRemaining(durationMs)
  }, [durationMs, running])

  const settingsRef = useRef(settings)
  settingsRef.current = settings

  /** Move to the next phase; `start` decides whether it runs straight away. */
  const goTo = useCallback((next: Phase, start: boolean) => {
    const length = ms(settingsRef.current[next])
    setPhase(next)
    setRemaining(length)
    setRunning(start)
    setEndsAt(start ? Date.now() + length : null)
  }, [])

  const complete = useCallback(() => {
    if (phase === "focus") {
      const nextInSet = inSet + 1
      const done = nextInSet >= SET_LENGTH
      setInSet(done ? 0 : nextInSet)
      setFinished((n) => n + 1)
      chime("down")
      goTo(done ? "long" : "short", settingsRef.current.autoContinue)
    } else {
      chime("up")
      goTo("focus", settingsRef.current.autoContinue)
    }
  }, [goTo, inSet, phase])

  const completeRef = useRef(complete)
  completeRef.current = complete

  useEffect(() => {
    if (!running || endsAt === null) return

    // One expiry, one hand-over. Without this latch a tick that fires in the
    // gap between `complete()` and the re-render still sees the spent
    // `endsAt` and hands over a second time, which skips a phase and leaves
    // the clock stopped on a block nobody asked to stop.
    let spent = false
    let id = 0

    const tick = () => {
      if (spent) return
      const left = endsAt - Date.now()
      if (left > 0) {
        setRemaining(left)
        return
      }
      spent = true
      window.clearInterval(id)
      setRemaining(0)
      completeRef.current()
    }

    tick()
    id = window.setInterval(tick, 250)

    // Browsers throttle timers hard in a background tab, so catch up the
    // moment the tab is looked at again rather than waiting for the next one.
    const onVisible = () => {
      if (document.visibilityState === "visible") tick()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [endsAt, running])

  const toggle = useCallback(() => {
    setRunning((was) => {
      if (was) {
        setEndsAt(null)
        return false
      }
      setEndsAt(Date.now() + remaining)
      return true
    })
  }, [remaining])

  const reset = useCallback(() => {
    goTo(phase, false)
  }, [goTo, phase])

  /** Give up on the current phase and hand over to the next one. */
  const skip = useCallback(() => {
    if (phase === "focus") {
      const nextInSet = inSet + 1
      const done = nextInSet >= SET_LENGTH
      setInSet(done ? 0 : nextInSet)
      goTo(done ? "long" : "short", false)
    } else {
      goTo("focus", false)
    }
  }, [goTo, inSet, phase])

  const update = useCallback((patch: Partial<FocusSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // private mode; the timer works, it just won't remember
      }
      return next
    })
  }, [])

  return {
    settings,
    update,
    phase,
    running,
    remaining,
    /** 0 at the top of the phase, 1 when it's spent */
    progress: durationMs > 0 ? 1 - remaining / durationMs : 0,
    inSet,
    finished,
    toggle,
    reset,
    skip,
  }
}
