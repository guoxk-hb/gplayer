// @ts-check
import withNuxt from ".nuxt/eslint.config.mjs";

export default withNuxt(
  // Your custom configs here
  {
    root: true,
    extends: [
      "eslint:recommended",
      "plugin:prettier/recommended", // 使用 Prettier 的推荐配置
    ],
    plugins: ["prettier"],
    rules: {
      "prettier/prettier": "error", // 将 Prettier 的规则设置为错误级别
    },
  },
);
