import { useCallback, useState } from "react"

import type { PersonId, Profile } from "@/lib/types"

/**
 * Who is holding this phone. The list itself has no login — either of you
 * can tick either column — but the things that are *from* someone (a cheer,
 * a note, "thinking of you", joining a focus block) need to know who.
 *
 * Resolved, in order: `?me=a|b` in the URL (kept for that tab only, so two
 * tabs can be the two of you), then what this device was last told, then a
 * guess from the device's own timezone against the two profiles.
 */
const DEVICE_KEY = "our-days:me"
const TAB_KEY = "our-days:me-tab"

const isPerson = (v: unknown): v is PersonId => v === "a" || v === "b"

function initial(profiles: Record<PersonId, Profile>): PersonId {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("me")
    if (isPerson(fromUrl)) {
      sessionStorage.setItem(TAB_KEY, fromUrl)
      return fromUrl
    }
    const tab = sessionStorage.getItem(TAB_KEY)
    if (isPerson(tab)) return tab
    const device = localStorage.getItem(DEVICE_KEY)
    if (isPerson(device)) return device
  } catch {
    // storage blocked: fall through to the guess
  }
  const here = Intl.DateTimeFormat().resolvedOptions().timeZone
  return here === profiles.b.timezone ? "b" : "a"
}

export function useMe(profiles: Record<PersonId, Profile>) {
  const [me, setMeState] = useState<PersonId>(() => initial(profiles))

  const setMe = useCallback((next: PersonId) => {
    setMeState(next)
    try {
      localStorage.setItem(DEVICE_KEY, next)
      sessionStorage.removeItem(TAB_KEY)
    } catch {
      // it holds for this visit
    }
  }, [])

  return [me, setMe] as const
}
