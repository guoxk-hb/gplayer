# 安装

## 环境要求

- Node.js >= 18
- Vue >= 3.3

## 安装包

```bash
# npm
npm install @guoxk/gplayer

# pnpm
pnpm add @guoxk/gplayer

# yarn
yarn add @guoxk/gplayer
```

## 按需安装播放器库

GPlayer 将 hls.js / dashjs / flv.js 设为**可选 peer dependency**，只需安装你实际用到的格式对应的库：

| 视频格式   | 需要安装             |
| ---------- | -------------------- |
| MP4        | 无（浏览器原生支持） |
| M3U8 / HLS | `npm install hls.js` |
| MPD / DASH | `npm install dashjs` |
| FLV        | `npm install flv.js` |

例如，如果你只播放 MP4 和 M3U8：

```bash
npm install @guoxk/gplayer hls.js
```

## 样式说明

播放器控件样式由包内 CSS 提供。应用入口需要引入一次：

```ts
import '@guoxk/gplayer/style.css'
```

`GVideo` 不依赖 Tailwind 或 Nuxt Icon；demo 页面里的测试面板和说明文案属于 demo 自己的界面。
