import { motion } from "motion/react"

import { photoForDay } from "@/lib/photos"

/**
 * One picture, mounted like a print on the page: a small mat and a hairline
 * edge. It changes with the day switcher, so paging back shows the picture
 * that day had.
 *
 * There is deliberately no date under it. The picture is shared and keyed to
 * one neutral calendar, while each column shows its own owner's local date —
 * so for the hours those disagree, a caption here would contradict the dates
 * directly above it. The day switcher already says which day you are on.
 *
 * Renders nothing until there are photos in `src/assets/photos`.
 */
export function DayPhoto({ day, caption }: { day: string; caption: string }) {
  const src = photoForDay(day)
  if (!src) return null

  return (
    <div className="relative z-10 flex justify-center px-2 pb-8">
      <motion.figure
        key={src}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto w-fit max-w-full rounded-lg border border-border bg-card p-2 shadow-[0_1px_2px_rgba(20,26,38,0.05),0_14px_34px_-20px_rgba(20,26,38,0.35)]"
      >
        <img
          src={src}
          alt={`the picture for ${caption}`}
          loading="lazy"
          decoding="async"
          className="block max-h-[18rem] w-auto max-w-[30rem] rounded-[3px] object-contain"
        />
      </motion.figure>
    </div>
  )
}
