import type { ComponentProps } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

/**
 * GENERATED FILE — do not edit by hand.
 * Run `node tools/generate-handwriting.mjs` instead.
 *
 * "love" and "माया" (the Nepali word for love) written out on the page. The
 * outlines are real glyphs from Baloo 2 (Ek Type, OFL) — one upright family
 * covering both scripts — inlined so nothing is fetched at runtime.
 *
 * Each glyph is revealed by a clip rectangle that opens left to right,
 * staggered in reading order: the direction both scripts are actually
 * written, including the Devanagari शिरोरेखा along the top.
 */

type Word = {
  readonly viewBox: string
  readonly clipY: number
  readonly clipH: number
  readonly glyphs: readonly {
    readonly d: string
    readonly x: number
    readonly w: number
  }[]
}

export type HandwritingProps = Omit<
  ComponentProps<typeof motion.svg>,
  "durationScale" | "onAnimationComplete"
> & {
  /** Scales the whole animation. Below 1 speeds it up, above 1 slows it down. */
  durationScale?: number
  /** Fires once the last glyph has finished being written. */
  onAnimationComplete?: () => void
}

function Handwriting({
  word,
  stagger,
  wipe,
  title,
  className,
  durationScale = 1,
  onAnimationComplete,
  ...props
}: HandwritingProps & {
  word: Word
  stagger: number
  wipe: number
  title: string
}) {
  const calc = (x: number) => x * durationScale
  const uid = title.replace(/[^a-z]/gi, "").toLowerCase()

  return (
    <motion.svg
      className={cn("h-20", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={word.viewBox}
      fill="currentColor"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      <title>{title}</title>

      <defs>
        {word.glyphs.map((g, i) => (
          <clipPath key={i} id={`${uid}-clip-${i}`}>
            {/* The pen: a window that opens left to right across this glyph.
                Starting at width 0 is also what keeps a glyph invisible until
                its turn, so no separate opacity tween is needed. */}
            <motion.rect
              x={g.x}
              y={word.clipY}
              height={word.clipH}
              initial={{ width: 0 }}
              animate={{ width: g.w }}
              transition={{
                duration: calc(wipe),
                ease: [0.32, 0.02, 0.2, 1],
                delay: calc(i * stagger),
              }}
              // the last glyph finishing IS the word finishing, so this has to
              // hang off the wipe rather than off any shorter tween
              onAnimationComplete={
                i === word.glyphs.length - 1 ? onAnimationComplete : undefined
              }
            />
          </clipPath>
        ))}
      </defs>

      {word.glyphs.map((g, i) => (
        <path key={i} d={g.d} clipPath={`url(#${uid}-clip-${i})`} />
      ))}
    </motion.svg>
  )
}

const LOVE = {
  "viewBox": "13.3 -205.4 543.86 217.6",
  "clipY": -257.4,
  "clipH": 321.6,
  "glyphs": [
    {
      "d": "M21.3 -79.2L58.2 -77.4L58.2 -0.6Q55.8 0.3 51.3 1.05Q46.8 1.8 41.4 1.8Q31.2 1.8 26.25 -1.95Q21.3 -5.7 21.3 -15.3ZM58.2 -58.5L21.3 -60.3L21.3 -195Q23.4 -195.6 28.05 -196.5Q32.7 -197.4 37.8 -197.4Q48.6 -197.4 53.4 -193.65Q58.2 -189.9 58.2 -180.3Z",
      "x": 21.3,
      "w": 36.9
    },
    {
      "d": "M237.67 -71.1Q237.67 -48 228.67 -31.05Q219.67 -14.1 203.32 -4.95Q186.97 4.2 164.77 4.2Q142.57 4.2 126.07 -4.95Q109.57 -14.1 100.42 -30.9Q91.27 -47.7 91.27 -71.1Q91.27 -94.2 100.57 -111Q109.87 -127.8 126.37 -136.95Q142.87 -146.1 164.77 -146.1Q186.67 -146.1 203.02 -136.95Q219.37 -127.8 228.52 -110.85Q237.67 -93.9 237.67 -71.1ZM164.77 -116.7Q148.27 -116.7 138.82 -104.7Q129.37 -92.7 129.37 -71.1Q129.37 -48.9 138.67 -37.05Q147.97 -25.2 164.77 -25.2Q181.27 -25.2 190.57 -37.2Q199.87 -49.2 199.87 -71.1Q199.87 -92.4 190.57 -104.55Q181.27 -116.7 164.77 -116.7Z",
      "x": 91.27,
      "w": 146.4
    },
    {
      "d": "M374.72 -144.9Q382.52 -144.9 387.62 -141.3Q392.72 -137.7 392.72 -129.9Q392.72 -125.1 389.57 -113.85Q386.42 -102.6 381.32 -87.6Q376.22 -72.6 370.07 -56.7Q363.92 -40.8 357.62 -26.55Q351.32 -12.3 346.22 -2.7Q343.52 -0.6 337.67 0.9Q331.82 2.4 324.62 2.4Q316.22 2.4 310.22 0.15Q304.22 -2.1 301.82 -6.9Q298.52 -13.2 293.57 -24.6Q288.62 -36 282.92 -50.7Q277.22 -65.4 271.52 -81Q265.82 -96.6 261.17 -111Q256.52 -125.4 253.52 -136.5Q256.82 -140.1 262.07 -142.5Q267.32 -144.9 273.02 -144.9Q280.82 -144.9 285.77 -141.45Q290.72 -138 293.12 -129L308.42 -78.9Q310.82 -71.1 313.97 -61.95Q317.12 -52.8 319.82 -44.55Q322.52 -36.3 324.32 -30.6L325.52 -30.6Q334.52 -57 343.07 -85.5Q351.62 -114 357.92 -141Q365.12 -144.9 374.72 -144.9Z",
      "x": 253.52,
      "w": 139.2
    },
    {
      "d": "M435.16 -52.2L433.66 -78L514.06 -90Q513.16 -101.4 505.36 -109.8Q497.56 -118.2 482.56 -118.2Q467.26 -118.2 457.06 -107.55Q446.86 -96.9 446.56 -77.1L447.46 -61.5Q450.16 -42.3 462.31 -33.3Q474.46 -24.3 493.06 -24.3Q505.66 -24.3 516.46 -28.05Q527.26 -31.8 533.56 -36.3Q537.76 -33.6 540.31 -29.55Q542.86 -25.5 542.86 -20.7Q542.86 -12.9 535.96 -7.35Q529.06 -1.8 517.36 1.2Q505.66 4.2 490.66 4.2Q467.56 4.2 449.71 -4.35Q431.86 -12.9 421.81 -30Q411.76 -47.1 411.76 -72.6Q411.76 -90.9 417.46 -104.7Q423.16 -118.5 432.91 -127.65Q442.66 -136.8 455.56 -141.45Q468.46 -146.1 482.56 -146.1Q502.36 -146.1 517.21 -138.15Q532.06 -130.2 540.61 -116.1Q549.16 -102 549.16 -83.7Q549.16 -75.3 544.81 -71.25Q540.46 -67.2 532.66 -66.3Z",
      "x": 411.76,
      "w": 137.4
    }
  ]
} as const

export function LoveEffect({
  className,
  durationScale = 1,
  onAnimationComplete,
  ...props
}: HandwritingProps) {
  return (
    <Handwriting
      word={LOVE}
      stagger={0.26}
      wipe={0.5}
      title="love"
      className={className}
      durationScale={durationScale}
      onAnimationComplete={onAnimationComplete}
      {...props}
    />
  )
}

const MAYA = {
  "viewBox": "-17.3 -192.5 570.54 203.8",
  "clipY": -244.5,
  "clipH": 307.8,
  "glyphs": [
    {
      "d": "M131.7 -96L131.7 -68.1L68.7 -68.1Q66.6 -56.4 59.25 -49.8Q51.9 -43.2 38.7 -43.2Q24 -43.2 16.95 -50.1Q9.9 -57 9.9 -66.9Q9.9 -71.1 11.1 -75.45Q12.3 -79.8 14.4 -83.1L22.8 -83.1Q35.4 -83.1 35.4 -96.3L35.4 -164.4L70.2 -164.4L70.2 -96ZM140.1 -158.4L1.5 -158.4Q-4.2 -158.4 -6.75 -161.85Q-9.3 -165.3 -9.3 -171.9Q-9.3 -174.6 -8.7 -178.35Q-8.1 -182.1 -7.2 -184.5L131.4 -184.5Q142.2 -184.5 142.2 -171.3Q142.2 -168.6 141.6 -164.7Q141 -160.8 140.1 -158.4ZM125.7 -169.5L160.5 -169.5L160.5 1.2Q158.1 1.8 154.2 2.55Q150.3 3.3 145.8 3.3Q134.7 3.3 130.2 -0.6Q125.7 -4.5 125.7 -12.6ZM190.5 -158.4L103.2 -158.4Q97.5 -158.4 94.95 -161.85Q92.4 -165.3 92.4 -171.9Q92.4 -174.6 93 -178.35Q93.6 -182.1 94.5 -184.5L182.1 -184.5Q192.9 -184.5 192.9 -171.3Q192.9 -168.6 192.3 -164.7Q191.7 -160.8 190.5 -158.4Z",
      "x": -9.3,
      "w": 202.2
    },
    {
      "d": "M207.55 -169.5L242.35 -169.5L242.35 1.2Q239.65 1.8 235.9 2.55Q232.15 3.3 227.35 3.3Q216.55 3.3 212.05 -0.6Q207.55 -4.5 207.55 -12.6ZM272.35 -158.4L185.05 -158.4Q179.35 -158.4 176.8 -161.85Q174.25 -165.3 174.25 -171.9Q174.25 -174.6 174.85 -178.35Q175.45 -182.1 176.35 -184.5L263.95 -184.5Q274.75 -184.5 274.75 -171.3Q274.75 -168.6 274 -164.7Q273.25 -160.8 272.35 -158.4Z",
      "x": 174.25,
      "w": 100.5
    },
    {
      "d": "M304.01 -158.4L337.61 -161.4Q342.11 -158.7 346.31 -154.05Q350.51 -149.4 353.06 -143.4Q355.61 -137.4 355.61 -130.2Q355.61 -117.9 349.76 -109.35Q343.91 -100.8 334.16 -95.7Q324.41 -90.6 312.11 -88.5Q316.01 -76.2 327.41 -67.65Q338.81 -59.1 357.11 -59.1Q367.91 -59.1 376.31 -62.25Q384.71 -65.4 390.71 -70.5Q396.71 -75.6 400.01 -80.4L402.71 -49.5Q394.31 -40.5 382.31 -35.4Q370.31 -30.3 353.51 -30.3Q331.31 -30.3 314.51 -39.45Q297.71 -48.6 288.11 -63.6Q282.41 -72 279.41 -81.6Q276.41 -91.2 276.41 -98.1Q276.41 -102 277.91 -104.85Q279.41 -107.7 283.61 -108Q302.51 -109.5 311.06 -116.25Q319.61 -123 319.61 -134.4Q319.61 -142.8 315.56 -148.8Q311.51 -154.8 304.01 -158.4ZM413.21 -158.4L265.91 -158.4Q260.21 -158.4 257.66 -161.85Q255.11 -165.3 255.11 -171.9Q255.11 -174.6 255.86 -178.35Q256.61 -182.1 257.51 -184.5L404.81 -184.5Q415.61 -184.5 415.61 -171.3Q415.61 -168.6 415.01 -164.7Q414.41 -160.8 413.21 -158.4ZM396.41 -169.5L430.91 -169.5L430.91 1.2Q428.51 1.8 424.76 2.55Q421.01 3.3 416.21 3.3Q405.11 3.3 400.76 -0.6Q396.41 -4.5 396.41 -12.6ZM461.21 -158.4L373.61 -158.4Q367.91 -158.4 365.36 -161.85Q362.81 -165.3 362.81 -171.9Q362.81 -174.6 363.56 -178.35Q364.31 -182.1 365.21 -184.5L452.51 -184.5Q463.31 -184.5 463.31 -171.3Q463.31 -168.6 462.71 -164.7Q462.11 -160.8 461.21 -158.4Z",
      "x": 255.11,
      "w": 208.2
    },
    {
      "d": "M478.04 -169.5L512.84 -169.5L512.84 1.2Q510.14 1.8 506.39 2.55Q502.64 3.3 497.84 3.3Q487.04 3.3 482.54 -0.6Q478.04 -4.5 478.04 -12.6ZM542.84 -158.4L455.54 -158.4Q449.84 -158.4 447.29 -161.85Q444.74 -165.3 444.74 -171.9Q444.74 -174.6 445.34 -178.35Q445.94 -182.1 446.84 -184.5L534.44 -184.5Q545.24 -184.5 545.24 -171.3Q545.24 -168.6 544.49 -164.7Q543.74 -160.8 542.84 -158.4Z",
      "x": 444.74,
      "w": 100.5
    }
  ]
} as const

export function MayaEffect({
  className,
  durationScale = 1,
  onAnimationComplete,
  ...props
}: HandwritingProps) {
  return (
    <Handwriting
      word={MAYA}
      stagger={0.28}
      wipe={0.52}
      title="माया — love, in Nepali"
      className={className}
      durationScale={durationScale}
      onAnimationComplete={onAnimationComplete}
      {...props}
    />
  )
}
