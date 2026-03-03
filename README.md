# @guoxk/gplayer

A Vue 3 video player component supporting DASH/MPD, HLS/M3U8, FLV and MP4.

## Features

- Multiple formats: MP4 (native), M3U8/HLS (via hls.js), MPD/DASH (via dashjs), FLV (via flv.js)
- Dual subtitles with auto font-size
- Quality switching (HLS & DASH)
- Fullscreen & Picture-in-Picture
- Draggable progress bar
- Volume control
- Playlist support
- Pure CSS with CSS variables — no Tailwind required
- TypeScript ready

## Install

```bash
npm install @guoxk/gplayer
# optional peer deps based on your formats
npm install hls.js      # for M3U8/HLS
npm install dashjs      # for MPD/DASH
npm install flv.js      # for FLV
```

## Usage

```ts
// main.ts
import GPlayerPlugin from '@guoxk/gplayer';
import '@guoxk/gplayer/style.css';

app.use(GPlayerPlugin);
```

```vue
<template>
  <GPlayer :video-list="videoList" :subtitle-loader="subtitleLoader" />
</template>
```

## Repository Structure

```
gplayer/
├── packages/
│   └── gplayer/          # @guoxk/gplayer — npm library
├── apps/
│   ├── demo/             # Nuxt demo application
│   └── docs/             # VitePress documentation
└── .github/workflows/    # CI & release
```

## Documentation

→ [https://guoxk.github.io/gplayer](https://guoxk.github.io/gplayer)

## License

MIT
