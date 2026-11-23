import { clip } from "@/lib/toast"
import { other, type PersonId, type Profile, type Todo } from "@/lib/types"

/**
 * What the other one just did, worked out by comparing the list before and
 * after a refresh. Nothing here knows about realtime: the same diff runs
 * whether the refresh came from Supabase or from another tab's storage
 * event, so both modes say the same things.
 *
 * Only positive moments are reported (a task torn off, a cheer, a note, a
 * ping, a focus block starting) and only ones the other person plausibly
 * made. Anything this device wrote in the last few seconds is skipped, so
 * your own optimistic writes echoing back never toast at you.
 */

export type Activity = {
  message: string
  icon: string
  /** a "thinking of you" — also raised as a system notification */
  ping?: boolean
}

/** ids (or `profile:a`) this device wrote recently, with when */
export type RecentWrites = Map<string, number>
export const RECENT_MS = 10_000

const fresh = (recent: RecentWrites, key: string) => {
  const at = recent.get(key)
  return at !== undefined && Date.now() - at < RECENT_MS
}

export function partnerActivity({
  me,
  prevTodos,
  nextTodos,
  prevProfiles,
  nextProfiles,
  recent,
}: {
  me: PersonId
  prevTodos: Todo[]
  nextTodos: Todo[]
  prevProfiles: Record<PersonId, Profile>
  nextProfiles: Record<PersonId, Profile>
  recent: RecentWrites
}): Activity[] {
  const out: Activity[] = []
  const them = other(me)
  const name = nextProfiles[them].name || "they"
  const before = new Map(prevTodos.map((t) => [t.id, t]))

  // torn off — reported once per tear, at the top of whatever came off
  const newlyDone = new Set(
    nextTodos
      .filter((t) => {
        const was = before.get(t.id)
        return was && !was.completed && t.completed
      })
      .map((t) => t.id)
  )
  for (const t of nextTodos) {
    if (!newlyDone.has(t.id)) continue
    if (t.parent_id && newlyDone.has(t.parent_id)) continue
    // a together task is whoever-added-it's, but either of you can tick it,
    // so for those anything this device didn't do itself was them
    if ((t.scope !== "together" && t.owner !== them) || fresh(recent, t.id)) continue
    out.push({
      message: `${name} tore off ‘${clip(t.text)}’${t.scope === "together" ? " from together" : ""}`,
      icon: "✨",
    })
  }

  // a cheer on one of mine
  for (const t of nextTodos) {
    if (t.owner !== me) continue
    const was = before.get(t.id)
    if (!was) continue
    const had = new Set(was.reactions.filter((r) => r.by === them).map((r) => r.emoji))
    const added = t.reactions.find((r) => r.by === them && !had.has(r.emoji))
    if (added && !fresh(recent, t.id)) {
      out.push({ message: `${name} cheered ‘${clip(t.text)}’`, icon: added.emoji })
    }
  }

  const was = prevProfiles[them]
  const now = nextProfiles[them]
  if (!fresh(recent, `profile:${them}`)) {
    if (
      now.last_ping_at &&
      now.last_ping_at !== was.last_ping_at &&
      Date.now() - Date.parse(now.last_ping_at) < 2 * 60_000
    ) {
      out.push({ message: `${name} is thinking of you`, icon: "💛", ping: true })
    }

    if (now.note_for_partner.trim() && now.note_for_partner !== was.note_for_partner) {
      out.push({ message: `${name} left you a note`, icon: "💌" })
    }

    if (
      now.focus_mode === "focus" &&
      now.focus_ends_at &&
      now.focus_ends_at !== was.focus_ends_at &&
      Date.parse(now.focus_ends_at) > Date.now()
    ) {
      const minutes = Math.round((Date.parse(now.focus_ends_at) - Date.now()) / 60_000)
      out.push({
        message:
          now.started_by === me
            ? `${name} joined your focus · ${minutes} min together`
            : `${name} started focusing · ${minutes} min`,
        icon: "⏳",
      })
    }
  }

  return out
}
