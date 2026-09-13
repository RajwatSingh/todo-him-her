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
 * then dressed back down to a single quiet pill, with the marker sliding
 * between the two rather than blinking from one to the other.
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
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? -8 : 0 }}
      transition={{ duration: 0.7 }}
      className={cn(
        "fixed top-4 left-1/2 z-50 -translate-x-1/2",
        hidden && "pointer-events-none"
      )}
    >
      <TabsList
        variant="line"
        className="h-auto gap-0.5 rounded-full bg-white/6 p-1 ring-1 ring-white/12 backdrop-blur-md"
      >
        {TABS.map((tab) => {
          const active = tab.id === value
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              onClick={() => haptic(8)}
              className={cn(
                "relative h-auto rounded-full px-4 py-1.5 text-[0.78rem] font-normal",
                "after:hidden", // the pill is the marker; the line variant's rule is not
                // the primitive sets its own active colour, so the override
                // has to be stated on the same variant to actually win
                "data-[state=active]:bg-transparent",
                active
                  ? "text-[oklch(0.2_0.045_285)] data-[state=active]:text-[oklch(0.2_0.045_285)]"
                  : "text-white/55 hover:text-white/85"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="tab-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-white/88"
                />
              ) : null}
              <span className="relative">{tab.label}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </motion.div>
  )
}
