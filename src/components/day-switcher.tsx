import { motion } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const LABELS: Record<number, string> = {
  [-1]: "yesterday",
  0: "today",
  1: "tomorrow",
}

/**
 * Shifts both columns by a whole day — but "tomorrow" resolves against each
 * person's own calendar, so it means tomorrow in Pune *and* tomorrow in
 * Gettysburg even though those start 9.5 hours apart.
 */
export function DaySwitcher({
  value,
  onChange,
}: {
  value: number
  onChange: (next: number) => void
}) {
  const label = LABELS[value] ?? `${value > 0 ? "+" : ""}${value} days`

  return (
    // Every control here is a 40px hit area around a smaller visible shape:
    // the pills keep their look, a thumb just can't miss them.
    <div className="relative z-10 flex items-center justify-center pb-1">
      <Arrow
        direction="left"
        label="previous day"
        onClick={() => onChange(value - 1)}
      />

      <div className="relative flex min-h-10 min-w-[7.5rem] items-center justify-center">
        <motion.button
          type="button"
          key={label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => onChange(0)}
          className="group/day inline-flex min-h-10 items-center px-0.5 outline-none"
        >
          <span
            className={cn(
              "control rounded-full px-4 py-1.5 text-small font-medium text-foreground",
              "group-active/day:scale-[0.96] group-active/day:transition-transform",
              "group-focus-visible/day:ring-2 group-focus-visible/day:ring-white/50"
            )}
          >
            {label}
          </span>
        </motion.button>
      </div>

      <Arrow
        direction="right"
        label="next day"
        onClick={() => onChange(value + 1)}
      />
    </div>
  )
}

function Arrow({
  direction,
  label,
  onClick,
}: {
  direction: "left" | "right"
  label: string
  onClick: () => void
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className="group/arrow grid size-10 place-items-center outline-none"
    >
      <span className="control grid size-8 place-items-center rounded-full text-muted-foreground group-hover/arrow:text-foreground group-focus-visible/arrow:ring-2 group-focus-visible/arrow:ring-white/50">
        <Icon className="size-4" strokeWidth={2} />
      </span>
    </motion.button>
  )
}
