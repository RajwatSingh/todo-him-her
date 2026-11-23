/** The emoji you can pin to a task, grouped so the picker reads nicely. */
export const ICON_GROUPS: { label: string; icons: string[] }[] = [
  {
    label: "day",
    icons: ["☀️", "🌤️", "🌙", "⭐", "🌸", "🌷", "🪷", "🍀", "🫶", "💌"],
  },
  {
    label: "work",
    icons: ["💻", "📚", "📝", "📖", "✏️", "📊", "📧", "📅", "🎓", "🧠"],
  },
  {
    label: "home",
    icons: ["🧹", "🧺", "🛒", "🍳", "🧊", "🪴", "🛁", "🧴", "📦", "🔧"],
  },
  {
    label: "body",
    icons: ["🏃", "🧘", "🏋️", "🚶", "💊", "🥗", "💧", "😴", "🦷", "🩺"],
  },
  {
    label: "joy",
    icons: ["☕", "🍵", "🍕", "🍰", "🎵", "🎨", "🎬", "📷", "🎮", "🧶"],
  },
  {
    label: "out",
    icons: ["✈️", "🚗", "🚉", "🏖️", "🎟️", "🎁", "💐", "🏦", "📞", "🗺️"],
  },
]

export const ALL_ICONS = ICON_GROUPS.flatMap((g) => g.icons)

/**
 * A gentle guess at an icon from the task text, so a task typed quickly
 * still gets something at the front of it.
 *
 * Patterns are stems (`meditat\w*`, `grocer\w*`) rather than whole words, so
 * "meditate" and "groceries" are caught, and the more specific ones come
 * first — "water the plants" is a plant, not a glass of water. Every icon
 * here is one the picker offers, so a guess can always be found and changed.
 */
const HINTS: [RegExp, string][] = [
  [/\b(chai|tea|coffee|caf(e|é)|latte|espresso)\b/i, "☕"],
  [/\b(matcha|green tea|herbal)\b/i, "🍵"],
  [/\b(plants?|garden\w*|repot\w*|water the)\b/i, "🪴"],
  // before books: "book flights" is a trip, not a read
  [/\b(flights?|fly|airport|travel\w*|trip|visa|passport)\b/i, "✈️"],
  [/\b(read|reading|books?|chapters?|novel)\b/i, "📚"],
  [/\b(run|running|jog\w*|walk\w*|steps)\b/i, "🏃"],
  [/\b(gym|workout|lift\w*|exercise|training)\b/i, "🏋️"],
  [/\b(yoga|meditat\w*|breath\w*|stretch\w*)\b/i, "🧘"],
  [/\b(call|phone|ring|facetime)\b/i, "📞"],
  [/\b(e?mails?|inbox|reply|respond)\b/i, "📧"],
  [/\b(meet\w*|standup|sync|class\w*|lecture|appointment|schedule|calendar|plan)\b/i, "📅"],
  [/\b(code|coding|build|deploy|bugs?|ship|debug|pr|commit|laptop)\b/i, "💻"],
  [/\b(write|writing|essay|assignment|notes?|journal\w*|draft)\b/i, "📝"],
  [/\b(stud\w*|revis\w*|exams?|homework|quiz|thesis|apply|application)\b/i, "🎓"],
  [/\b(learn\w*|research|practi[cs]e|think|brainstorm)\b/i, "🧠"],
  [/\b(report|spreadsheet|slides|deck|budget|data|analy\w*)\b/i, "📊"],
  [/\b(clean\w*|tidy|vacuum|dishes|trash|garbage|recycl\w*|mop)\b/i, "🧹"],
  [/\b(laundry|wash\w*|clothes|iron\w*|fold)\b/i, "🧺"],
  [/\b(grocer\w*|shop\w*|buy|market|order)\b/i, "🛒"],
  [/\b(cook\w*|dinner|lunch|breakfast|meals?|recipe)\b/i, "🍳"],
  [/\b(salad|veggies|vegetables|fruit|eat healthy)\b/i, "🥗"],
  [/\b(bak\w*|cake|dessert|cookies?)\b/i, "🍰"],
  [/\b(pizza|takeout|snack)\b/i, "🍕"],
  [/\b(dentist|teeth|floss)\b/i, "🦷"],
  [/\b(doctor|clinic|checkup|therapy|hospital)\b/i, "🩺"],
  [/\b(meds?|medicine|pills?|vitamins?)\b/i, "💊"],
  [/\b(water|hydrat\w*|drink)\b/i, "💧"],
  [/\b(shower|bath)\b/i, "🛁"],
  [/\b(skincare|lotion|sunscreen|moisturi[sz]e)\b/i, "🧴"],
  [/\b(sleep\w*|nap|rest|bed)\b/i, "😴"],
  [/\b(trains?|metro|station)\b/i, "🚉"],
  [/\b(bus|drive|car|uber|ride)\b/i, "🚗"],
  [/\b(pack\w*|package|parcel|deliver\w*|post office|return)\b/i, "📦"],
  [/\b(fix|repair|assemble|install)\b/i, "🔧"],
  [/\b(pay|bills?|bank\w*|rent|tax\w*|money|invoice)\b/i, "🏦"],
  [/\b(music|songs?|playlist|guitar|piano|sing\w*)\b/i, "🎵"],
  [/\b(movie|film|watch|show|episode)\b/i, "🎬"],
  [/\b(photos?|pictures?|camera)\b/i, "📷"],
  [/\b(games?|gaming|play)\b/i, "🎮"],
  [/\b(knit\w*|crochet|sew\w*)\b/i, "🧶"],
  [/\b(draw\w*|paint\w*|design\w*|sketch\w*|art)\b/i, "🎨"],
  [/\b(tickets?|concert|event)\b/i, "🎟️"],
  [/\b(flowers?|bouquet)\b/i, "💐"],
  [/\b(gifts?|presents?|birthday|surprise)\b/i, "🎁"],
  [/\b(letter|card|write to)\b/i, "💌"],
  [/\b(love|miss|him|her|us|date night)\b/i, "🫶"],
]

/**
 * When nothing matches. A single fixed fallback made every unrecognised task
 * look the same, so pick from a small soft set instead — deterministically,
 * from the text, so the add box's preview and the saved task always agree.
 */
const FALLBACKS = ["🌸", "🌷", "🪷", "🍀", "⭐", "🌤️", "🌙", "✏️", "📖", "💌"]

export function guessIcon(text: string): string {
  for (const [pattern, icon] of HINTS) {
    if (pattern.test(text)) return icon
  }
  let h = 0
  for (const ch of text.trim().toLowerCase()) {
    h = (h * 31 + ch.codePointAt(0)!) >>> 0
  }
  return FALLBACKS[h % FALLBACKS.length]
}
