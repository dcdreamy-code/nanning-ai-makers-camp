// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages 项目页挂在子路径 /<repo>/ 下，必须让 base 与实际路径一致，
// 否则构建出的 /assets/... 绝对路径会 404。
// EdgeOne 部署在域名根目录，base 用 '/'。
const isGitHubActions = !!process.env.GITHUB_ACTIONS;

export default defineConfig({
  site: isGitHubActions
    ? 'https://dcdreamy-code.github.io'
    : 'https://nanning-ai-makers-camp.pages.dev',
  base: isGitHubActions ? '/nanning-ai-makers-camp' : '/',
  trailingSlash: 'never',
  build: {
    inlineStylesheets: 'auto',
    assets: 'assets'
  },
  vite: {
    build: {
      assetsInlineLimit: 0
    }
  }
});
