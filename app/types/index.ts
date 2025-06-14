import type { Representation } from 'dashjs'
import type { Level } from 'hls.js'

interface Lyric {
  to: number
  from: number
  content: string
  location: number
}

export interface Subtitle {
  fontSize: string
  fontColor: string
  backgroundAlpha: string
  backgroundColor: string
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
  type: 'mpd' | 'm3u8' | 'mp4'
  subtitles: VideoSubtitle[]
}

export interface Quality {
  label: string
  representation?: Representation | Level
}

export interface VideoOptions {
  autoplay: boolean
  muted: boolean
  loop: boolean
  preload: string
}
