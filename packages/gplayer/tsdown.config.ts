import { copyFileSync, mkdirSync, readdirSync, renameSync } from 'node:fs'
import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  external: ['vue', '@vueuse/core', 'hls.js', 'dashjs', 'flv.js'],
  plugins: [Vue({ isProduction: true })],
  dts: {
    vue: true,
  },
  clean: true,
  hooks: {
    'build:done': () => {
      mkdirSync('dist', { recursive: true })

      // Copy CSS to dist/
      copyFileSync('src/styles/index.css', 'dist/style.css')
      console.log('[gplayer] Copied src/styles/index.css → dist/style.css')

      // Rename hash-named .d.ts / .d.cts to fixed names expected by package.json
      const files = readdirSync('dist')
      for (const f of files) {
        if (f.endsWith('.d.ts') && f !== 'index.d.ts') {
          renameSync(`dist/${f}`, 'dist/index.d.ts')
          console.log(`[gplayer] Renamed ${f} → index.d.ts`)
        }
        if (f.endsWith('.d.cts') && f !== 'index.d.cts') {
          renameSync(`dist/${f}`, 'dist/index.d.cts')
          console.log(`[gplayer] Renamed ${f} → index.d.cts`)
        }
      }
    },
  },
})
