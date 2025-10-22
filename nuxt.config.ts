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
        // { rel: 'icon', type: 'image/png', href: '/favicon-16x16.png', sizes: '16x16' },
        // { rel: 'icon', type: 'image/png', href: '/favicon-32x32.png', sizes: '32x32' },
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'apple-touch-icon', href: '/logo.png' },
        // { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        // { rel: 'android-chrome-192x192', href: '/android-chrome-192x192.png' },
        // { rel: 'android-chrome-512x512', href: '/android-chrome-512x512.png' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '通过 Vue + Nuxt 编写的Web视频播放器，支持mpd、m3u8、flv及Mp4格式。' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
    },
  },
  modules: [
    '@nuxt/eslint',
    // '@nuxt/fonts',
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
  // future: {
  //   compatibilityVersion: 4,
  // },
  icon: {
    mode: 'css',
    cssLayer: 'base',
  },
})
