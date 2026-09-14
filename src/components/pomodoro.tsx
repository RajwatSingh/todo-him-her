import { memo, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  ChevronDown,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  SlidersHorizontal,
} from "lucide-react"

import { ElasticSlider } from "@/components/elastic-slider"
import { Figures } from "@/components/figures"
import { Sky } from "@/components/sky"
import { TextFlip } from "@/components/text-flip"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { haptic } from "@/lib/haptic"
import {
  formatClock,
  LIMITS,
  PHASE_LABEL,
  SET_LENGTH,
  usePomodoro,
  type FocusSettings,
} from "@/lib/pomodoro"
import { dealQuotes } from "@/lib/quote"
import { cn } from "@/lib/utils"

/** how long a quote stays up before the next one turns over */
const QUOTE_MINUTES = 3

/** vibration lengths, in ms — a nudge for a small action, a thud for a big one */
const TAP = 8
const THUD = 18

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
  active,
  onChromeChange,
}: {
  /** whether this is the tab on screen — the timer runs either way */
  active: boolean
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
  const idle = useIdle(5000, active && running && !adjusting)
  const chrome = !idle

  useEffect(() => {
    onChromeChange?.(chrome)
  }, [chrome, onChromeChange])

  const clock = formatClock(remaining)

  // The tab title is the only part of this that's visible from another window.
  useEffect(() => {
    const original = document.title
    document.title = running ? `${clock} · ${PHASE_LABEL[phase]}` : "our days"
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
    <TooltipProvider delayDuration={350}>
      <div className="relative">
        {active ? (
          <Sky variant="session" phase={phase} progress={progress} />
        ) : null}

        <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-20">
          <FocusQuote />

          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="font-display mt-10 text-lead text-muted-foreground italic"
            // the sky behind this line runs from near-black to full dawn, so it
            // carries its own shadow rather than leaning on what is behind it
            style={{ textShadow: "0 1px 12px oklch(0.16 0.04 285 / 65%)" }}
          >
            {PHASE_LABEL[phase]}
          </motion.p>

          <p
            className="font-display font-display-xl mt-2 leading-[0.9] text-white"
            style={{
              fontSize: "clamp(4.5rem, 19vw, var(--t-clock))",
              // Fraunces' optical-size axis is already wound right up by
              // `font-display-xl`, which is where the hairline-to-stem
              // contrast comes from; the weight only has to stay out of it.
              fontWeight: 300,
              textShadow:
                phase === "focus"
                  ? "0 0 90px oklch(0.8 0.13 70 / 34%)"
                  : "0 0 90px oklch(0.78 0.09 205 / 30%)",
            }}
          >
            <Figures>{clock}</Figures>
          </p>

          {/* four dots, one per focus block before the long break */}
          <div className="mt-7 flex items-center gap-2.5">
            {Array.from({ length: SET_LENGTH }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-all duration-700",
                  i < inSet ? "bg-white/80" : "bg-white/20",
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
              <Quiet
                onClick={() => {
                  haptic(TAP)
                  reset()
                }}
                label="reset this block"
              >
                <RotateCcw className="size-[15px]" strokeWidth={1.6} />
              </Quiet>

              <button
                type="button"
                onClick={() => {
                  haptic(THUD)
                  toggle()
                }}
                className={cn(
                  "control inline-flex h-12 min-w-[8.5rem] items-center justify-center gap-2.5",
                  "rounded-full px-7 text-small font-medium text-foreground",
                  "outline-none active:scale-[0.97] active:transition-transform",
                  "focus-visible:ring-2 focus-visible:ring-white/60",
                )}
              >
                {running ? (
                  <Pause className="size-[15px]" strokeWidth={1.6} />
                ) : (
                  <Play className="size-[15px]" strokeWidth={1.6} />
                )}
                {action}
              </button>

              <Quiet
                onClick={() => {
                  haptic(TAP)
                  skip()
                }}
                label="skip to the next block"
              >
                <SkipForward className="size-[15px]" strokeWidth={1.6} />
              </Quiet>
            </div>

            <div className="mt-6 flex justify-center">
              {/* This was a line of italic text and read as a caption, so
                  nobody could tell it did anything. It is a control, so it
                  looks like one: the same shape as the other controls, an
                  icon that says what it adjusts, and a chevron that turns
                  over to show the panel is open. */}
              <button
                type="button"
                onClick={() => {
                  haptic(TAP)
                  setAdjusting((open) => !open)
                }}
                aria-expanded={adjusting}
                className={cn(
                  "control inline-flex items-center gap-2 rounded-full py-2 pr-3 pl-3.5",
                  "text-small font-medium text-foreground",
                  "outline-none active:scale-[0.97]",
                  "active:transition-transform focus-visible:ring-2 focus-visible:ring-white/60",
                )}
              >
                <SlidersHorizontal className="size-[14px]" strokeWidth={2} />
                {adjusting ? "done" : "adjust the lengths"}
                <ChevronDown
                  className={cn(
                    "size-[14px] transition-transform duration-300",
                    adjusting && "rotate-180",
                  )}
                  strokeWidth={2}
                />
              </button>
            </div>

            {/* Opened by collapsing a grid row rather than by animating a
              measured height: the sliders inside settle after their own first
              layout pass, and a height measured before that leaves the panel
              permanently short of its last line. */}
            <AnimatePresence initial={false}>
              {adjusting ? (
                <motion.div
                  initial={{ gridTemplateRows: "0fr", opacity: 0 }}
                  animate={{ gridTemplateRows: "1fr", opacity: 1 }}
                  exit={{ gridTemplateRows: "0fr", opacity: 0 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="grid overflow-hidden"
                >
                  <div className="min-h-0">
                    <Settings settings={settings} onChange={update} />
                  </div>
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
    </TooltipProvider>
  )
}

/**
 * A line to look at while the minutes go by, turned over every few minutes.
 *
 * The hand is dealt once per mount, so a re-render never shuffles the words
 * out from under whoever is reading them, and the whole thing is memoised so
 * the clock ticking four times a second doesn't rebuild a deck of quotes
 * behind it for hours on end. The height is held, so the clock underneath
 * cannot move when a one-line quote gives way to a three-line one.
 */
const FocusQuote = memo(function FocusQuote() {
  const [deck] = useState(() => dealQuotes())

  return (
    <div className="flex min-h-[7rem] w-full max-w-[32rem] items-end justify-center">
      <TextFlip
        interval={QUOTE_MINUTES * 60}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        variants={{
          initial: { opacity: 0, y: 14, filter: "blur(6px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          exit: {
            opacity: 0,
            y: -14,
            filter: "blur(6px)",
            transition: { duration: 0.8, ease: "easeIn" },
          },
        }}
        className="w-full text-center"
      >
        {deck.map((quote) => (
          <span key={quote.text} className="block">
            <span
              className="font-display block text-lead leading-[1.55] text-balance text-foreground/85"
              style={{ textShadow: "0 1px 14px oklch(0.16 0.04 285 / 60%)" }}
            >
              {quote.text}
            </span>
            <span className="mt-3 block text-fine text-muted-foreground">
              {quote.author}
            </span>
          </span>
        ))}
      </TextFlip>
    </div>
  )
})

/**
 * One of the two small controls either side of start. They are icons alone,
 * so each carries a real tooltip rather than a `title` — which never shows
 * on touch, waits a second on a mouse, and cannot be styled to match the
 * rest of the night.
 */
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
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="control grid size-11 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground active:scale-[0.94] active:transition-transform focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Each row's track fills with the light that block will actually put in the
 * sky, so the panel reads as the two phases rather than as three identical
 * rows. The classes are spelled out rather than built from a variable
 * because Tailwind finds them by scanning this file for literal text.
 */
const WARM_FILL =
  "[--elastic-slider-fill:var(--a-accent)]/22 [--elastic-slider-fill-active:var(--a-accent)]/36"
const COOL_FILL =
  "[--elastic-slider-fill:var(--b-accent)]/22 [--elastic-slider-fill-active:var(--b-accent)]/36"

const ROWS: { key: "focus" | "short" | "long"; label: string; fill: string }[] =
  [
    { key: "focus", label: "focus", fill: WARM_FILL },
    { key: "short", label: "short break", fill: COOL_FILL },
    { key: "long", label: "long break", fill: COOL_FILL },
  ]

function Settings({
  settings,
  onChange,
}: {
  settings: FocusSettings
  onChange: (patch: Partial<FocusSettings>) => void
}) {
  return (
    <div className="mx-auto mt-5 w-full max-w-sm border-t border-white/12 pt-4">
      {ROWS.map(({ key, label, fill }) => (
        <ElasticSlider
          key={key}
          label={label}
          value={settings[key]}
          onValueChange={(value) => onChange({ [key]: Math.round(value) })}
          min={LIMITS[key][0]}
          max={LIMITS[key][1]}
          step={1}
          formatValue={(value) => `${Math.round(value)} min`}
          className={cn(
            "mb-1 [--elastic-slider-height:--spacing(10)]",
            "[--elastic-slider-bg:oklch(1_0_0/0.07)]",
            "[--elastic-slider-hash:oklch(1_0_0/0.22)]",
            "[--elastic-slider-handle:oklch(1_0_0/0.9)]",
            "[--elastic-slider-label:oklch(1_0_0/0.62)]",
            "[--elastic-slider-focus:oklch(1_0_0/0.95)]",
            fill,
            // the value is a measurement, not code — no mono face for it
            "[&_[data-slot=elastic-slider-value]]:font-sans",
            "[&_[data-slot=elastic-slider-value]]:tnum",
          )}
        />
      ))}

      <label className="mt-2 flex cursor-pointer items-center justify-between gap-4 border-t border-white/10 px-2 pt-3.5 pb-1.5">
        <span className="text-[0.84rem] font-medium tracking-[-0.01em] text-white/85">
          keep going
          <span className="mt-0.5 block text-[0.72rem] font-normal text-white/45">
            start the next block on its own
          </span>
        </span>
        <Switch
          checked={settings.autoContinue}
          onCheckedChange={(checked) => {
            haptic(TAP)
            onChange({ autoContinue: checked })
          }}
          aria-label="start the next block on its own"
        />
      </label>
    </div>
  )
}
