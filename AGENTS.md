# gplayer Monorepo

`@guoxk/gplayer` — Vue 3 video player library (MP4, HLS/M3U8, DASH/MPD, FLV). pnpm workspace monorepo with catalog version management.

## Monorepo layout

```
gplayer/
├── packages/gplayer/     # @guoxk/gplayer — npm library (entry: src/index.ts)
│   ├── src/
│   │   ├── components/   # GPlayer.vue, GVideo.vue, icons/
│   │   ├── composables/  # usePlayer, useCurrentLyric
│   │   ├── styles/       # index.css → dist/style.css (copied at build time)
│   │   ├── types/        # ALL public types defined here → re-exported by src/index.ts
│   │   ├── utils/        # lyric parsing (SRT, LRC)
│   │   └── index.ts      # package entry — all public API
│   └── tsdown.config.ts  # build: esm + cjs + .d.ts
├── apps/
│   ├── demo/             # Nuxt 4 demo app (@demo/demo)
│   └── docs/             # VitePress docs (@demo/docs)
├── pnpm-workspace.yaml   # workspace packages + catalog versions
├── eslint.config.mjs     # @antfu/eslint-config (typescript + vue + pnpm)
└── .prettierrc           # semi:false, singleQuote, printWidth:80, trailingComma:all
```

## Commands

```bash
pnpm dev:demo          # Nuxt demo (apps/demo)
pnpm dev:docs          # VitePress docs (apps/docs)
pnpm build:lib         # Build @guoxk/gplayer → dist/
pnpm build:demo        # Build demo
pnpm build:docs        # Build docs
pnpm lint              # ESLint check (global)
pnpm typecheck         # tsc --noEmit on @guoxk/gplayer + @demo/demo only (NOT docs)
```

Single-package commands:

```bash
pnpm --filter @guoxk/gplayer build      # build lib
pnpm --filter @guoxk/gplayer dev        # watch mode rebuild
pnpm --filter @guoxk/gplayer typecheck  # tsc --noEmit on lib only
```

## Architecture notes

- **Plugin API**: default export is `GVideoPlugin`. Usage: `app.use(GVideoPlugin)` registers `<GVideo>` and `<GPlayer>` globally. `GPlayerPlugin` is also exported as an alias.
- **CSS**: consumers must `import '@guoxk/gplayer/style.css'` separately. The build hook copies `src/styles/index.css` → `dist/style.css`.
- **Peer deps**: `vue`, `@vueuse/core`, `hls.js`, `dashjs`, `flv.js` are external (not bundled). `hls.js`/`dashjs`/`flv.js` are marked optional peers.

## Key conventions

- **Types**: define ALL public types in `packages/gplayer/src/types/index.ts`. Re-export via `src/index.ts` using `export type { ... }`. Never export types directly from components or composables.
- **Vue components**: `<script setup lang="ts">` + Composition API only. Props use `defineProps<T>()`. No Options API.
- **Composables**: `use` prefix, placed in `src/composables/`.
- **Dependencies**: update `pnpm-workspace.yaml` catalog first, then reference as `"dep": "catalog:"` in package.json.
- **Prettier**: `semi: false`, `singleQuote: true`, `printWidth: 80`, `trailingComma: "all"`.
- **Commits**: conventional commits (`feat`, `fix`, etc.), enforced by commitlint + husky.
- **Branches**: `dev` (default) and `main`. CI triggers on both. Tags `v*.*.*` trigger npm publish.

## Gotchas

- **Prettier semi is FALSE** — ESLint + prettier cooperate through `eslint-plugin-prettier`. Don't add semicolons.
- **`typecheck` excludes docs** — the `apps/docs` package has no typecheck script.
- **Docs deploy requires lib first**: `pnpm build:lib` then `pnpm build:docs` (CI does this; VitePress imports `@guoxk/gplayer` as workspace dep).
- **tsdown build hook**: renames hash-suffixed `.d.ts` / `.d.cts` to fixed names (`index.d.ts`, `index.d.cts`) and copies CSS. Changing the entry filename without updating the hook will break the types export.
- **`.npmrc`**: `shamefully-hoist=true`, `strict-peer-dependencies=false`, `auto-install-peers=true`. These are needed for the monorepo to resolve correctly.
- **No test suite** — verify changes by running `pnpm lint && pnpm typecheck && pnpm build:lib`.
