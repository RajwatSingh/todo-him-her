import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

import type { Phase } from "@/lib/pomodoro"

/**
 * The sky both tabs stand under.
 *
 * It is the same night either way — the ground, the drift, the stars and the
 * grain never change when you switch tabs. What changes is the light in it:
 *
 *   variant="session"  one light, and a focus block is a small day. It begins
 *                      in the dark and the light climbs to a full dawn as the
 *                      minutes run out; a break sinks back down and lets the
 *                      stars return.
 *
 *   variant="day"      two lights, one for each of them, each sitting at the
 *                      real hour where that person is. Noon puts a light high
 *                      and bright; the middle of their night drops it below
 *                      the bottom edge. The gap between the two lights is the
 *                      gap between the two of them, drawn rather than stated.
 *
 * Everything here is a fixed, pointer-transparent layer, so it can sit behind
 * a page without ever catching a click.
 */

type Tone = "warm" | "cool"

export type SkyLight = {
  /** horizontal position across the sky, 0–1 */
  x: number
  /** -1 at the bottom of their night, +1 at their noon */
  elevation: number
  tone: Tone
}

type SkyProps =
  | { variant: "session"; phase: Phase; progress: number }
  | { variant: "day"; lights: SkyLight[] }

const TONES: Record<Tone, { glow: string; core: string; aurora: string }> = {
  warm: {
    glow: "oklch(0.74 0.15 62)",
    core: "oklch(0.88 0.13 78)",
    aurora: "oklch(0.52 0.14 36)",
  },
  cool: {
    glow: "oklch(0.7 0.1 204)",
    core: "oklch(0.85 0.08 200)",
    aurora: "oklch(0.48 0.1 196)",
  },
}

/* -------------------------------------------------------------------------
   the aurora ribbon
   Three paths with the same command structure, so the shape can be tweened
   between them instead of cross-faded. It is the one thing on the page that
   never stops moving.
------------------------------------------------------------------------- */

const RIBBONS = [
  "M-20 34 C 18 14, 48 52, 78 26 S 122 12, 150 32",
  "M-20 28 C 22 48, 52 16, 80 42 S 120 38, 150 22",
]

/**
 * One band of light across the upper sky.
 *
 * Drawn as a stroke rather than a filled region, so it stays a ribbon
 * instead of flooding everything under it — and moved by transform alone.
 * Morphing the path itself looked a little more alive, but it forces the
 * blur behind it to be re-rasterised on every single frame, and this is a
 * page meant to be left running for hours. Two ribbons drifting past each
 * other at different speeds read the same way and cost the compositor
 * almost nothing.
 */
function Aurora({
  path,
  color,
  width,
  className,
  opacity,
}: {
  path: string
  color: string
  width: number
  className: string
  opacity: number
}) {
  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      className={className}
      style={{ opacity, willChange: "transform" }}
    />
  )
}

/** A streak every half-minute or so, never two at once, never predictable. */
function ShootingStar() {
  const [shot, setShot] = useState<{
    id: number
    top: number
    left: number
    angle: number
    length: number
  } | null>(null)

  const timer = useRef(0)

  useEffect(() => {
    let id = 0
    const schedule = () => {
      timer.current = window.setTimeout(
        () => {
          id += 1
          setShot({
            id,
            top: 4 + Math.random() * 38,
            left: 8 + Math.random() * 64,
            angle: 18 + Math.random() * 16,
            length: 90 + Math.random() * 90,
          })
          schedule()
        },
        14_000 + Math.random() * 26_000
      )
    }
    schedule()
    return () => window.clearTimeout(timer.current)
  }, [])

  if (!shot) return null

  return (
    <motion.span
      key={shot.id}
      className="absolute h-px origin-left rounded-full"
      style={{
        top: `${shot.top}%`,
        left: `${shot.left}%`,
        width: shot.length,
        rotate: `${shot.angle}deg`,
        background:
          "linear-gradient(to right, transparent, rgb(255 255 255 / 0.85))",
      }}
      initial={{ opacity: 0, scaleX: 0, x: 0 }}
      animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1], x: [0, 170] }}
      transition={{ duration: 1.15, ease: "easeOut", times: [0, 0.35, 1] }}
    />
  )
}

