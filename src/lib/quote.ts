/**
 * The quote shown above the title, fresh on every visit.
 *
 * Held locally rather than fetched. The free quote APIs are either gone
 * (quotable.io), blocked from the browser (zenquotes sends no CORS header),
 * or serve unvetted scraped text — one handed back a line calling women
 * "one of nature's agreeable blunders", another a joke about sex drive.
 * A keyword filter screens vocabulary, not sentiment, so it cannot make an
 * unvetted feed safe. This page is a gift and nobody is watching it, so the
 * lines it can show are fixed and known.
 *
 * Every attribution below is one that can be traced to a written source.
 * Much of the popular motivational canon is misattributed — "success is not
 * final, failure is not fatal" is not Churchill's, "in the middle of
 * difficulty lies opportunity" is not Einstein's, "it does not matter how
 * slowly you go" is not Confucius's, and "what we do now echoes in eternity"
 * is from the film Gladiator, not Marcus Aurelius. None of those are here.
 * Where a line is genuinely anonymous it is credited to the tradition it
 * comes from rather than to a name that would look better.
 */

export type Quote = { text: string; author: string }

export const QUOTES: readonly Quote[] = [
  // perseverance, and the long way round
  { text: "The best way out is always through.", author: "Robert Frost" },
  { text: "Little strokes fell great oaks.", author: "Benjamin Franklin" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Fall seven times, stand up eight.", author: "Japanese proverb" },
  { text: "Little by little, one travels far.", author: "Spanish proverb" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "It is only the first step that is difficult.", author: "Marquise du Deffand" },
  { text: "You may encounter many defeats, but you must not be defeated.", author: "Maya Angelou" },
  { text: "Perseverance is a great element of success.", author: "Henry Wadsworth Longfellow" },

  // patience, and going at your own pace
  { text: "Adopt the pace of nature: her secret is patience.", author: "Ralph Waldo Emerson" },
  { text: "Patience and time do more than strength or passion.", author: "Jean de La Fontaine" },
  { text: "Have patience with all things, but chiefly have patience with yourself.", author: "Francis de Sales" },
  { text: "Rivers know this: there is no hurry. We shall get there some day.", author: "A. A. Milne" },
  { text: "The reward of a thing well done is having done it.", author: "Ralph Waldo Emerson" },

  // steadiness when things are hard
  { text: "You have power over your mind — not outside events. Realise this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { text: "Do the best you can until you know better. Then when you know better, do better.", author: "Maya Angelou" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },

  // hope, distance, and the two of them
  { text: "We must accept finite disappointment, but never lose infinite hope.", author: "Martin Luther King Jr." },
  { text: "Hope is the thing with feathers that perches in the soul.", author: "Emily Dickinson" },
  { text: "Tomorrow is always fresh, with no mistakes in it yet.", author: "L. M. Montgomery" },
  { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
  { text: "The heart has its reasons of which reason knows nothing.", author: "Blaise Pascal" },
  { text: "Absence is to love what wind is to fire: it extinguishes the small and kindles the great.", author: "Bussy-Rabutin" },
  { text: "Not all those who wander are lost.", author: "J. R. R. Tolkien" },
] as const

export const LAST_SHOWN_KEY = "our-days:last-quote"

/**
 * A quote for this visit, avoiding the one given last time so a refresh
 * always visibly changes something.
 *
 * Pure, and deliberately so: it is called from a useState initialiser, which
 * React may invoke more than once for the same render. An earlier version
 * recorded the choice itself, so under StrictMode the second invocation
 * overwrote the first and the stored index no longer matched the quote on
 * screen — which brought back the very repeat this is meant to prevent.
 * Recording the choice is the caller's job, once the render is committed.
 */
export function pickQuote(
  previous: number,
  random: () => number = Math.random
): { quote: Quote; index: number } {
  const n = QUOTES.length
  let index = Math.floor(random() * n) % n
  if (n > 1 && index === previous) index = (index + 1) % n
  return { quote: QUOTES[index], index }
}

/**
 * The index shown last time, or -1 when there is nothing to go on.
 *
 * Storage can throw on mere access in a private window or with site data
 * blocked, so every touch of it is guarded; a failure costs only the
 * no-repeat guarantee.
 */
export function readLastShown(): number {
  try {
    const raw = window.sessionStorage.getItem(LAST_SHOWN_KEY)
    if (raw === null) return -1
    const n = Number.parseInt(raw, 10)
    return Number.isInteger(n) ? n : -1
  } catch {
    return -1
  }
}

export function writeLastShown(index: number): void {
  try {
    window.sessionStorage.setItem(LAST_SHOWN_KEY, String(index))
  } catch {
    // a quote that cannot be remembered is still a quote
  }
}
