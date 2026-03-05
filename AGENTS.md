# gplayer Monorepo

## 项目概述

`@guoxk/gplayer` 是一个 Vue 3 视频播放器组件库，支持 MPD/DASH、M3U8/HLS、FLV 和 MP4 格式，通过 peer dependencies 按需集成 `hls.js`、`dashjs`、`flv.js`。

本仓库为 **pnpm monorepo**，使用 pnpm workspace 管理多包依赖，catalog 统一管理版本号。

---

## Monorepo 结构

```text
gplayer/
├── packages/
│   └── gplayer/          # 核心组件库 (@guoxk/gplayer)
│       ├── src/
│       │   ├── components/   # Vue SFC 组件 (GPlayer.vue 等)
│       │   ├── composables/  # Composition API (usePlayer, useCurrentLyric)
│       │   ├── styles/       # CSS 样式 (index.css → dist/style.css)
│       │   ├── types/        # 所有 TypeScript 类型定义 (统一从 types/index.ts 导出)
│       │   ├── utils/        # 工具函数 (lyric 解析等)
│       │   └── index.ts      # 包入口，所有公开 API 从此导出
│       └── tsdown.config.ts  # 构建配置 (esm + cjs 双格式)
├── apps/
│   ├── demo/             # Nuxt 4 演示应用 (@demo/demo)
│   └── docs/             # VitePress 文档站点 (@demo/docs)
├── .opencode/            # OpenCode 项目配置
├── pnpm-workspace.yaml   # workspace 包声明 + catalog 版本锁定
├── eslint.config.mjs     # @antfu/eslint-config (typescript + vue + pnpm)
├── .prettierrc           # Prettier 配置
└── commitlint.config.cjs # commitlint conventional commit 规则
```

---

## 技术栈

| 工具                    | 版本/说明                                                  |
| ----------------------- | ---------------------------------------------------------- |
| **Vue**                 | 3.x，全部使用 `<script setup>` + Composition API           |
| **TypeScript**          | strict 模式，`target: ES2020`，`moduleResolution: bundler` |
| **pnpm**                | workspace monorepo，catalog 统一版本                       |
| **tsdown**              | 组件库构建，输出 ESM + CJS 双格式 + `.d.ts` 类型声明       |
| **Nuxt**                | 4.x（apps/demo）                                           |
| **VitePress**           | 1.x（apps/docs）                                           |
| **ESLint**              | `@antfu/eslint-config`，开启 typescript + vue + pnpm       |
| **Prettier**            | 格式化 HTML，与 ESLint 配合使用                            |
| **Husky + lint-staged** | 提交前自动 lint                                            |
| **commitlint**          | conventional commits 规范                                  |

---

## 代码规范

### TypeScript

- 始终开启 `strict: true`
- 所有类型定义集中在 `packages/gplayer/src/types/index.ts`，通过 `src/index.ts` 统一再导出
- 不使用 `any`，优先 `unknown` + 类型收窄
- 组件 props 使用 `defineProps<T>()` 泛型写法

### Vue 组件

- 统一使用 `<script setup lang="ts">` + Composition API
- 不使用 Options API
- composables 放在 `src/composables/` 目录，以 `use` 前缀命名

### Prettier（.prettierrc）

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

### ESLint

- 基于 `@antfu/eslint-config`，已启用 `typescript`、`vue`、`pnpm` 规则
- 忽略：`**/dist/**`、`**/.nuxt/**`、`**/.output/**`、`**/node_modules/**`
- 修改文件后运行：`pnpm lint`

### 提交规范（commitlint）

格式：`<type>(<scope>): <subject>`

允许的 type：`feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore` | `revert` | `merge` | `bug`

示例：

- `feat(player): add subtitle auto-detection`
- `fix(hls): handle stream reconnect on error`
- `docs: update API reference for SubtitleLoader`

---

## 常用命令

```bash
# 开发
pnpm dev:demo          # 启动 Nuxt demo (apps/demo)
pnpm dev:docs          # 启动 VitePress 文档 (apps/docs)

# 构建
pnpm build:lib         # 构建组件库 packages/gplayer → dist/
pnpm build:demo        # 构建 demo 应用
pnpm build:docs        # 构建文档站点

# 质量检查
pnpm lint              # ESLint 检查（全局）
pnpm typecheck         # TypeScript 类型检查（全局）

# 单包操作（使用 --filter）
pnpm --filter @guoxk/gplayer build
pnpm --filter @guoxk/gplayer dev    # watch 模式
```

---

## 关键约定

### 组件库构建

- 入口：`packages/gplayer/src/index.ts`
- 构建工具：`tsdown`，格式 `esm + cjs`，platform `neutral`
- peer deps（`vue`、`@vueuse/core`、`hls.js`、`dashjs`、`flv.js`）**不打包**，标记为 `external`
- CSS 构建后需手动从 `src/styles/index.css` 复制到 `dist/style.css`（tsdown hook 已处理）
- 使用者需额外 `import '@guoxk/gplayer/style.css'`

### 类型导出

- 所有公开类型从 `packages/gplayer/src/types/index.ts` 定义
- 通过 `packages/gplayer/src/index.ts` 的 `export type { ... }` 统一再导出
- **不要**在组件或 composable 文件中直接 export type

### 依赖管理

- 新增依赖先更新 `pnpm-workspace.yaml` 的 `catalog:` 字段统一版本
- 子包中用 `"dep": "catalog:"` 引用 catalog 版本
- 避免将 `hls.js`、`dashjs`、`flv.js` 从 devDependencies 以外的位置引入（它们是可选 peer deps）

### apps/demo（Nuxt 4）

- 使用 `@guoxk/gplayer` 本地 workspace 包（通过 pnpm workspace 链接）
- Nuxt 配置在 `apps/demo/nuxt.config.ts`

### apps/docs（VitePress）

- 文档源码在 `apps/docs/`，包含 `guide/` 和 `index.md`
- VitePress 配置在 `apps/docs/.vitepress/`
