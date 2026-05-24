# 快速开始

## 全局注册（推荐）

在 `main.ts` 中使用 Vue 插件方式注册，之后在任意组件中直接使用 `<GVideo>`：

```ts
import GVideoPlugin from '@guoxk/gplayer'
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.use(GVideoPlugin)
app.mount('#app')
```

## 按需引入

```vue
<script setup lang="ts">
import { GVideo } from '@guoxk/gplayer'
</script>
```

## 基础用法：播放单个 MP4

```vue
<script setup lang="ts">
import type { VideoInfo } from '@guoxk/gplayer'
import { GVideo } from '@guoxk/gplayer'

const videoList: VideoInfo[] = [
  {
    name: 'my-video',
    url: 'https://example.com/video.mp4',
    type: 'mp4',
    subtitles: [],
  },
]
</script>

<template>
  <GVideo :video-list="videoList" />
</template>
```

## 播放 HLS (M3U8)

```vue
<script setup lang="ts">
import type { VideoInfo } from '@guoxk/gplayer'

const videoList: VideoInfo[] = [
  {
    name: 'live',
    url: 'https://example.com/live/index.m3u8',
    type: 'm3u8',
    subtitles: [],
  },
]
</script>
```

> 需要先安装 `hls.js`：`npm install hls.js`

## 带字幕的播放

字幕通过 `subtitleLoader` prop 异步加载，由你的应用决定如何获取数据：

```vue
<script setup lang="ts">
import type { Subtitle, SubtitleLoader, VideoInfo } from '@guoxk/gplayer'
import { GVideo } from '@guoxk/gplayer'

const videoList: VideoInfo[] = [
  {
    name: 'my-video',
    url: '/video/output.mpd',
    type: 'mpd',
    subtitles: [
      { lang: 'cmn', label: '中文' },
      { lang: 'eng', label: 'English' },
    ],
  },
]

// 实现 SubtitleLoader — 从你的 API 获取字幕数据
const subtitleLoader: SubtitleLoader = async (
  lang,
  name,
): Promise<Subtitle> => {
  const res = await fetch(`/api/subtitle?lang=${lang}&name=${name}`)
  return res.json()
}
</script>

<template>
  <GVideo :video-list="videoList" :subtitle-loader="subtitleLoader" />
</template>
```

## 主题自定义

覆盖 CSS 变量即可自定义主题色：

```css
:root {
  --gplayer-primary: #10b981; /* 主色（进度条 / 选中状态）*/
  --gplayer-primary-light: #34d399;
  --gplayer-primary-lighter: #a7f3d0;
  --gplayer-bg-overlay: rgba(0, 0, 0, 0.6); /* 控制栏背景 */
}
```
