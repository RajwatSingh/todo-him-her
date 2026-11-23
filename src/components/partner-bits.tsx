import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Heart } from "lucide-react"

import { haptic } from "@/lib/haptic"
import type { Profile } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * The small things on each card that are about the two of you rather than
 * the list: whether they're in a focus block (and joining it), the line one
 * of you has left for the other, "thinking of you", and the glow it sends.
 */

const focusActive = (p: Profile, now: Date) =>
  Boolean(p.focus_ends_at && Date.parse(p.focus_ends_at) > now.getTime())

/** "focusing · 18 min left", with "join" when it's theirs and you're free. */
export function FocusLine({
  profile,
  otherProfile,
  now,
  tone,
  onJoin,
}: {
  profile: Profile
  otherProfile: Profile
  now: Date
  tone: string
  /** present on the other one's card */
  onJoin?: () => void
}) {
  if (!focusActive(profile, now)) return null

  // `now` only ticks every 15s, so round rather than ceil — a fresh 25-minute
  // block should read 25, not 26
  const left = Math.max(1, Math.round((Date.parse(profile.focus_ends_at!) - now.getTime()) / 60_000))
  const focusing = profile.focus_mode === "focus"
  const together =
    focusing &&
    otherProfile.focus_mode === "focus" &&
    focusActive(otherProfile, now) &&
    Math.abs(Date.parse(otherProfile.focus_ends_at!) - Date.parse(profile.focus_ends_at!)) < 5000
  const canJoin = onJoin && focusing && !focusActive(otherProfile, now)

  return (
    <div className="mt-2 flex min-h-6 items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-small text-white/75 tnum">
        <span className="relative flex size-2">
          <span
            className="absolute inline-flex size-full animate-ping rounded-full opacity-60"
            style={{ backgroundColor: tone }}
          />
          <span className="relative inline-flex size-2 rounded-full" style={{ backgroundColor: tone }} />
        </span>
        {together ? "focusing together" : focusing ? "focusing" : "on a break"} · {left} min left
      </span>
      {canJoin ? (
        <button
          type="button"
          onClick={() => {
            haptic(10)
            onJoin()
          }}
          className="group/join -my-2 inline-flex min-h-10 shrink-0 items-center outline-none"
        >
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium transition-[filter] group-hover/join:brightness-110 group-focus-visible/join:ring-2 group-focus-visible/join:ring-white/40"
            style={{ backgroundColor: tone, color: "var(--void)" }}
          >
            join
          </span>
        </button>
      ) : null}
    </div>
  )
}

/**
 * The note for whoever's card this is, written by the other one, in a hand.
 * On their card you can write it (and send a "thinking of you"); on your own
 * card it's just there to be read.
 */
export function NoteLine({
  note,
  author,
  cardName,
  tone,
  onChange,
  onPing,
}: {
  note: string
  author: string
  cardName: string
  tone: string
  /** present when you're the one who writes this note */
  onChange?: (text: string) => void
  onPing?: () => void
}) {
  const [draft, setDraft] = useState(note)
  const focused = useRef(false)

  // follow the saved note — unless it's being typed into right now
  useEffect(() => {
    if (!focused.current) setDraft(note)
  }, [note])

  if (!onChange) {
    if (!note.trim()) return null
    return (
      <div className="mt-3 flex items-baseline gap-2">
        <p className="font-hand min-w-0 text-[1.375rem] leading-tight break-words text-foreground/90">
          {note}
        </p>
        <span className="shrink-0 text-fine text-white/55">— {author}</span>
      </div>
    )
  }

  return (
    <div className="mt-2 flex items-end gap-2">
      <label className="min-w-0 flex-1">
        <span className="sr-only">a note for {cardName}</span>
        <input
          value={draft}
          maxLength={90}
          onFocus={() => (focused.current = true)}
          onBlur={() => (focused.current = false)}
          onChange={(e) => {
            setDraft(e.target.value)
            onChange(e.target.value)
          }}
          placeholder={`leave ${cardName} a note…`}
          className={cn(
            "font-hand block w-full border-b border-dashed border-white/15 bg-transparent pt-1 pb-0.5 text-[1.375rem] leading-tight text-foreground/90",
            "outline-none transition-colors placeholder:text-white/35 focus:border-white/35"
          )}
        />
      </label>
      {onPing ? <PingButton tone={tone} cardName={cardName} onPing={onPing} /> : null}
    </div>
  )
}

function PingButton({
  tone,
  cardName,
  onPing,
}: {
  tone: string
  cardName: string
  onPing: () => void
}) {
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!sent) return
    const id = window.setTimeout(() => setSent(false), 2200)
    return () => window.clearTimeout(id)
  }, [sent])

  return (
    <button
      type="button"
      title={`let ${cardName} know you're thinking of them`}
      aria-label={`thinking of you, to ${cardName}`}
      onClick={() => {
        haptic([8, 40, 8])
        onPing()
        setSent(true)
        // ask once, while there's a tap to ask on, so their pings can reach
        // you later as a notification
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "default") {
            void Notification.requestPermission()
          }
        } catch {
          // not available here
        }
      }}
      className="group/ping inline-flex min-h-10 shrink-0 items-center outline-none"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-foreground/90 transition-colors group-hover/ping:bg-white/15 group-focus-visible/ping:ring-2 group-focus-visible/ping:ring-white/40">
        <motion.span
          key={String(sent)}
          initial={{ scale: sent ? 0.6 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 14 }}
          className="inline-flex"
        >
          <Heart
            className="size-3"
            strokeWidth={2.2}
            style={sent ? { fill: tone, color: tone } : undefined}
          />
        </motion.span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={sent ? "sent" : "idle"}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
          >
            {sent ? "sent" : "thinking of you"}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  )
}

/**
 * The card's edge breathing in its own colour, three times, when the other
 * one has just sent "thinking of you" — on both phones, so the sender sees
 * it land too. Only for a ping in the last 20 seconds, so reopening the page
 * later doesn't replay an old one.
 */
export function PingGlow({
  pingedAt,
  tone,
  glow,
}: {
  pingedAt: string | null
  tone: string
  glow: string
}) {
  const [shown, setShown] = useState<string | null>(null)

  useEffect(() => {
    if (!pingedAt || Date.now() - Date.parse(pingedAt) > 20_000) return
    setShown(pingedAt)
    const id = window.setTimeout(() => setShown(null), 3800)
    return () => window.clearTimeout(id)
  }, [pingedAt])

  if (!shown) return null
  return (
    <div
      key={shown}
      aria-hidden
      data-ping-glow
      className="ping-glow pointer-events-none absolute inset-0 z-30 rounded-[22px]"
      style={{
        boxShadow: `inset 0 0 0 1.5px ${tone}, inset 0 0 42px 2px ${glow}`,
      }}
    />
  )
}
