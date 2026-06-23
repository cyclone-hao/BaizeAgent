import { searchEmoji as _searchEmoji } from './emoji-data'

export async function searchEmoji(value: string) {
  return _searchEmoji(value)
}
