import Hls from 'hls.js'

export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      Hls,
    },
  }
})
