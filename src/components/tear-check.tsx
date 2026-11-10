/**
 * A to-do row as a ticket: tear the stub off to tick the task.
 *
 * Adapted from KokonutUI's Tear Button (MIT, @dorianbaffier,
 * https://kokonutui.com/docs/buttons/tear-button). Drag the stub down/away to
 * tear it along the perforation; a quick tap or Enter/Space tears it for you.
 * Rows can be any height (notes grow them), so the tear works in percentages.
 */
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { Undo2 } from "lucide-react"

import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"

const STUB_WIDTH = 42
// How far (deg) the stub swings about the foot of the perforation before the
// last fibre gives.
const TEAR_ANGLE = 34
// The perforation tears hole by hole: each one holds, then gives.
const HOLES = 5
const HOLD = 0.55
const HOLD_SHARE = 0.3
const SWING_STIFFNESS = 900
const SWING_DAMPING = 42
const RETURN_STIFFNESS = 520
const RETURN_DAMPING = 22
const GRAVITY = 2400
const FALL_DISTANCE = 130
const STEP = 1 / 120
// Ragged edge of the tear, in px across the perforation.
const FIBRES = [1.3, 0.3, 1.8, 0.7, 1.4, 0.1, 1.9, 0.9, 0.4, 1.5, 1.1, 0.2]
const NOTCH = 5
const TAP_SLOP = 4
const TAP_TIME = 300

type Phase = "idle" | "tearing" | "flying" | "torn"

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

/** Raw pull (0..1) to how far the tear has run, holding at each hole. */
function stickSlip(pull: number) {
  const scaled = clamp(pull, 0, 1) * HOLES
  const hole = Math.min(Math.floor(scaled), HOLES - 1)
  const f = scaled - hole
  const given =
    f < HOLD
      ? (f / HOLD) * HOLD_SHARE
      : HOLD_SHARE + ((f - HOLD) / (1 - HOLD)) * (1 - HOLD_SHARE)
  return (hole + given) / HOLES
}

/**
 * One side of the tear as a clip-path: ragged from the top down to `frac`
 * (0..1 of the height), straight below. "body" is the ticket's right edge,
 * "stub" the stub's left edge.
 */
function tornEdge(frac: number, side: "body" | "stub") {
  const tip = frac * 100
  const edgeAt = (inset: number) =>
    side === "body" ? `calc(100% - ${inset.toFixed(1)}px)` : `${inset.toFixed(1)}px`
  const edge = side === "body" ? "100%" : "0%"
  const far = side === "body" ? "0%" : "100%"
  const points = [`${far} 0%`]
  const rows = Math.ceil(frac * FIBRES.length)
  for (let k = 0; k <= rows; k++) {
    const y = Math.min((k / FIBRES.length) * 100, tip)
    points.push(`${edgeAt(FIBRES[k % FIBRES.length])} ${y.toFixed(2)}%`)
  }
  points.push(`${edge} ${tip.toFixed(2)}%`, `${edge} 100%`, `${far} 100%`)
  return `polygon(${points.join(",")})`
}

const BODY_TORN = tornEdge(1, "body")

// Ticket notches where the perforation meets the top and bottom edges.
const notches = (x: "0" | "100%") =>
  `radial-gradient(circle at ${x} 0, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px) top / 100% 51% no-repeat, radial-gradient(circle at ${x} 100%, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px) bottom / 100% 51% no-repeat`
const bodyMask = notches("100%")
const stubMask = notches("0")

const mix = (tone: string, pct: number) =>
  `color-mix(in oklab, ${tone} ${pct}%, transparent)`

