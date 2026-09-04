/**
 * The picture of the day.
 *
 * Every photo in `src/assets/photos` is shown once before any of them
 * repeats. Which one lands on a given day is *derived* from the date rather
 * than rolled at random and remembered, for two reasons: the two of you are
 * on different devices and must see the same picture on the same day, and a
 * derived answer needs no storage and survives a cleared browser.
 *
 * Drop files in the folder and rebuild — nothing here needs editing.
 */

import { pickForDay } from "@/lib/photo-deck"

// import.meta.glob patterns are resolved by Vite at build time and do not
// understand the "@/" alias, so this path has to stay relative.
const found = import.meta.glob(
  "../assets/photos/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
  { eager: true, query: "?url", import: "default" }
) as Record<string, string>

/** Sorted so the deck is the same order on every machine and every build. */
export const PHOTOS: string[] = Object.keys(found)
  .sort()
  .map((path) => found[path])

/** The photo for one "YYYY-MM-DD", or null when the folder is empty. */
export function photoForDay(day: string): string | null {
  return pickForDay(PHOTOS, day)
}
