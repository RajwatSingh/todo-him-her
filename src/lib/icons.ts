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
 */
const HINTS: [RegExp, string][] = [
  [/\b(chai|tea|coffee|caf(e|é))\b/i, "☕"],
  [/\b(read|book|chapter|novel)\b/i, "📚"],
  [/\b(run|jog|walk|steps)\b/i, "🏃"],
  [/\b(gym|workout|lift|exercise)\b/i, "🏋️"],
  [/\b(yoga|meditat|breathe|stretch)\b/i, "🧘"],
  [/\b(call|phone|ring)\b/i, "📞"],
  [/\b(mail|email|inbox)\b/i, "📧"],
  [/\b(meet|standup|sync|class|lecture)\b/i, "📅"],
  [/\b(code|build|deploy|bug|ship)\b/i, "💻"],
  [/\b(write|essay|assignment|notes?)\b/i, "📝"],
  [/\b(study|revise|exam|homework)\b/i, "🎓"],
  [/\b(clean|tidy|vacuum|dishes)\b/i, "🧹"],
  [/\b(laundry|wash|clothes)\b/i, "🧺"],
  [/\b(grocer|shop|buy|market)\b/i, "🛒"],
  [/\b(cook|dinner|lunch|breakfast|meal)\b/i, "🍳"],
  [/\b(water|hydrate)\b/i, "💧"],
  [/\b(med|pill|vitamin)\b/i, "💊"],
  [/\b(sleep|nap|rest|bed)\b/i, "😴"],
  [/\b(plant|water the)\b/i, "🪴"],
  [/\b(flight|fly|airport|travel|trip)\b/i, "✈️"],
  [/\b(train|bus|drive)\b/i, "🚗"],
  [/\b(music|song|playlist|guitar)\b/i, "🎵"],
  [/\b(movie|film|watch|show)\b/i, "🎬"],
  [/\b(draw|paint|design|sketch)\b/i, "🎨"],
  [/\b(gift|present|birthday)\b/i, "🎁"],
  [/\b(love|miss|him|her|us)\b/i, "🫶"],
]

export function guessIcon(text: string): string {
  for (const [pattern, icon] of HINTS) {
    if (pattern.test(text)) return icon
  }
  return "🌸"
}
