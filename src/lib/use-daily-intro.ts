import { useEffect, useState } from "react"

const INTRO_KEY = "our-days:intro-day"

/** Today on this device, "YYYY-MM-DD". */
function deviceDay() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Whether this is the first open of the day on this device. Decided once,
 * on mount, and recorded straight away — so the full greeting plays on the
 * first visit of each day and every visit after that opens on the lists.
 */
export function useDailyIntro() {
  const [full, setFull] = useState(() => {
    try {
      return localStorage.getItem(INTRO_KEY) !== deviceDay()
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (!full) return
    try {
      localStorage.setItem(INTRO_KEY, deviceDay())
    } catch {
      // private mode: it'll just greet in full every time
    }
  }, [full])

  return { full, replay: () => setFull(true) }
}
