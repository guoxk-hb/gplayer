// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: {
    html: 'prettier',
  },
  pnpm: true,
  typescript: true,
  vue: true,
  ignores: [
    '**/dist/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/node_modules/**',
    '**/*.jsonc',
    'pnpm-workspace.yaml',
  ],
})
