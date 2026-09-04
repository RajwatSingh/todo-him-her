import { motion } from "motion/react"
import { CloudOff } from "lucide-react"

import { ShimmeringText } from "@/components/shimmering-text"

export type FooterProps = {
  /** the little line of encouragement for today */
  note: string
  mode: "local" | "cloud"
  error: string | null
}

/**
 * The end of the page: today's note, then who the whole thing is for. The two
 * names carry the same two accent colours as their columns, so the dedication
 * reads as the two of them meeting in the middle.
 */
export function OurFooter({ note, mode, error }: FooterProps) {
  return (
    <footer className="relative z-10 flex flex-col items-center gap-4 pt-2 pb-3 text-center">
      <ShimmeringText
        text={note}
        duration={3.2}
        className="font-display text-[0.82rem] font-light [--color:var(--muted-foreground)] [--shimmering-color:var(--a-accent)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="flex flex-col items-center gap-2"
      >
        {/* "for" set between two hairlines, like a dedication page */}
        <div className="flex items-center gap-2.5">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-border sm:w-16" />
          <span className="text-[0.6rem] tracking-[0.22em] text-muted-foreground/70 uppercase">
            for
          </span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-border sm:w-16" />
        </div>

        <p className="flex items-center gap-2 font-display text-[1.15rem] leading-none font-light tracking-tight sm:text-[1.3rem]">
          <span style={{ color: "var(--b-accent)" }}>aanya</span>
          <span className="text-[0.85em] text-muted-foreground/55 italic">
            &amp;
          </span>
          <span style={{ color: "var(--a-accent)" }}>rajwat</span>
        </p>

        <p className="text-[0.66rem] tracking-wide text-muted-foreground/65">
          two time zones · one list
        </p>
      </motion.div>

      {mode === "local" ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-[0.65rem] text-muted-foreground ring-1 ring-black/5">
          <CloudOff className="size-3" />
          saved on this device only — not syncing yet
        </span>
      ) : null}

      {error ? (
        <span className="text-[0.65rem] text-destructive/80">{error}</span>
      ) : null}
    </footer>
  )
}
