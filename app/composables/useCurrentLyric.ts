export function useCurrentLyric(
  lyric: Array<{
    from: number;
    to: number;
    location: number;
    content: string;
  }>,
  currentTime: number,
):string {
  for (const item of lyric) {
    if (item.from <= currentTime / 1000 && item.to >= currentTime / 1000) {
      return item.content;
    }
  }
  return '';
}
