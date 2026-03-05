// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  app: {
    head: {
      viewport: 'width=device-width,initial-scale=1',
      link: [
        { rel: 'icon', href: '/logo.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', href: '/logo.png', sizes: '32x32' },
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'apple-touch-icon', href: '/logo.png' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'gplayer demo — Vue 3 视频播放器组件示例',
        },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent',
        },
      ],
    },
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
  ],
  plugins: [
    { src: '~/plugins/hls', mode: 'client' },
    { src: '~/plugins/flv', mode: 'client' },
    { src: '~/plugins/dash', mode: 'client' },
  ],
  icon: {
    mode: 'css',
    cssLayer: 'base',
  },
})
