export const useCurrentLyric = (lyric: Array<any>, currentTime: number) => {
  for (let item of lyric) {
    if (
      item.from <= currentTime / 1000 &&
      item.to >= currentTime / 1000
    ) {
      return item.content;
    }
  }
  return '';
}
