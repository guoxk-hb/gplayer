interface Lyric {
  to: number
  from: number
  content: string
  location: number
}

export interface Subtitle {
  fontSize: string,
  fontColor: string,
  backgroundAlpha: string,
  backgroundColor: string,
  Stroke: string,
  lang: string,
  body: Lyric[],
  type: "subtitle",
  version: string,
}


export interface VideoSubtitle {
  lang: string
  label: string
}

export interface VideoInfo {
  name: string
  url: string
  type: 'mpd' | 'm3u8' | 'mp4'
  subtitles: VideoSubtitle[]
}

import type { Level } from "hls.js"

export interface Quality {
  label: string
  representation: dashjs.Representation | Level
}
