import type { App } from 'vue';
import GPlayer from './components/GPlayer.vue';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export { GPlayer };

// ---------------------------------------------------------------------------
// Vue plugin — supports both:
//   app.use(GPlayerPlugin)          → registers <GPlayer> globally
//   app.component('GPlayer', GPlayer) → manual registration
// ---------------------------------------------------------------------------
export const GPlayerPlugin = {
  install(app: App) {
    app.component('GPlayer', GPlayer);
  },
};

export default GPlayerPlugin;

// ---------------------------------------------------------------------------
// Core player class (advanced usage — direct control)
// ---------------------------------------------------------------------------
export { GuoPlayer } from './composables/usePlayer';

// ---------------------------------------------------------------------------
// Composables
// ---------------------------------------------------------------------------
export { useCurrentLyric } from './composables/useCurrentLyric';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
export { convertSRTorLRCtoCustomJSON, parseLRC, parseSRT } from './utils/lyric';

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
} from './types';
