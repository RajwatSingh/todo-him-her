import { motion } from "motion/react"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"

export type TabId = "days" | "focus"

const TABS: { id: TabId; label: string }[] = [
  { id: "days", label: "days" },
  { id: "focus", label: "focus" },
]

/**
 * Two words at the top of the page.
 *
 * Built on the Radix tabs primitive rather than a pair of buttons, so the
 * arrow keys move between them and the panel below is announced as theirs —
 * then dressed back down to one quiet segmented control.
 *
 * The selected pill fills its half of the track edge to edge: no inset, no
 * gap, the two segments meeting on a single seam. That means the track
 * carries no padding of its own and the pill has to match its radius exactly,
 * or the corners part company where they overlap.
 */
export function TabSwitcher({
  value,
  hidden = false,
}: {
  value: TabId
  /** the focus tab clears its own furniture once the screen goes still */
  hidden?: boolean
}) {
  return (
    <motion.div
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? -10 : 0 }}
      transition={{ duration: 0.7 }}
      className={cn(
        "fixed top-4 left-1/2 z-50 -translate-x-1/2",
        hidden && "pointer-events-none"
      )}
    >
      {/* The primitive's own `line` variant sets a square corner and a fixed
          height through data-attribute rules, which outrank a plain utility —
          so the overrides have to be stated on the same variant to land. A
          track 1px taller than its pill is exactly what makes the pill look
          like it is floating inside a box rather than filling it. */}
      <TabsList
        variant="line"
        className={cn(
          "control gap-0 overflow-hidden p-0",
          "rounded-full data-[variant=line]:rounded-full",
          "h-auto group-data-[orientation=horizontal]/tabs:h-auto"
        )}
      >
        {TABS.map((tab) => {
          const active = tab.id === value
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              onClick={() => haptic(8)}
              className={cn(
                "relative h-auto min-w-[5.5rem] rounded-full px-5 py-[0.42rem]",
                "text-small font-medium",
                "after:hidden", // the pill is the marker, not the line rule
                "data-[state=active]:bg-transparent",
                active
                  ? "text-background data-[state=active]:text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="tab-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  className="absolute inset-0 rounded-full bg-foreground"
                />
              ) : null}
              <span className="relative z-10">{tab.label}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </motion.div>
  )
}
