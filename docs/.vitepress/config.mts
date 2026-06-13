import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'

// Phase 2 deploy to GitHub Pages — `base` MUST match the repo name
// (https://veawho.github.io/via54Skills/). When developing locally
// (`npm run docs:dev`), VitePress also respects this base, so sub-route
// links render as /via54Skills/zh/... in the dev URL bar — that is
// expected. Phase 3 (custom domain) will change this to '/'.

// ----------------------------------------------------------------------------
// Sidebar auto-generation via vitepress-sidebar (v1.36+).
//
// The plugin's `withSidebar()` wrapper assumes a single sidebar layout,
// but we have two locales (zh/en) with locale-specific group titles.
// So we call `generateSidebar()` directly, twice — once per locale —
// then merge into the per-locale VitePress config.
//
// Skill discovery model: the plugin scans `docs/<locale>/skills/*.md`
// and produces a flat ordered list. To get a grouped layout with
// "开始 / Get started" + "Skills" sections, we wrap each result with
// `rootGroupText: '开始'` (zh) / `'Get started'` (en) and append a
// leading manual "Home" entry.
//
// When a new skill is added as `docs/zh/skills/via54foo.md` (and its
// `en` counterpart), the sidebar updates on next build with NO config
// change.
// ----------------------------------------------------------------------------

/**
 * Build a sidebar for a single locale by combining:
 *   - a leading "Home" entry (the locale's `index.md`)
 *   - the auto-scanned list of skills (driven by `generateSidebar`)
 */
function buildLocaleSidebar(opts: {
  documentRootPath: string
  scanStartPath: string
  resolvePath: string
  basePath: string
  homeLink: string
  homeText: string
  rootGroupText: string
  skillsGroupText: string
}) {
  // generateSidebar returns an array of (group) entries.
  // We pass `rootGroupText` so all skills fall under one "Skills" group,
  // and we capture the resolved base path so all links are rooted at /<locale>/.
  const items = generateSidebar({
    documentRootPath: opts.documentRootPath,
    scanStartPath: opts.scanStartPath,
    resolvePath: opts.resolvePath,
    basePath: opts.basePath,
    rootGroupText: opts.rootGroupText,
    rootGroupLink: opts.homeLink,
    capitalizeFirst: false,        // keep filenames as-is (lowercase + hyphen)
    hyphenToSpace: false,
    underscoreToSpace: false,
    sortMenusByName: true,         // alphabetize: via54goport before via54merge
    collapsed: false,
  }) as Array<Record<string, any>>

  // Prepend a "Home" link so the locale index is reachable from sidebar.
  // We give it its own group above the auto-generated Skills group.
  return [
    {
      text: opts.rootGroupText, // "开始" / "Get started"
      items: [{ text: opts.homeText, link: opts.homeLink }],
    },
    ...items,
  ]
}

const zhSidebar = buildLocaleSidebar({
  documentRootPath: '/docs',
  scanStartPath: 'zh/skills',
  resolvePath: 'zh/skills',
  basePath: '/zh/',
  homeLink: '/zh/',
  homeText: '首页',
  rootGroupText: '开始',
  skillsGroupText: 'Skills',
})

const enSidebar = buildLocaleSidebar({
  documentRootPath: '/docs',
  scanStartPath: 'en/skills',
  resolvePath: 'en/skills',
  basePath: '/en/',
  homeLink: '/en/',
  homeText: 'Home',
  rootGroupText: 'Get started',
  skillsGroupText: 'Skills',
})

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
          '/zh/': zhSidebar,
          '/zh/skills/': zhSidebar,
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
          '/en/': enSidebar,
          '/en/skills/': enSidebar,
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/veawho/via54Skills' },
        ],
        search: { provider: 'local' },
      },
    },
  },
})