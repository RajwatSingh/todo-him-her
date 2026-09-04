/**
 * Regenerates src/components/handwriting.tsx.
 *
 * The header writes out two words — "love" and "माया" — and rather than
 * hand-authoring bezier strokes for them, we lift the real glyph outlines
 * from a typeface and inline them as SVG paths. Nothing is fetched at
 * runtime; the generated file is self-contained.
 *
 *   node tools/generate-handwriting.mjs
 *
 * The .ttf is downloaded into tools/fonts/ on first run and is gitignored —
 * only the generated component is committed.
 *
 * Font: Baloo 2 by Ek Type (SIL Open Font License 1.1).
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { openSync } from "fontkit"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..")
const FONT_DIR = path.join(HERE, "fonts")
const OUT = path.join(ROOT, "src/components/handwriting.tsx")

/**
 * Baloo 2 (Ek Type) covers Devanagari and Latin in one upright, rounded
 * family, so both words share a single typeface. It replaced Kalam +
 * Dancing Script, which were both oblique by design — the slant read as
 * italic and was the wrong feel for the page.
 */
const FONTS = {
  baloo: {
    file: "Baloo2.ttf",
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf",
  },
}

const PAD = 8
const FONT_SIZE = 300

async function ensureFont({ file, url }) {
  const dest = path.join(FONT_DIR, file)
  if (fs.existsSync(dest)) return dest

  fs.mkdirSync(FONT_DIR, { recursive: true })
  process.stdout.write(`  downloading ${file}… `)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  console.log("ok")
  return dest
}

/** Weight to instance the variable font at (Baloo 2's wght axis is 400–800). */
const WEIGHT = 600

/**
 * Shape and lay out a word, returning one SVG path per glyph.
 *
 * fontkit is used rather than opentype.js for two reasons: it can actually
 * instance a variable font (opentype.js's variation.set leaves getPath
 * outlines untouched — every weight came out identical), and it runs real
 * OpenType shaping, so glyph selection and positioning are the font's own
 * rather than our guess at advance widths.
 */
function layout(fontPath, word) {
  const font = openSync(fontPath).getVariation({ wght: WEIGHT })
  const scale = FONT_SIZE / font.unitsPerEm
  const run = font.layout(word)

  const out = []
  let pen = 0
  run.glyphs.forEach((glyph, i) => {
    const pos = run.positions[i]
    // font units are y-up with the baseline at 0; scaling by -scale flips
    // into SVG's y-down space, leaving the glyph above the baseline
    const p = glyph.path
      .translate(pen + pos.xOffset, pos.yOffset)
      .scale(scale, -scale)
    const d = p.toSVG()
    if (d && d.trim()) out.push({ d, bbox: p.bbox })
    pen += pos.xAdvance
  })

  if (!out.length) throw new Error(`no glyphs rendered for "${word}"`)

  const x1 = Math.min(...out.map((o) => o.bbox.minX))
  const y1 = Math.min(...out.map((o) => o.bbox.minY))
  const x2 = Math.max(...out.map((o) => o.bbox.maxX))
  const y2 = Math.max(...out.map((o) => o.bbox.maxY))
  const n = (v) => +v.toFixed(2)

  // No transform group: the viewBox carries the offset so the glyph paths and
  // their clip rects share one coordinate space. (A translated <g> would
  // shift the clip rects a second time — that bug cost an hour once.)
  return {
    viewBox: [x1 - PAD, y1 - PAD, x2 - x1 + PAD * 2, y2 - y1 + PAD * 2]
      .map(n)
      .join(" "),
    clipY: n(y1 - 60),
    clipH: n(y2 - y1 + 120),
    glyphs: out.map((o) => ({
      d: o.d,
      x: n(o.bbox.minX),
      w: n(o.bbox.maxX - o.bbox.minX),
    })),
  }
}

const emit = (constName, exportName, word, title, stagger, wipe) => `
const ${constName} = ${JSON.stringify(word, null, 2)} as const

export function ${exportName}({
  className,
  durationScale = 1,
  onAnimationComplete,
  ...props
}: HandwritingProps) {
  return (
    <Handwriting
      word={${constName}}
      stagger={${stagger}}
      wipe={${wipe}}
      title=${JSON.stringify(title)}
      className={className}
      durationScale={durationScale}
      onAnimationComplete={onAnimationComplete}
      {...props}
    />
  )
}
`

const header = `import type { ComponentProps } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

/**
 * GENERATED FILE — do not edit by hand.
 * Run \`node tools/generate-handwriting.mjs\` instead.
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
          <clipPath key={i} id={\`\${uid}-clip-\${i}\`}>
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
        <path key={i} d={g.d} clipPath={\`url(#\${uid}-clip-\${i})\`} />
      ))}
    </motion.svg>
  )
}
`

console.log("generating handwriting component")
const baloo = await ensureFont(FONTS.baloo)

const love = layout(baloo, "love")
const maya = layout(baloo, "माया")

fs.writeFileSync(
  OUT,
  header +
    emit("LOVE", "LoveEffect", love, "love", 0.26, 0.5) +
    emit("MAYA", "MayaEffect", maya, "माया — love, in Nepali", 0.28, 0.52)
)

console.log(`  love: ${love.glyphs.length} glyphs`)
console.log(`  माया: ${maya.glyphs.length} glyphs`)
console.log(`wrote ${path.relative(ROOT, OUT)}`)
