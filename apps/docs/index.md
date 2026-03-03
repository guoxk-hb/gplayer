---
layout: home

hero:
  name: GPlayer
  text: Vue 3 视频播放器组件
  tagline: 支持 DASH/MPD、HLS/M3U8、FLV、MP4，开箱即用，零强制依赖
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看 GitHub
      link: https://github.com/guoxk/gplayer

features:
  - icon: 🎬
    title: 多格式支持
    details: 原生支持 MP4，可选集成 hls.js（M3U8）、dashjs（MPD/DASH）、flv.js（FLV）
  - icon: 🎨
    title: 无 Tailwind 依赖
    details: 样式完全基于原生 CSS + CSS 变量，支持主题定制，不强制安装任何 CSS 框架
  - icon: 📝
    title: 双语字幕
    details: 支持主字幕 / 副字幕同时显示，字体大小随播放器尺寸自适应
  - icon: 🔌
    title: Vue 插件
    details: 支持 app.use() 全局注册，也可按需引入单个组件
  - icon: 📦
    title: 轻量核心
    details: 播放器相关库（hls.js / dashjs / flv.js）均为可选 peer dep，按需安装
  - icon: 🛠
    title: TypeScript
    details: 完整的 TypeScript 类型声明，IDE 友好
---
