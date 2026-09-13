import { useMemo } from "react"

import type { Phase } from "@/lib/pomodoro"

/**
 * The whole background of the focus tab, and the only place the timer's
 * progress is drawn: a session is a small day. Focus begins in the dark and
 * the light climbs to dawn as the minutes run out; a break sinks back down
 * and lets the stars return. The two lights are the same brass and teal the
 * columns use on the days tab.
 *
 * Everything is a fixed, pointer-transparent layer, so it can sit behind the
 * clock without ever catching a click.
 */

type Palette = {
  top: string
  mid: string
  base: string
  glow: string
  core: string
  aurora: [string, string]
}

const SKIES: Record<"warm" | "cool", Palette> = {
  // focus — a brass dawn
  warm: {
    top: "oklch(0.185 0.045 282)",
    mid: "oklch(0.245 0.055 300)",
    base: "oklch(0.215 0.06 34)",
    glow: "oklch(0.74 0.15 62)",
    core: "oklch(0.88 0.13 78)",
    aurora: ["oklch(0.52 0.14 36)", "oklch(0.42 0.11 296)"],
  },
  // break — teal moonlight
  cool: {
    top: "oklch(0.175 0.04 268)",
    mid: "oklch(0.225 0.05 238)",
    base: "oklch(0.215 0.045 208)",
    glow: "oklch(0.7 0.1 204)",
    core: "oklch(0.85 0.08 200)",
    aurora: ["oklch(0.48 0.1 196)", "oklch(0.38 0.09 272)"],
  },
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
      // crowd the upper sky, where the rising light won't wash them out
      top: Math.pow(rand(), 1.35) * 92,
      size: 0.8 + rand() * 1.7,
      delay: rand() * 6,
      duration: 3 + rand() * 4,
    }))
  }, [count])
}

export function FocusSky({
  phase,
  progress,
}: {
  phase: Phase
  /** 0 at the top of the phase, 1 when it's spent */
  progress: number
}) {
  const sky = phase === "focus" ? SKIES.warm : SKIES.cool
  const stars = useStars(110)

  // Focus runs towards first light; a break runs back down into the night.
  const light = phase === "focus" ? progress : 1 - progress
  const eased = light * light * (3 - 2 * light)

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, ${sky.top} 0%, ${sky.mid} 46%, ${sky.base} 100%)`,
        transition: "background 2.4s ease",
      }}
      aria-hidden
    >
      {/* two slow fields of colour, wide enough that no edge is ever visible */}
      <div
        className="absolute -inset-1/4 focus-drift-a"
        style={{
          background: `radial-gradient(45rem 34rem at 22% 34%, ${sky.aurora[0]}, transparent 62%)`,
          opacity: 0.34,
          filter: "blur(30px)",
          transition: "background 2.4s ease",
        }}
      />
      <div
        className="absolute -inset-1/4 focus-drift-b"
        style={{
          background: `radial-gradient(52rem 38rem at 78% 22%, ${sky.aurora[1]}, transparent 64%)`,
          opacity: 0.4,
          filter: "blur(34px)",
          transition: "background 2.4s ease",
        }}
      />

      {/* the stars give way as the light comes up */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.22 + (1 - eased) * 0.78,
          transition: "opacity 1.2s linear",
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
      </div>

      {/* first light: a broad band that climbs out of the bottom edge */}
      <div
        className="absolute inset-x-0 bottom-0 h-[78vh]"
        style={{
          background: `radial-gradient(130% 100% at 50% 100%, ${sky.glow} 0%, transparent 68%)`,
          opacity: 0.16 + eased * 0.66,
          transform: `translateY(${(1 - eased) * 34}%)`,
          transition:
            "opacity 1.2s linear, transform 1.2s linear, background 2.4s ease",
        }}
      />

      {/* and its hotter centre, just breaking the horizon */}
      <div
        className="absolute inset-x-0 bottom-0 h-[46vh]"
        style={{
          background: `radial-gradient(24rem 16rem at 50% 108%, ${sky.core} 0%, transparent 66%)`,
          opacity: eased * 0.55,
          transform: `translateY(${(1 - eased) * 26}%)`,
          transition:
            "opacity 1.2s linear, transform 1.2s linear, background 2.4s ease",
        }}
      />

      {/* the same paper grain as the days tab, so the two feel made of one
          material even though one of them is night */}
      <div className="absolute inset-0 opacity-[0.16] focus-grain" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 42%, oklch(0.12 0.03 280 / 62%) 100%)",
        }}
      />
    </div>
  )
}
