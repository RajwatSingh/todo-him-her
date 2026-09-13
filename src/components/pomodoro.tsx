import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Minus, Pause, Play, Plus, RotateCcw, SkipForward } from "lucide-react"

import { FocusSky } from "@/components/focus-sky"
import {
  formatClock,
  LIMITS,
  PHASE_LABEL,
  SET_LENGTH,
  usePomodoro,
  type FocusSettings,
} from "@/lib/pomodoro"
import { cn } from "@/lib/utils"

/** True once nothing has been touched for `delay` — used to clear the screen. */
function useIdle(delay: number, enabled: boolean) {
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setIdle(false)
      return
    }

    let timer = 0
    const wake = () => {
      setIdle(false)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setIdle(true), delay)
    }

    wake()
    const events = ["pointermove", "pointerdown", "keydown", "wheel"] as const
    for (const event of events) window.addEventListener(event, wake)
    return () => {
      window.clearTimeout(timer)
      for (const event of events) window.removeEventListener(event, wake)
    }
  }, [delay, enabled])

  return idle
}

export function Pomodoro({
  onChromeChange,
}: {
  /** lets the page dim its own furniture while the screen clears */
  onChromeChange?: (visible: boolean) => void
}) {
  const {
    settings,
    update,
    phase,
    running,
    remaining,
    progress,
    inSet,
    finished,
    toggle,
    reset,
    skip,
  } = usePomodoro()

  const [adjusting, setAdjusting] = useState(false)
  const idle = useIdle(5000, running && !adjusting)
  const chrome = !idle

  useEffect(() => {
    onChromeChange?.(chrome)
  }, [chrome, onChromeChange])

  const clock = formatClock(remaining)

  // The tab title is the only part of this that's visible from another window.
  useEffect(() => {
    const original = document.title
    document.title = running
      ? `${clock} · ${PHASE_LABEL[phase]}`
      : "our days"
    return () => {
      document.title = original
    }
  }, [clock, phase, running])

  // Space starts and stops, the way every other timer does.
  const toggleRef = useRef(toggle)
  toggleRef.current = toggle
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, button, [contenteditable]")) return
      event.preventDefault()
      toggleRef.current()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const started = progress > 0.0001
  const action = running ? "pause" : started ? "resume" : "start"

  return (
    <div className="relative">
      <FocusSky phase={phase} progress={progress} />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-20">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="font-display text-[0.95rem] font-light tracking-[0.08em] text-white/75 italic"
          // the sky behind this line runs from near-black to full dawn, so it
          // carries its own shadow rather than relying on the backdrop
          style={{ textShadow: "0 1px 12px oklch(0.16 0.04 285 / 65%)" }}
        >
          {PHASE_LABEL[phase]}
        </motion.p>

        <p
          className="font-display mt-1 leading-[0.95] font-extralight text-white/92"
          style={{
            fontSize: "clamp(4.75rem, 19vw, 11.5rem)",
            fontFeatureSettings: '"tnum" 1, "lnum" 1',
            letterSpacing: "-0.02em",
            textShadow:
              phase === "focus"
                ? "0 0 70px oklch(0.8 0.13 70 / 28%)"
                : "0 0 70px oklch(0.78 0.09 205 / 26%)",
          }}
        >
          {clock}
        </p>

        {/* four dots, one per focus block before the long break */}
        <div className="mt-7 flex items-center gap-2.5">
          {Array.from({ length: SET_LENGTH }, (_, i) => (
            <span
              key={i}
              className={cn(
                "size-1.5 rounded-full transition-all duration-700",
                i < inSet ? "bg-white/80" : "bg-white/20"
              )}
              style={
                i === inSet && phase === "focus"
                  ? { boxShadow: "0 0 0 3px rgb(255 255 255 / 0.09)" }
                  : undefined
              }
            />
          ))}
        </div>

        <motion.div
          animate={{ opacity: chrome ? 1 : 0 }}
          transition={{ duration: 0.9 }}
          className={cn("w-full", !chrome && "pointer-events-none")}
        >
          <div className="mt-9 flex items-center justify-center gap-2">
            <Quiet onClick={reset} label="reset this block">
              <RotateCcw className="size-[15px]" strokeWidth={1.6} />
            </Quiet>

            <button
              type="button"
              onClick={toggle}
              className={cn(
                "inline-flex h-11 min-w-[7.5rem] items-center justify-center gap-2.5",
                "rounded-full px-6 text-[0.85rem] tracking-wide text-white/90",
                "bg-white/8 ring-1 ring-white/20 backdrop-blur-md",
                "transition-colors outline-none hover:bg-white/14",
                "focus-visible:ring-2 focus-visible:ring-white/60"
              )}
            >
              {running ? (
                <Pause className="size-[15px]" strokeWidth={1.6} />
              ) : (
                <Play className="size-[15px]" strokeWidth={1.6} />
              )}
              {action}
            </button>

            <Quiet onClick={skip} label={`skip to the next block`}>
              <SkipForward className="size-[15px]" strokeWidth={1.6} />
            </Quiet>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setAdjusting((open) => !open)}
              aria-expanded={adjusting}
              className="font-display rounded-md px-3 py-1 text-[0.82rem] text-white/55 italic transition-colors outline-none hover:text-white/90 focus-visible:ring-2 focus-visible:ring-white/50"
            >
              {adjusting ? "done" : "adjust the lengths"}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {adjusting ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <Settings settings={settings} onChange={update} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {finished > 0 ? (
            <p className="mt-8 text-center text-[0.72rem] text-white/45">
              {finished === 1
                ? "one block done today"
                : `${finished} blocks done today`}
            </p>
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}

function Quiet({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full text-white/40 transition-colors outline-none hover:bg-white/8 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/50"
    >
      {children}
    </button>
  )
}

const ROWS: { key: "focus" | "short" | "long"; label: string }[] = [
  { key: "focus", label: "focus" },
  { key: "short", label: "short break" },
  { key: "long", label: "long break" },
]

function Settings({
  settings,
  onChange,
}: {
  settings: FocusSettings
  onChange: (patch: Partial<FocusSettings>) => void
}) {
  return (
    <div className="mx-auto mt-4 w-full max-w-sm rounded-2xl bg-white/6 p-4 ring-1 ring-white/12 backdrop-blur-md">
      {ROWS.map(({ key, label }, i) => (
        <div
          key={key}
          className={cn(
            "flex items-center justify-between gap-4 py-2.5",
            i > 0 && "border-t border-white/10"
          )}
        >
          <span className="text-[0.82rem] text-white/65">{label}</span>
          <Stepper
            value={settings[key]}
            min={LIMITS[key][0]}
            max={LIMITS[key][1]}
            label={label}
            onChange={(value) => onChange({ [key]: value })}
          />
        </div>
      ))}

      <label className="mt-1 flex cursor-pointer items-center justify-between gap-4 border-t border-white/10 pt-3.5">
        <span className="text-[0.82rem] text-white/65">
          keep going
          <span className="mt-0.5 block text-[0.7rem] text-white/35">
            start the next block on its own
          </span>
        </span>
        <input
          type="checkbox"
          checked={settings.autoContinue}
          onChange={(e) => onChange({ autoContinue: e.target.checked })}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "relative h-[22px] w-10 shrink-0 rounded-full ring-1 transition-colors",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-white/70",
            settings.autoContinue
              ? "bg-white/70 ring-white/40"
              : "bg-white/10 ring-white/20"
          )}
        >
          <span
            className={cn(
              "absolute top-[3px] size-4 rounded-full transition-all duration-300",
              settings.autoContinue
                ? "left-[21px] bg-[oklch(0.22_0.05_285)]"
                : "left-[3px] bg-white/60"
            )}
          />
        </span>
      </label>
    </div>
  )
}

function Stepper({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number
  min: number
  max: number
  label: string
  onChange: (next: number) => void
}) {
  const step = (delta: number) =>
    onChange(Math.min(max, Math.max(min, value + delta)))

  return (
    <div className="flex items-center gap-1">
      <StepButton
        onClick={() => step(-1)}
        disabled={value <= min}
        label={`one minute less of ${label}`}
      >
        <Minus className="size-3.5" strokeWidth={1.8} />
      </StepButton>

      <span
        className="font-display w-[3.6rem] text-center text-[1.05rem] font-light text-white/90"
        style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
      >
        {value}
        <span className="ml-1 text-[0.68rem] text-white/40">min</span>
      </span>

      <StepButton
        onClick={() => step(1)}
        disabled={value >= max}
        label={`one minute more of ${label}`}
      >
        <Plus className="size-3.5" strokeWidth={1.8} />
      </StepButton>
    </div>
  )
}

function StepButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-7 place-items-center rounded-full text-white/55 transition-colors outline-none hover:bg-white/12 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-25"
    >
      {children}
    </button>
  )
}
