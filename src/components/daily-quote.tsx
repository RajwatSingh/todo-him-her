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
    <div className="flex min-h-[5.5rem] w-full max-w-[46ch] items-end justify-center px-2">
      <p className="font-display max-w-[46ch] text-center text-lead leading-[1.5] text-foreground/80 italic">
        {quote.text}
        <span className="mt-2 block text-fine not-italic text-muted-foreground">
          {quote.author}
        </span>
      </p>
    </div>
  )
}
