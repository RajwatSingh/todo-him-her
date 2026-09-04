import { useMemo } from "react"
import { motion } from "motion/react"

/**
 * The little starfield that drifts across a column while its person is
 * asleep. Star positions are seeded off the person id so they stay put
 * between renders instead of jittering every tick.
 */
export function NightSky({ seed, className }: { seed: string; className?: string }) {
  const stars = useMemo(() => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0

    const rand = () => {
      h = (h * 1664525 + 1013904223) >>> 0
      return h / 0xffffffff
    }

    return Array.from({ length: 26 }, () => ({
      left: rand() * 100,
      top: rand() * 100,
      size: 1 + rand() * 1.8,
      delay: rand() * 3.5,
      duration: 2.2 + rand() * 2.5,
    }))
  }, [seed])

  return (
    <div className={className} aria-hidden>
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

      {/* A diffuse moonglow rather than a drawn moon: it reads as moonlight
          from any angle and can never collide with the clock or the stats. */}
      <motion.div
        className="absolute -top-10 -right-8 size-36 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,246,224,0.30) 0%, rgba(255,240,205,0.13) 42%, transparent 70%)",
        }}
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
