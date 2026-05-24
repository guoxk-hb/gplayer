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

当前阶段 `GVideo` 按 experiment 版本运行，控件样式来自组件内的 Tailwind class 和 Nuxt Icon。
不要同时引入 `@guoxk/gplayer/style.css`，否则会和 experiment 版 `.guo-*` 类名产生样式冲突。

在 Nuxt demo 这类 monorepo 场景中，需要确保 Tailwind 扫描 `packages/gplayer/src/**/*.{vue,js,ts}`。
