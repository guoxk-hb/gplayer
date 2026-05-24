import type { App, Component } from 'vue'
import GVideo from './components/GVideo.vue'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const GPlayer: Component = GVideo

export { GPlayer, GVideo }

// ---------------------------------------------------------------------------
// Vue plugin — experiment-compatible primary API:
//   app.use(GVideoPlugin)          → registers <GVideo> globally
//   app.component('GVideo', GVideo) → manual registration
// <GPlayer> is also registered as a compatibility alias.
// ---------------------------------------------------------------------------
export const GVideoPlugin = {
  install(app: App) {
    app.component('GVideo', GVideo)
    app.component('GPlayer', GPlayer)
  },
}

export const GPlayerPlugin = GVideoPlugin

export default GVideoPlugin

// ---------------------------------------------------------------------------
// Composables
// ---------------------------------------------------------------------------
export { useCurrentLyric } from './composables/useCurrentLyric'

// ---------------------------------------------------------------------------
// Core player class (advanced usage — direct control)
// ---------------------------------------------------------------------------
export { GuoPlayer } from './composables/usePlayer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type {
  Lyric,
  Quality,
  Subtitle,
  SubtitleLoader,
  VideoInfo,
  VideoOptions,
  VideoSubtitle,
} from './types'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
export { convertSRTorLRCtoCustomJSON, parseLRC, parseSRT } from './utils/lyric'