export function TearTicket({
  tone,
  label,
  completed,
  onTear,
  onUndo,
  children,
  className,
}: {
  /** Ink colour of the ticket. */
  tone: string
  /** Accessible name, e.g. the task's text. */
  label: string
  completed: boolean
  /** Called once the stub has come away. */
  onTear: () => void
  /** Called from the "not done yet" button on a torn ticket. */
  onUndo: () => void
  /** The ticket's body. */
  children: ReactNode
  className?: string
}) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [generation, setGeneration] = useState(0)
  const slotRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const stubRef = useRef<HTMLButtonElement>(null)
  const firedRef = useRef(-1)

  const sim = useRef({
    angle: 0,
    speed: 0,
    target: 0,
    held: false,
    grabAngle: 0,
    hole: 0,
    raf: 0,
    last: 0,
    carry: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    spin: 0,
    px: 0,
    py: 0,
    pt: 0,
    pvx: 0,
    pvy: 0,
    downX: 0,
    downY: 0,
    downT: 0,
    moved: false,
    auto: false,
    flying: false,
    reduceMotion: false,
  })

  const latest = useRef({ onTear, completed })
  latest.current = { onTear, completed }

  // The foot of the perforation, measured on the stub's slot (never rotates).
  const hinge = useCallback(() => {
    const rect = slotRef.current?.getBoundingClientRect()
    return rect ? { x: rect.left, y: rect.bottom } : { x: 0, y: 0 }
  }, [])

  const drawTear = useCallback(() => {
    const s = sim.current
    const frac = clamp(s.angle / TEAR_ANGLE, 0, 1)
    const torn = frac > 0.02
    if (bodyRef.current) {
      bodyRef.current.style.clipPath = torn ? tornEdge(frac, "body") : ""
    }
    const stub = stubRef.current
    if (stub) {
      stub.style.clipPath = torn ? tornEdge(frac, "stub") : ""
      stub.style.transform = `rotate(${s.angle.toFixed(2)}deg)`
    }
  }, [])

  const drawFlight = useCallback(() => {
    const s = sim.current
    const stub = stubRef.current
    if (!stub) return
    const fade = clamp(1 - (s.y - FALL_DISTANCE * 0.4) / (FALL_DISTANCE * 0.6), 0, 1)
    stub.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) rotate(${s.angle.toFixed(1)}deg)`
    stub.style.opacity = fade.toFixed(3)
  }, [])

  const detach = useCallback(() => {
    const s = sim.current
    s.held = false
    haptic(14)
    // The stub leaves with the swing it had, plus the hand's throw.
    const height = slotRef.current?.offsetHeight ?? 40
    const rad = (s.angle * Math.PI) / 180
    const tangential = ((s.speed * Math.PI) / 180) * height
    s.x = 0
    s.y = 0
    s.vx = Math.cos(rad) * tangential + clamp(s.pvx, -700, 700) * 0.5 + 60
    s.vy = Math.sin(rad) * tangential + clamp(s.pvy, -700, 700) * 0.5 - 140
    s.spin = s.speed * 0.6 + 150
    s.flying = true
    setPhase("flying")
  }, [])

  const stepSwing = useCallback(() => {
    const s = sim.current
    const firm = s.held || s.auto
    const stiffness = firm ? SWING_STIFFNESS : RETURN_STIFFNESS
    const damping = firm ? SWING_DAMPING : RETURN_DAMPING
    s.speed += ((s.target - s.angle) * stiffness - s.speed * damping) * STEP
    s.angle += s.speed * STEP
    // A tick for each hole that gives.
    const hole = Math.floor(clamp(s.angle / TEAR_ANGLE, 0, 1) * HOLES)
    if (hole > s.hole) haptic(3)
    s.hole = hole
    return s.angle >= TEAR_ANGLE * 0.995
  }, [])

  const stepFlight = useCallback(() => {
    const s = sim.current
    s.vy += GRAVITY * STEP
    s.x += s.vx * STEP
    s.y += s.vy * STEP
    s.angle += s.spin * STEP
    return s.y > FALL_DISTANCE
  }, [])

  const advance = useCallback(
    (elapsed: number) => {
      const s = sim.current
      s.carry += elapsed
      let finished = false
      while (s.carry >= STEP && !finished) {
        s.carry -= STEP
        if (s.flying) {
          finished = stepFlight()
        } else if (s.auto) {
          s.target = Math.min(s.target + STEP * 70, TEAR_ANGLE * 1.05)
          finished = stepSwing()
        } else {
          finished = stepSwing() && s.held
        }
      }
      return finished
    },
    [stepFlight, stepSwing]
  )

  const tick = useCallback(
    (now: number) => {
      const s = sim.current
      s.raf = 0
      const elapsed = s.last ? Math.min((now - s.last) / 1000, 0.05) : STEP
      s.last = now
      const { flying } = s
      const finished = advance(elapsed)

      if (flying) {
        drawFlight()
        if (finished) {
          s.last = 0
          setPhase("torn")
          return
        }
        s.raf = requestAnimationFrame(tick)
        return
      }

      drawTear()
      if (finished) {
        s.auto = false
        detach()
        s.raf = requestAnimationFrame(tick)
        return
      }
      const resting =
        !(s.held || s.auto) && Math.abs(s.angle) < 0.02 && Math.abs(s.speed) < 0.05
      if (!resting) {
        s.raf = requestAnimationFrame(tick)
        return
      }
      s.angle = 0
      s.speed = 0
      s.last = 0
      drawTear()
      setPhase("idle")
    },
    [advance, detach, drawFlight, drawTear]
  )

  const wake = useCallback(() => {
    const s = sim.current
    if (!s.raf) s.raf = requestAnimationFrame(tick)
  }, [tick])

  useEffect(() => {
    const s = sim.current
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    s.reduceMotion = query.matches
    const onChange = () => {
      s.reduceMotion = query.matches
    }
    query.addEventListener("change", onChange)
    return () => {
      query.removeEventListener("change", onChange)
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [])

  // Once the stub has fallen away, tick the task, then get a fresh stub ready
  // for if it's ever unticked.
  useEffect(() => {
    if (phase !== "torn") return
    // Once per tear, even if StrictMode runs this effect twice.
    if (firedRef.current !== generation) {
      firedRef.current = generation
      latest.current.onTear()
    }
    const id = window.setTimeout(() => {
      const s = sim.current
      Object.assign(s, { angle: 0, speed: 0, target: 0, hole: 0, flying: false })
      if (!latest.current.completed && bodyRef.current) {
        bodyRef.current.style.clipPath = ""
      }
      setGeneration((g) => g + 1)
      setPhase("idle")
    }, 800)
    return () => window.clearTimeout(id)
  }, [phase, generation])

  // In reduced motion the stub doesn't fall: it fades where it tore.
  useEffect(() => {
    if (phase !== "flying" || !sim.current.reduceMotion) return
    const s = sim.current
    cancelAnimationFrame(s.raf)
    s.raf = 0
    s.last = 0
    const stub = stubRef.current
    if (stub) {
      stub.style.transition = "opacity 160ms ease-out"
      stub.style.opacity = "0"
    }
    const id = window.setTimeout(() => setPhase("torn"), 160)
    return () => window.clearTimeout(id)
  }, [phase])

  const autoTear = () => {
    const s = sim.current
    s.auto = true
    s.target = Math.max(s.angle, 0)
    setPhase("tearing")
    wake()
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current
    if (phase === "flying" || phase === "torn" || s.auto) return
    if (event.pointerType === "mouse" && event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const h = hinge()
    s.grabAngle =
      (Math.atan2(event.clientY - h.y, event.clientX - h.x) * 180) / Math.PI - s.angle
    s.held = true
    s.moved = false
    s.px = s.downX = event.clientX
    s.py = s.downY = event.clientY
    s.pt = s.downT = event.timeStamp
    s.pvx = 0
    s.pvy = 0
    setPhase("tearing")
    wake()
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current
    if (!s.held) return
    if (Math.hypot(event.clientX - s.downX, event.clientY - s.downY) > TAP_SLOP) {
      s.moved = true
    }
    const dt = event.timeStamp - s.pt
    if (dt > 0) {
      s.pvx = s.pvx * 0.5 + ((event.clientX - s.px) / dt) * 500
      s.pvy = s.pvy * 0.5 + ((event.clientY - s.py) / dt) * 500
    }
    s.px = event.clientX
    s.py = event.clientY
    s.pt = event.timeStamp
    const h = hinge()
    const raw =
      (Math.atan2(event.clientY - h.y, event.clientX - h.x) * 180) / Math.PI -
      s.grabAngle
    // Pushing the stub back the wrong way only gives a little.
    const pull = raw < 0 ? raw * 0.15 : raw
    s.target =
      pull >= TEAR_ANGLE
        ? TEAR_ANGLE * 1.05
        : stickSlip(Math.max(pull, 0) / TEAR_ANGLE) * TEAR_ANGLE + Math.min(pull, 0)
    wake()
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current
    if (!s.held) return
    s.held = false
    // A quick tap tears it for you.
    if (!s.moved && event.timeStamp - s.downT < TAP_TIME && event.type === "pointerup") {
      autoTear()
      return
    }
    // Not torn through: the stub swings back and the perforation holds.
    s.target = 0
    wake()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    if (phase !== "idle" || event.repeat) return
    autoTear()
  }

  return (
    <div className={cn("relative flex items-stretch", className)}>
      {/* the ticket */}
      <div
        ref={bodyRef}
        className="relative min-w-0 flex-1 rounded-l-xl transition-[background-color] duration-200"
        style={{
          backgroundColor: mix(tone, completed ? 6 : 13),
          mask: bodyMask,
          WebkitMask: bodyMask,
          clipPath: completed ? BODY_TORN : undefined,
        }}
      >
        {children}
      </div>

      {/* the stub, or where it used to be */}
      <div ref={slotRef} className="relative shrink-0 select-none" style={{ width: STUB_WIDTH }}>
        {completed ? (
          phase === "idle" ? (
            <button
              type="button"
              title="not done yet"
              aria-label={`mark as not done: ${label}`}
              onClick={onUndo}
              className={cn(
                "absolute inset-0 grid place-items-center rounded-r-xl text-muted-foreground/50 outline-none transition-colors",
                "opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 max-sm:opacity-70",
                "hover:text-foreground focus-visible:text-foreground"
              )}
            >
              <Undo2 className="size-3.5" />
            </button>
          ) : null
        ) : phase === "torn" ? null : (
          <button
            key={generation}
            ref={stubRef}
            type="button"
            title="tear to tick off"
            aria-label={`tick off: ${label}`}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={handlePointerUp}
            className={cn(
              "absolute inset-0 grid touch-none place-items-center rounded-r-xl outline-none",
              "focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-inset",
              "transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] starting:-translate-x-2 starting:opacity-0",
              phase === "tearing" ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{
              backgroundColor: mix(tone, 26),
              color: tone,
              mask: stubMask,
              WebkitMask: stubMask,
              transformOrigin: "0 100%",
            }}
          >
            {/* the perforation */}
            <span
              aria-hidden="true"
              className="absolute inset-y-1.5 left-0 border-l-2 border-dotted"
              style={{ borderColor: mix(tone, 55) }}
            />
            <svg
              aria-hidden="true"
              className="ml-0.5 size-3.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
