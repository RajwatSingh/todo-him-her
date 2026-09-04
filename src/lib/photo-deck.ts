/**
 * Dealing the picture of the day.
 *
 * Kept free of any Vite `import.meta.glob` so the rule it implements — every
 * picture shown once before any repeats — can be tested on its own.
 */

const MS_PER_DAY = 86_400_000

/** "YYYY-MM-DD" → whole days since the epoch. */
export function dayNumber(day: string): number {
  const [y, m, d] = day.split("-").map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY)
}

/**
 * A fresh shuffle of 0..n-1 for each pass through the deck, so the second
 * cycle is not the first one over again.
 */
export function shuffledOrder(n: number, seed: number): number[] {
  let h = (Math.imul(seed, 2654435761) ^ 0x9e3779b9) >>> 0
  const rand = () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0
    return h / 0x1_0000_0000
  }
  rand()
  rand()

  const order = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/**
 * The item for one day, or null when the list is empty.
 *
 * The deck is dealt in blocks of `items.length` days: within a block every
 * item appears exactly once, and each block is shuffled differently.
 */
export function pickForDay<T>(items: readonly T[], day: string): T | null {
  const n = items.length
  if (n === 0) return null
  if (n === 1) return items[0]

  const days = dayNumber(day)
  // floor division and a non-negative remainder, so browsing to earlier days
  // keeps dealing from a valid deck instead of falling off the end
  const cycle = Math.floor(days / n)
  const position = ((days % n) + n) % n

  return items[orderForCycle(n, cycle)[position]]
}

/**
 * The order a cycle is dealt in.
 *
 * A plain reshuffle each cycle can end one pass and open the next on the
 * same picture, which reads as a repeat however correct the bookkeeping is.
 * When that would happen the first two of the new cycle trade places. Only
 * the front of the order is touched, never the last entry, so the next
 * cycle's check still has a fixed thing to compare against and this never
 * turns into a chain of adjustments.
 */
function orderForCycle(n: number, cycle: number): number[] {
  // with two pictures the only run without a back-to-back repeat is the
  // strict alternation, so there is nothing to shuffle
  if (n === 2) return [0, 1]

  const order = shuffledOrder(n, cycle)
  const endedPreviousCycle = shuffledOrder(n, cycle - 1)[n - 1]
  if (order[0] === endedPreviousCycle) {
    ;[order[0], order[1]] = [order[1], order[0]]
  }
  return order
}
