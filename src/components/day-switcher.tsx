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
    <div className="relative z-10 flex items-center justify-center gap-1 pb-1">
      <Arrow
        direction="left"
        label="previous day"
        onClick={() => onChange(value - 1)}
      />

      <div className="relative flex h-8 min-w-[7.5rem] items-center justify-center">
        <motion.button
          type="button"
          key={label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => onChange(0)}
          className={cn(
            "control rounded-full px-4 py-1.5 text-small font-medium",
            "text-foreground outline-none",
            "hover:text-foreground active:scale-[0.96] active:transition-transform",
            "focus-visible:ring-2 focus-visible:ring-white/50"
          )}
        >
          {label}
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
      className="control grid size-8 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-white/50"
    >
      <Icon className="size-4" strokeWidth={2} />
    </motion.button>
  )
}
