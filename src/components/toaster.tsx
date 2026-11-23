import { AnimatePresence, motion } from "motion/react"

import { Twemoji } from "@/components/twemoji"
import { dismiss, useToasts } from "@/lib/toast"
import { cn } from "@/lib/utils"

/**
 * Toasts sit at the bottom centre, over the page, as small panes of the same
 * glass as the cards. An action — "undo" — is its own pill, so it reads as
 * the one thing in the toast you can press.
 */
export function Toaster() {
  const toasts = useToasts()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            role="status"
            className={cn(
              "pointer-events-auto flex max-w-[min(26rem,100%)] items-center gap-2.5 rounded-full py-1.5 pr-1.5 pl-4",
              "border border-white/12 bg-[oklch(0.24_0.036_284/0.82)] text-small text-foreground backdrop-blur-xl",
              "shadow-[0_18px_40px_-18px_oklch(0.05_0.02_285/0.9)]",
              !t.action && "pr-4"
            )}
          >
            {t.icon ? (
              <Twemoji className="size-4 shrink-0">{t.icon}</Twemoji>
            ) : null}
            <span className="min-w-0 truncate py-1">{t.message}</span>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick()
                  dismiss(t.id)
                }}
                className="group/act -my-1 inline-flex min-h-10 shrink-0 items-center outline-none"
              >
                <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-foreground transition-colors group-hover/act:bg-white/20 group-focus-visible/act:ring-2 group-focus-visible/act:ring-white/40">
                  {t.action.label}
                </span>
              </button>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
