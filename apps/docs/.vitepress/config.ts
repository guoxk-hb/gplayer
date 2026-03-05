import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'GPlayer',
  description:
    'A Vue 3 video player component supporting DASH, HLS, FLV and MP4',
  lang: 'zh-CN',
  base: '/gplayer/',

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'GPlayer',

    nav: [
      { text: '指南', link: '/guide/' },
      { text: '组件', link: '/components/GPlayer' },
      { text: 'GitHub', link: 'https://github.com/guoxk-me/gplayer' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '安装', link: '/guide/installation' },
            { text: '快速开始', link: '/guide/getting-started' },
          ],
        },
      ],
      '/components/': [
        {
          text: '组件',
          items: [{ text: 'GPlayer', link: '/components/GPlayer' }],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/guoxk-me/gplayer' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 guoxk',
    },
  },

  head: [['link', { rel: 'icon', href: '/logo.svg' }]],
})
