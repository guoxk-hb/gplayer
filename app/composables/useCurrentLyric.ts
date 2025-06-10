export function useCurrentLyric(lyric: Array<any>, currentTime: number) {
  for (const item of lyric) {
    if (
      item.from <= currentTime / 1000
      && item.to >= currentTime / 1000
    ) {
      return item.content
    }
  }
  return ''
}
