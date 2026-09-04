import { useEffect, useState } from "react"

import { pickQuote, readLastShown, writeLastShown } from "@/lib/quote"

/**
 * A line above the title, different on each visit.
 *
 * Chosen once per mount rather than on every render, so a re-render — a
 * ticking clock, a checked-off task — does not swap the words out from under
 * whoever is reading them. The choice is recorded afterwards, in an effect,
 * so what gets remembered is what was actually shown.
 */
export function DailyQuote() {
  const [{ quote, index }] = useState(() => pickQuote(readLastShown()))

  useEffect(() => {
    writeLastShown(index)
  }, [index])

  return (
    // The height is held and the text sits on its baseline, so a one-line
    // quote and a two-line one leave the title in exactly the same place.
    <div className="flex min-h-[4.5rem] w-full max-w-[34rem] items-end justify-center px-2">
      <p className="text-center font-display text-[0.9rem] leading-relaxed text-muted-foreground italic">
        {quote.text}
        <span className="mt-1 block text-[0.72rem] not-italic opacity-75">
          {quote.author}
        </span>
      </p>
    </div>
  )
}
