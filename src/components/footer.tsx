import { motion } from "motion/react"
import { ArrowLeftRight, CloudOff, DatabaseZap } from "lucide-react"

import type { PersonId, Profile } from "@/lib/types"

export type FooterProps = {
  mode: "local" | "cloud"
  error: string | null
  /** who is holding this phone */
  me: PersonId
  profiles: Record<PersonId, Profile>
  onSwitchMe: () => void
  /** the cloud database predates the v3 columns */
  needsMigration: boolean
}

/**
 * The end of the page: who the whole thing is for, and whose phone this is.
 * The two names carry the same two accent colours as their columns, so the
 * dedication reads as the two of them meeting in the middle.
 *
 * (The line of encouragement that used to sit here was the same seven lines
 * for everyone. Its place is taken by the notes you leave on each other's
 * cards, which are actually from someone.)
 */
export function OurFooter({
  mode,
  error,
  me,
  profiles,
  onSwitchMe,
  needsMigration,
}: FooterProps) {
  return (
    <footer className="relative z-10 flex flex-col items-center gap-5 pt-2 pb-3 text-center">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="flex flex-col items-center gap-2.5"
      >
        {/* "for" set between two hairlines, like a dedication page */}
        <div className="flex items-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-border sm:w-16" />
          <span className="text-fine tracking-wide text-white/65">
            for
          </span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-border sm:w-16" />
        </div>

        <p className="flex items-baseline gap-2 text-name leading-none font-medium tracking-[-0.03em]">
          <span style={{ color: "var(--b-accent)" }}>aanya</span>
          <span className="text-[0.7em] text-muted-foreground/50">
            &amp;
          </span>
          <span style={{ color: "var(--a-accent)" }}>rajwat</span>
        </p>

        <p className="text-fine text-white/65">
          two time zones, one list
        </p>
      </motion.div>

      {/* cheers, notes and pings are from someone, so the phone has to know
          whose it is — guessed from its timezone, changeable here */}
      <button
        type="button"
        onClick={onSwitchMe}
        className="group/me inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-fine text-white/65 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-white/40"
      >
        this is {profiles[me].name}’s phone
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-white/75 transition-colors group-hover/me:bg-white/[0.12]">
          <ArrowLeftRight className="size-3" />
          switch
        </span>
      </button>

      {needsMigration ? (
        <span className="control inline-flex max-w-sm items-center gap-1.5 rounded-full px-3 py-1.5 text-fine text-white/65">
          <DatabaseZap className="size-3 shrink-0" />
          run the new supabase/schema.sql to turn on notes, cheers & memories
        </span>
      ) : null}

      {mode === "local" ? (
        <span className="control inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-fine text-muted-foreground">
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
