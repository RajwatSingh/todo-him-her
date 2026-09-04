import { partsIn } from "@/lib/time"
import type { Profile } from "@/lib/types"

/**
 * The two clocks, drawn very faintly behind the page.
 *
 * Each dial is a 24-hour face — noon at the top, midnight at the bottom —
 * with a single hand at that person's real local hour. So the angle between
 * the two hands *is* the gap between them, and the place the two dials
 * overlap is the part of the day they actually share. It is the premise of
 * the whole app, stated in the background rather than in a sentence.
 */
export function TimeDials({
  a,
  b,
  now,
}: {
  a: Profile
  b: Profile
  now: Date
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <Dial
        profile={a}
        now={now}
        tone="var(--a-accent)"
        className="absolute top-[32%] left-1/2 w-[88vw] -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:left-[29%] md:w-[min(44rem,50vw)]"
      />
      <Dial
        profile={b}
        now={now}
        tone="var(--b-accent)"
        className="absolute top-[72%] left-1/2 w-[88vw] -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:left-[71%] md:w-[min(44rem,50vw)]"
      />
    </div>
  )
}

const CENTER = 100
const R_FACE = 96
const R_INNER = 76

/** A point on the dial: θ measured clockwise from the top, in degrees. */
function at(theta: number, r: number) {
  const rad = (theta * Math.PI) / 180
  return [CENTER + r * Math.sin(rad), CENTER - r * Math.cos(rad)] as const
}

/** Midnight points down, noon points up — so the hand also reads day vs night. */
function handAngle(hour: number, minute: number) {
  return ((hour + minute / 60) / 24) * 360 + 180
}

function Dial({
  profile,
  now,
  tone,
  className,
}: {
  profile: Profile
  now: Date
  tone: string
  className?: string
}) {
  const { hour, minute } = partsIn(profile.timezone, now)
  const angle = handAngle(hour, minute)
  const [hx, hy] = at(angle, R_FACE)

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      stroke={tone}
      strokeLinecap="round"
    >
      <circle cx={CENTER} cy={CENTER} r={R_FACE} strokeWidth={0.5} strokeOpacity={0.16} />
      <circle cx={CENTER} cy={CENTER} r={R_INNER} strokeWidth={0.4} strokeOpacity={0.08} />

      {/* one tick an hour; the quarters — midnight, six, noon, six — run longer */}
      {Array.from({ length: 24 }, (_, i) => {
        const theta = (i / 24) * 360 + 180
        const quarter = i % 6 === 0
        const [x1, y1] = at(theta, quarter ? R_INNER : R_FACE - 7)
        const [x2, y2] = at(theta, R_FACE)
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth={quarter ? 0.7 : 0.45}
            strokeOpacity={quarter ? 0.18 : 0.1}
          />
        )
      })}

      <g className="hidden md:block">
        <line
          x1={CENTER}
          y1={CENTER}
          x2={hx}
          y2={hy}
          strokeWidth={0.9}
          strokeOpacity={0.28}
        />
        <circle cx={hx} cy={hy} r={2.4} fill={tone} fillOpacity={0.45} stroke="none" />
        <circle cx={CENTER} cy={CENTER} r={1.6} fill={tone} fillOpacity={0.3} stroke="none" />
      </g>
    </svg>
  )
}
