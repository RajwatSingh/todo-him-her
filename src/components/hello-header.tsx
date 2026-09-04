import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { LoveEffect, MayaEffect } from "@/components/handwriting"

/**
 * "love" writes itself out, then dissolves into माया — the Nepali word for
 * the same thing. It plays once per visit rather than looping, so it stays a
 * greeting instead of becoming a distraction.
 */
export function HelloHeader({ subtitle }: { subtitle: string }) {
  const [step, setStep] = useState<0 | 1>(0)

  return (
    <header className="relative z-10 flex flex-col items-center gap-3 pt-10 pb-2 text-center sm:pt-14">
      <div className="flex h-16 items-center justify-center sm:h-20">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="love"
              exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
              transition={{ duration: 0.55, ease: "easeIn" }}
            >
              <LoveEffect
                className="h-12 text-[var(--a-accent)] sm:h-16"
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
              <MayaEffect className="h-12 text-[var(--b-accent)] sm:h-15" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="font-display text-[2.6rem] leading-none font-normal tracking-tight text-foreground/90 sm:text-[3.25rem]"
      >
        our days
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="max-w-md text-[0.8rem] text-muted-foreground"
      >
        {subtitle}
      </motion.p>
    </header>
  )
}
