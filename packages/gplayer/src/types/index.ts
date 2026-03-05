export interface Lyric {
  to: number
  from: number
  content: string
  location: number
}

export interface Subtitle {
  fontSize: string | null
  fontColor: string | null
  backgroundAlpha: string | null
  backgroundColor: string | null
  Stroke: string
  lang: string
  body: Lyric[]
  type: 'subtitle'
  version: string
}

export interface VideoSubtitle {
  lang: string
  label: string
}

export interface VideoInfo {
  name: string
  url: string
  type: 'mpd' | 'm3u8' | 'mp4' | 'flv'
  subtitles: VideoSubtitle[]
}

export interface Quality {
  label: string
  // representation is kept as unknown to avoid forcing dashjs/hls.js type deps
  representation?: unknown
}

export interface VideoOptions {
  autoplay: boolean
  muted: boolean
  loop: boolean
  preload: string
}

/**
 * A function that loads subtitle data for a given language and video name.
 * Implement this in your app and pass it to GPlayer via the `subtitleLoader` prop.
 *
 * @param lang - ISO 639-3 language code (e.g. 'cmn', 'kor', 'eng')
 * @param name - Video name identifier
 * @returns Promise resolving to a Subtitle object
 *
 * @example
 * const subtitleLoader: SubtitleLoader = async (lang, name) => {
 *   return await $fetch(`/api/lyric?lang=${lang}&name=${name}`)
 * }
 */
export type SubtitleLoader = (lang: string, name: string) => Promise<Subtitle>
