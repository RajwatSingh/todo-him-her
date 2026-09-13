import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export type TabId = "days" | "focus"

const TABS: { id: TabId; label: string }[] = [
  { id: "days", label: "days" },
  { id: "focus", label: "focus" },
]

/**
 * Two words at the top of the page. It has to read on cool paper and on a
 * night sky, so `tone` swaps the whole thing between ink and light rather
 * than trying to find one grey that survives both.
 */
export function TabSwitcher({
  value,
  onChange,
  tone,
  hidden = false,
}: {
  value: TabId
  onChange: (next: TabId) => void
  tone: "ink" | "light"
  hidden?: boolean
}) {
  const light = tone === "light"

  return (
    <motion.nav
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? -8 : 0 }}
      transition={{ duration: 0.7 }}
      className={cn(
        "fixed top-4 left-1/2 z-50 -translate-x-1/2",
        hidden && "pointer-events-none"
      )}
      aria-label="sections"
    >
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-full p-1 ring-1 backdrop-blur-md transition-colors duration-700",
          light ? "bg-white/8 ring-white/15" : "bg-card/70 ring-border"
        )}
      >
        {TABS.map((tab) => {
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative rounded-full px-4 py-1.5 text-[0.78rem] transition-colors outline-none",
                "focus-visible:ring-2",
                light
                  ? "focus-visible:ring-white/60"
                  : "focus-visible:ring-ring/50",
                active
                  ? light
                    ? "text-[oklch(0.22_0.05_285)]"
                    : "text-background"
                  : light
                    ? "text-white/55 hover:text-white/85"
                    : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="tab-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  className={cn(
                    "absolute inset-0 rounded-full",
                    light ? "bg-white/85" : "bg-foreground/85"
                  )}
                />
              ) : null}
              <span className="relative">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </motion.nav>
  )
}
