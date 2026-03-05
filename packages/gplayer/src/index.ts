import type { App } from 'vue'
import GPlayer from './components/GPlayer.vue'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export { GPlayer }

// ---------------------------------------------------------------------------
// Vue plugin — supports both:
//   app.use(GPlayerPlugin)          → registers <GPlayer> globally
//   app.component('GPlayer', GPlayer) → manual registration
// ---------------------------------------------------------------------------
export const GPlayerPlugin = {
  install(app: App) {
    app.component('GPlayer', GPlayer)
  },
}

export default GPlayerPlugin

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
