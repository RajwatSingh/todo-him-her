/**
 * Numbers that don't move.
 *
 * Fraunces is a text face, not a data face: it ships no tabular figure set,
 * and its digits differ enormously in width — a "1" is 67 units where a "0"
 * is 113. Set a running clock in it as plain text and the whole thing
 * flinches once a second, and resizes as it counts down.
 *
 * `font-variant-numeric: tabular-nums` cannot fix that, because there are no
 * tabular glyphs for it to switch to. So each digit is given a box one `ch`
 * wide instead — `ch` being defined as the advance of "0", which measurement
 * confirms is the widest digit in this face — and centred in it. Anything
 * that isn't a digit keeps its natural width, so the colon stays tight.
 *
 * The result is a monospaced rhythm out of a proportional face, which is what
 * a tabular figure set would have given us if this one had one.
 */
export function Figures({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <span className={className}>
      {children.split("").map((char, i) =>
        char >= "0" && char <= "9" ? (
          <span
            key={i}
            className="inline-block text-center"
            style={{ width: "1ch" }}
          >
            {char}
          </span>
        ) : (
          <span key={i}>{char}</span>
        )
      )}
    </span>
  )
}
