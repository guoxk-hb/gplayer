// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
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
  future: {
    compatibilityVersion: 4,
  },
  icon: {
    mode: 'css',
    cssLayer: 'base',
  },
})
