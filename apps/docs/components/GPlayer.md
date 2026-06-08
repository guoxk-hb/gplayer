# GVideo 组件

`GVideo` 是从 experiment 分支迁移后的主组件名；`GPlayer` 仍作为兼容别名导出。

## Props

| Prop              | 类型             | 默认值   | 说明                                        |
| ----------------- | ---------------- | -------- | ------------------------------------------- |
| `videoList`       | `VideoInfo[]`    | `[]`     | 视频列表，多个视频时显示上一集 / 下一集按钮 |
| `conterols`       | `boolean`        | `true`   | 是否显示控制栏（保留 experiment 旧拼写）    |
| `controls`        | `boolean`        | —        | `conterols` 的兼容别名，传入时优先生效      |
| `muted`           | `boolean`        | `true`   | 初始是否静音                                |
| `autoplay`        | `boolean`        | `false`  | 是否自动播放                                |
| `loop`            | `boolean`        | `false`  | 是否循环播放                                |
| `preload`         | `string`         | `'auto'` | 原生 `<video>` 的 preload 属性值            |
| `volume`          | `number`         | `1`      | 初始音量（0 ~ 1）                           |
| `subtitlesButton` | `boolean`        | `true`   | 是否显示字幕按钮                            |
| `subtitleLoader`  | `SubtitleLoader` | —        | 字幕异步加载函数，见下方说明                |

## SubtitleLoader

```ts
type SubtitleLoader = (lang: string, name: string) => Promise<Subtitle>
```

- `lang`：ISO 639-3 语言代码（如 `'cmn'`、`'kor'`、`'eng'`）
- `name`：视频名称，对应 `VideoInfo.name`
- 返回值：`Subtitle` 对象（gplayer 内部字幕格式）

## 类型定义

### VideoInfo

```ts
interface VideoInfo {
  name: string // 视频唯一名称标识
  url: string // 视频 URL
  type: 'mpd' | 'm3u8' | 'mp4' | 'flv' // 视频格式
  subtitles: VideoSubtitle[] // 可用字幕列表
}
```

### VideoSubtitle

```ts
interface VideoSubtitle {
  lang: string // ISO 639-3 语言代码
  label: string // 用户可见的语言标签（如 '中文'、'English'）
}
```

### Subtitle

```ts
interface Subtitle {
  lang: string // ISO 639-3 语言代码
  body: Lyric[] // 字幕条目数组
  type: 'subtitle'
  version: string
  // 样式字段（可为 null，使用 CSS 变量控制）
  fontSize: string | null
  fontColor: string | null
  backgroundAlpha: string | null
  backgroundColor: string | null
  Stroke: string
}
```

### Lyric

```ts
interface Lyric {
  from: number // 开始时间（秒）
  to: number // 结束时间（秒）
  content: string // 字幕内容
  location: number // 位置（2 = 底部）
}
```

## 工具函数

### parseSRT

将 SRT 字幕文本转换为 `Subtitle` 对象：

```ts
import { parseSRT } from '@guoxk/gplayer'

const subtitle = parseSRT(srtText, 'cmn')
```

### parseLRC

将 LRC 歌词文本转换为 `Subtitle` 对象：

```ts
import { parseLRC } from '@guoxk/gplayer'

const subtitle = parseLRC(lrcText, 'cmn')
```

### useCurrentLyric

根据当前播放时间获取当前字幕内容（composable）：

```ts
import { useCurrentLyric } from '@guoxk/gplayer'

const text = useCurrentLyric(subtitle.body, currentTimeMs)
```

## 样式

应用入口引入一次播放器样式：

```ts
import '@guoxk/gplayer/style.css'
```

`GVideo` 本体只包含播放器 UI，不包含 demo 调试面板、说明文案、Tailwind class 或 Nuxt Icon 依赖。
