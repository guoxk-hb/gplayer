# 介绍

GPlayer 是一个基于 **Vue 3** 的视频播放器组件，封装了常用的播放器功能，支持多种视频格式。

## 功能特性

- **多格式支持**：MP4（原生）、M3U8/HLS（via hls.js）、MPD/DASH（via dashjs）、FLV（via flv.js）
- **双语字幕**：支持主 / 副两路字幕同时显示，字体大小随播放器容器自适应
- **画质切换**：HLS / DASH 格式支持运行时切换清晰度（流畅 / 高清 / 超清 / 4K）
- **全屏 & 画中画**：全平台兼容的全屏和画中画模式
- **进度条拖拽**：支持点击跳转和拖拽定位
- **音量控制**：hover 展开音量滑块，支持静音切换
- **播放列表**：传入 `videoList` 即可支持上一集 / 下一集切换
- **纯 CSS 主题**：通过 CSS 变量自定义主题色

## 技术栈

| 层        | 技术                                       |
| --------- | ------------------------------------------ |
| 框架      | Vue 3 (Composition API + `<script setup>`) |
| 状态      | `reactive()`                               |
| 鼠标检测  | `@vueuse/core` → `useMouseInElement`       |
| HLS 播放  | `hls.js`（可选 peer dep）                  |
| DASH 播放 | `dashjs`（可选 peer dep）                  |
| FLV 播放  | `flv.js`（可选 peer dep）                  |
| 打包      | `tsdown` (Rolldown)                        |

## 许可证

[MIT](https://github.com/guoxk/gplayer/blob/main/LICENSE)
