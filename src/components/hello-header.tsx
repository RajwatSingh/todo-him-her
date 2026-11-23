import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { DailyQuote } from "@/components/daily-quote"
import { LoveEffect, MayaEffect } from "@/components/handwriting"

/**
 * "love" writes itself out, then dissolves into माया — the Nepali word for
 * the same thing. It plays once per visit rather than looping, so it stays a
 * greeting instead of becoming a distraction.
 *
 * That is the first visit of the day. After it, the header folds down to one
 * row — the name and the sentence about the two of them — so on a phone the
 * lists open above the fold. Tapping the name plays the greeting again.
 */
export function HelloHeader({
  subtitle,
  compact = false,
  onReplay,
}: {
  subtitle: string
  compact?: boolean
  onReplay?: () => void
}) {
  const [step, setStep] = useState<0 | 1>(0)

  if (compact) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex min-w-0 items-baseline justify-center gap-3 pt-1 pb-1 text-center"
      >
        <button
          type="button"
          onClick={onReplay}
          title="play the greeting again"
          className="shrink-0 text-xl leading-none font-medium tracking-[-0.045em] text-foreground outline-none transition-opacity hover:opacity-80 focus-visible:underline"
        >
          our days
        </button>
        <span aria-hidden className="h-3 w-px shrink-0 self-center bg-white/15" />
        <p className="font-serif min-w-0 truncate text-[1.0625rem] leading-snug text-foreground/85 sm:text-lg">
          {subtitle}
        </p>
      </motion.header>
    )
  }

  return (
    <header className="relative z-10 flex flex-col items-center gap-3 pt-8 pb-2 text-center sm:pt-10">
      <DailyQuote />

      <div className="flex h-16 items-center justify-center sm:h-20">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="love"
              exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
              transition={{ duration: 0.55, ease: "easeIn" }}
            >
              <LoveEffect
                className="h-11 text-[var(--a-accent)] opacity-[0.45] sm:h-14"
                onAnimationComplete={() => {
                  // let it sit a moment before handing over to माया
                  setTimeout(() => setStep(1), 1000)
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="maya"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MayaEffect className="h-11 text-[var(--b-accent)] opacity-[0.45] sm:h-14" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="font-sans text-[2.5rem] leading-none font-medium tracking-[-0.045em] text-foreground sm:text-[3rem]"
      >
        our days
      </motion.h1>

      {/* the one sentence about the two of them, in the serif — the only
          prose on the page that gets it */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="font-serif max-w-xl text-[1.375rem] leading-snug tracking-[-0.01em] text-balance text-foreground/90 sm:text-[1.625rem]"
      >
        {subtitle}
      </motion.p>
    </header>
  )
}
