import { defineConfig } from 'vitepress'

// Phase 2 deploy to GitHub Pages — `base` MUST match the repo name
// (https://veawho.github.io/via54Skills/). When developing locally
// (`npm run docs:dev`), VitePress also respects this base, so sub-route
// links render as /via54Skills/zh/... in the dev URL bar — that is
// expected. Phase 3 (custom domain) will change this to '/'.

export default defineConfig({
  title: 'via54Skills',
  description: 'Personal Skills by veawho — Hermes / Claude / OpenClaw / OpenCode / Codex',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  base: '/via54Skills/',

  // Disable dead-link check: README.md / README.en.md are referenced as
  // string literals inside rule descriptions and Python code examples,
  // not as actual navigable links in the VitePress-rendered site.
  ignoreDeadLinks: true,

  // i18n: 中文 (default) + English
  locales: {
    'zh-CN': {
      label: '中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/' },
          { text: 'Skills', link: '/zh/skills/via54merge' },
          { text: 'English', link: '/en/' },
        ],
        sidebar: {
          '/zh/': [
            {
              text: '开始',
              items: [
                { text: '首页', link: '/zh/' },
              ],
            },
            {
              text: 'Skills',
              items: [
                { text: 'via54merge', link: '/zh/skills/via54merge' },
                { text: 'via54goport', link: '/zh/skills/via54goport' },
              ],
            },
          ],
          '/zh/skills/': [
            {
              text: 'Skills',
              items: [
                { text: 'via54merge', link: '/zh/skills/via54merge' },
                { text: 'via54goport', link: '/zh/skills/via54goport' },
              ],
            },
          ],
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/veawho/via54Skills' },
        ],
        search: { provider: 'local' },
      },
    },
    'en': {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Skills', link: '/en/skills/via54merge' },
          { text: '中文', link: '/zh/' },
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Get started',
              items: [
                { text: 'Home', link: '/en/' },
              ],
            },
            {
              text: 'Skills',
              items: [
                { text: 'via54merge', link: '/en/skills/via54merge' },
                { text: 'via54goport', link: '/en/skills/via54goport' },
              ],
            },
          ],
          '/en/skills/': [
            {
              text: 'Skills',
              items: [
                { text: 'via54merge', link: '/en/skills/via54merge' },
                { text: 'via54goport', link: '/en/skills/via54goport' },
              ],
            },
          ],
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/veawho/via54Skills' },
        ],
        search: { provider: 'local' },
      },
    },
  },
})