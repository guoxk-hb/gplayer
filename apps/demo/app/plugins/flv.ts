import flvjs from 'flv.js'

export default defineNuxtPlugin((_nuxtApp) => {
  // 将包挂载到 Nuxt 应用实例上
  return {
    provide: {
      flvjs,
    },
  }
})
