import emojiData from 'unicode-emoji-json'

export type EmojiItem = {
  emoji: string
  name: string
  slug: string
}

export type EmojiCategory = {
  id: string
  name: string
  emojis: EmojiItem[]
}

// Map unicode group names to display-friendly IDs and labels
const GROUP_MAP: Record<string, { id: string; name: string }> = {
  'Smileys & Emotion': { id: 'smileys', name: 'Smileys & Emotion' },
  'People & Body': { id: 'people', name: 'People & Body' },
  'Animals & Nature': { id: 'nature', name: 'Animals & Nature' },
  'Food & Drink': { id: 'food', name: 'Food & Drink' },
  'Travel & Places': { id: 'travel', name: 'Travel & Places' },
  'Activities': { id: 'activities', name: 'Activities' },
  'Objects': { id: 'objects', name: 'Objects' },
  'Symbols': { id: 'symbols', name: 'Symbols' },
  'Flags': { id: 'flags', name: 'Flags' },
}

// Build categories from unicode-emoji-json data
function buildCategories(): EmojiCategory[] {
  const grouped: Record<string, EmojiItem[]> = {}

  for (const [emoji, meta] of Object.entries(emojiData)) {
    const group = GROUP_MAP[meta.group]
    if (!group)
      continue

    if (!grouped[group.id])
      grouped[group.id] = []

    grouped[group.id].push({
      emoji,
      name: meta.name,
      slug: meta.slug,
    })
  }

  return Object.entries(GROUP_MAP).map(([_, group]) => ({
    id: group.id,
    name: group.name,
    emojis: grouped[group.id] || [],
  }))
}

export const emojiCategories = buildCategories()

// Flat list of all emojis for search
const allEmojis: EmojiItem[] = Object.entries(emojiData).map(([emoji, meta]) => ({
  emoji,
  name: meta.name,
  slug: (meta as any).slug || '',
}))

/**
 * Search emojis by name or slug (case-insensitive).
 * Returns native emoji characters.
 */
export function searchEmoji(query: string): string[] {
  if (!query.trim())
    return []

  const q = query.toLowerCase()
  return allEmojis
    .filter(item => item.name.includes(q) || item.slug.includes(q))
    .slice(0, 40) // Limit results for performance
    .map(item => item.emoji)
}
