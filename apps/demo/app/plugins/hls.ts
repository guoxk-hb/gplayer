import Hls from 'hls.js'

export default defineNuxtPlugin((_nuxtApp) => {
  return {
    provide: {
      Hls,
    },
  }
})
