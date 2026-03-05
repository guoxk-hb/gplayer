import type { Lyric } from '../types'

/**
 * Find the subtitle line that matches the current playback time.
 *
 * @param lyric - Array of lyric/subtitle entries
 * @param currentTime - Current playback position in milliseconds
 * @returns The content string for the active subtitle, or empty string if none
 */
export function useCurrentLyric(lyric: Lyric[], currentTime: number): string {
  for (const item of lyric) {
    if (item.from <= currentTime / 1000 && item.to >= currentTime / 1000) {
      return item.content
    }
  }
  return ''
}
