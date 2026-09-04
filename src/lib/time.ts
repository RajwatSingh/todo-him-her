/**
 * Everything time-and-timezone. Two people, two clocks, one page.
 *
 * All of it runs off `Intl` with a named IANA zone, so daylight saving in
 * Gettysburg and the +05:30 offset in Pune are handled by the platform
 * rather than by arithmetic we'd get wrong twice a year.
 */

import type { Profile } from "@/lib/types"

/** Someone is considered asleep from midnight until this hour, their time. */
export const SLEEP_START_HOUR = 0
export const SLEEP_END_HOUR = 8

/** The wall-clock parts of `at` as seen in `timezone`. */
export function partsIn(timezone: string, at: Date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
  })

  const parts: Record<string, string> = {}
  for (const p of fmt.formatToParts(at)) parts[p.type] = p.value

  // en-CA gives midnight as "24" rather than "00" in some engines.
  const hour = Number(parts.hour) % 24

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute: Number(parts.minute),
    weekday: parts.weekday,
    /** "YYYY-MM-DD" in this zone */
    date: `${parts.year}-${parts.month}-${parts.day}`,
  }
}

/**
 * The date key a todo is filed under: the owner's own local date, shifted by
 * `offsetDays`. So "tomorrow" means tomorrow *for them*, which is the whole
 * point when you're 9.5 hours apart.
 */
export function localDay(timezone: string, offsetDays = 0, at: Date = new Date()) {
  const { date } = partsIn(timezone, at)
  if (offsetDays === 0) return date

  const [y, m, d] = date.split("-").map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d + offsetDays))
  return shifted.toISOString().slice(0, 10)
}

/** "9:14 pm" */
export function clockIn(timezone: string, at: Date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(at)
    .toLowerCase()
}

/** "Wednesday, 3 September" */
export function longDateIn(timezone: string, offsetDays = 0, at: Date = new Date()) {
  const day = localDay(timezone, offsetDays, at)
  const [y, m, d] = day.split("-").map(Number)
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(y, m - 1, d)))
}

export type SleepState = {
  asleep: boolean
  /** minutes until they wake (when asleep) or until they sleep (when awake) */
  minutesUntilChange: number
  /** 0 → just fell asleep, 1 → about to wake */
  progress: number
}

export function sleepStateIn(timezone: string, at: Date = new Date()): SleepState {
  const { hour, minute } = partsIn(timezone, at)
  const minutes = hour * 60 + minute
  const sleepStart = SLEEP_START_HOUR * 60
  const sleepEnd = SLEEP_END_HOUR * 60

  const asleep = minutes >= sleepStart && minutes < sleepEnd

  if (asleep) {
    return {
      asleep: true,
      minutesUntilChange: sleepEnd - minutes,
      progress: (minutes - sleepStart) / (sleepEnd - sleepStart),
    }
  }

  // minutes until midnight
  return {
    asleep: false,
    minutesUntilChange: 24 * 60 - minutes + sleepStart,
    progress: 0,
  }
}

/** "6h 20m" / "45m" */
export function humanDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  if (h <= 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * How far ahead/behind `b` is relative to `a`, e.g. "9.5h ahead".
 * Computed from the actual current offsets so DST is never assumed.
 */
export function offsetBetween(tzA: string, tzB: string, at: Date = new Date()) {
  const minutesOf = (tz: string) => {
    const p = partsIn(tz, at)
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  }

  const diffMinutes = (minutesOf(tzB) - minutesOf(tzA)) / 60000
  const hours = diffMinutes / 60
  const rounded = Math.round(Math.abs(hours) * 10) / 10
  const label = Number.isInteger(rounded) ? `${rounded}` : `${rounded}`
  return {
    hours,
    label: `${label}h ${hours >= 0 ? "ahead" : "behind"}`,
  }
}

/* -------------------------------------------------------------------------- */
/* manual sleep — "goodnight" / "good morning"                                */
/* -------------------------------------------------------------------------- */

/**
 * The sleep state actually shown for someone: the clock's guess, unless they
 * tapped goodnight (or tapped that they're still up), in which case their own
 * word wins.
 */
export type ResolvedSleep = SleepState & {
  /** true when this is their own tap rather than the clock's guess */
  manual: boolean
  /** minutes since they tapped, when `manual` */
  minutesSinceTap: number
}

/**
 * A tap is honoured only until the clock crosses the next sleep boundary.
 * Past that point the clock has caught up with them — or they forgot to tap
 * back — and either way the schedule is the better answer again.
 */
export function resolveSleep(
  profile: Pick<Profile, "timezone" | "sleep_override" | "sleep_override_at">,
  at: Date = new Date()
): ResolvedSleep {
  const auto = sleepStateIn(profile.timezone, at)
  const plain = { ...auto, manual: false, minutesSinceTap: 0 }

  if (!profile.sleep_override || !profile.sleep_override_at) return plain

  const tappedAt = new Date(profile.sleep_override_at)
  if (Number.isNaN(tappedAt.getTime())) return plain

  // stale: the clock itself has flipped since the tap
  if (sleepStateIn(profile.timezone, tappedAt).asleep !== auto.asleep) return plain

  const asleep = profile.sleep_override === "asleep"
  // nothing to override — they and the clock agree
  if (asleep === auto.asleep) return plain

  const minutesSinceTap = Math.max(0, (at.getTime() - tappedAt.getTime()) / 60000)

  return {
    asleep,
    // the clock flips at the same moment either way, so the countdown to the
    // next boundary is unchanged by the tap
    minutesUntilChange: auto.minutesUntilChange,
    progress: asleep ? 0 : auto.progress,
    manual: true,
    minutesSinceTap,
  }
}