function useStars(count: number) {
  return useMemo(() => {
    let h = 0x9e3779b9
    const rand = () => {
      h = (h * 1664525 + 1013904223) >>> 0
      return h / 0xffffffff
    }

    return Array.from({ length: count }, () => ({
      left: rand() * 100,
      // crowd the upper sky, where a light near the horizon won't wash them out
      top: Math.pow(rand(), 1.35) * 92,
      size: 0.8 + rand() * 1.7,
      delay: rand() * 6,
      duration: 3 + rand() * 4,
    }))
  }, [count])
}

/** smoothstep — keeps the light from snapping at either end of its travel */
const ease = (t: number) => {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

export function Sky(props: SkyProps) {
  const stars = useStars(110)
  const still = useReducedMotion()

  // What is in the sky, reduced to the same shape either way: a set of
  // lights, each with a place, a height and a temperature.
  const lights: SkyLight[] =
    props.variant === "session"
      ? [
          {
            x: 0.5,
            // focus runs towards first light; a break runs back into the night
            // never all the way down: even at the top of a block there is a
            // rumour of light on the horizon, or the screen is just black
            elevation:
              (props.phase === "focus"
                ? ease(props.progress)
                : ease(1 - props.progress)) *
                1.05 -
              0.55,
            tone: props.phase === "focus" ? "warm" : "cool",
          },
        ]
      : props.lights

  const warmth = lights.some((l) => l.tone === "warm")
  const coolth = lights.some((l) => l.tone === "cool")

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* the stars give way as any light comes up */}
      <div
        className="absolute inset-0"
        style={{
          opacity:
            0.3 +
            (1 - Math.max(0, ...lights.map((l) => ease((l.elevation + 1) / 2)))) *
              0.7,
          transition: "opacity 1.4s linear",
        }}
      >
        {stars.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}
        {still ? null : <ShootingStar />}
      </div>

      {/* the aurora — two ribbons at different speeds, heavily blurred, so
          what reads is a slow change of colour rather than a drawn shape */}
      <svg
        className="absolute inset-x-0 top-0 h-[68vh] w-full"
        viewBox="0 0 126 92"
        preserveAspectRatio="none"
        style={{
          filter: "blur(11px)",
          mixBlendMode: "screen",
          opacity: still ? 0.2 : 0.3,
        }}
      >
        <Aurora
          path={RIBBONS[0]}
          color={warmth ? TONES.warm.aurora : "oklch(0.4 0.1 300)"}
          width={13}
          className="sky-ribbon-a"
          opacity={0.5}
        />
        <Aurora
          path={RIBBONS[1]}
          color={coolth ? TONES.cool.aurora : "oklch(0.38 0.09 272)"}
          width={9}
          className="sky-ribbon-b"
          opacity={0.45}
        />
      </svg>

      {/* the lights themselves */}
      {lights.map((light, i) => {
        const tone = TONES[light.tone]
        const height = ease((light.elevation + 1) / 2)
        // 0 sits the light on the bottom edge; 1 lifts it into the sky
        const bottom = -22 + height * 52

        return (
          <div key={i} className="absolute inset-0">
            {/* wide and flat, so it lies along the horizon like light does
                rather than hanging in the sky like a lamp */}
            <div
              className="absolute h-[74vh] w-[104vw]"
              style={{
                left: `${light.x * 100}%`,
                bottom: 0,
                transform: `translate(-50%, ${50 - bottom}%)`,
                background: `radial-gradient(closest-side, ${tone.glow} 0%, transparent 74%)`,
                opacity: 0.18 + height * 0.58,
                transition: "opacity 1.4s linear, transform 1.4s linear",
                willChange: "transform, opacity",
              }}
            />
            <div
              className="absolute h-[26vh] w-[40vh]"
              style={{
                left: `${light.x * 100}%`,
                bottom: 0,
                transform: `translate(-50%, ${50 - bottom}%)`,
                background: `radial-gradient(closest-side, ${tone.core} 0%, transparent 68%)`,
                opacity: height * 0.56,
                transition: "opacity 1.4s linear, transform 1.4s linear",
                willChange: "transform, opacity",
              }}
            />
          </div>
        )
      })}

      {/* grain, then a vignette to hold the edges down */}
      <div className="absolute inset-0 opacity-[0.14] focus-grain" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 92% at 50% 46%, transparent 40%, oklch(0.12 0.03 288 / 66%) 100%)",
        }}
      />
    </div>
  )
}

/** Where a person's light sits, from the hour on their own clock. */
export function lightFor(hour: number, minute: number, x: number, tone: Tone): SkyLight {
  const turn = ((hour + minute / 60) / 24) * Math.PI * 2
  return { x, elevation: -Math.cos(turn), tone }
}
