import { useEffect, useState } from "react"
import { motion } from "motion/react"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"

export type TabId = "days" | "focus"

/**
 * Whether the page has been scrolled at all.
 *
 * The switcher is fixed, so once the list is long enough to scroll, tasks
 * pass behind it with nothing between the two. Rather than dim the top of
 * the sky permanently, the band that separates them only appears once there
 * is something to separate.
 */
function useScrolled(threshold = 6) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold])

  return scrolled
}

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
  const scrolled = useScrolled()

  return (
    <>
      {/* the band the page dissolves into before it reaches the switcher */}
      <motion.div
        aria-hidden
        animate={{ opacity: scrolled && !hidden ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-28"
        style={{
          // Solid until past the bottom of the pill, then out. Fading from
          // the very top left a ghost of the line behind it either side of
          // the switcher, which is the mess this is here to stop.
          background:
            "linear-gradient(to bottom, oklch(0.145 0.035 288) 0%, oklch(0.145 0.035 288) 46%, oklch(0.145 0.035 288 / 72%) 66%, oklch(0.145 0.035 288 / 0%) 100%)",
        }}
      />

      <motion.div
        animate={{ opacity: hidden ? 0 : 1, y: hidden ? -10 : 0 }}
        transition={{ duration: 0.7 }}
        className={cn(
          "fixed top-4 left-1/2 z-50 -translate-x-1/2",
          hidden && "pointer-events-none",
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
            "control gap-0 overflow-hidden bg-[oklch(0.255_0.032_286)] p-0",
            "rounded-full data-[variant=line]:rounded-full",
            "h-auto group-data-[orientation=horizontal]/tabs:h-auto",
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
                    : "text-muted-foreground hover:text-foreground",
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
    </>
  )
}
