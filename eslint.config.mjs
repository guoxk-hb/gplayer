// @ts-check
import antfu from '@antfu/eslint-config';
import nuxt from './.nuxt/eslint.config.mjs';

export default antfu({
  formatters: {
    html: 'prettier',
  },
  pnpm: true,
}).append(nuxt());
