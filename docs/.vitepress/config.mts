import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
import { RssPlugin } from 'vitepress-plugin-rss'

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
 *
 * Note: we deliberately do NOT pass `rootGroupLink` to generateSidebar.
 * The plugin's behavior is that rootGroupText becomes a clickable
 * link to rootGroupLink, which would duplicate our explicit Home entry.
 * Passing rootGroupText without rootGroupLink produces a plain text
 * heading for the skills group instead.
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
  const items = generateSidebar({
    documentRootPath: opts.documentRootPath,
    scanStartPath: opts.scanStartPath,
    resolvePath: opts.resolvePath,
    basePath: opts.basePath,
    rootGroupText: opts.skillsGroupText,
    // No rootGroupLink → rootGroupText becomes a non-clickable header.
    capitalizeFirst: false,        // keep filenames as-is (lowercase + hyphen)
    hyphenToSpace: false,
    underscoreToSpace: false,
    sortMenusByName: true,         // alphabetize: via54goport before via54merge
    collapsed: false,
  }) as Array<Record<string, any>>

  // Prepend a "Home" group above the auto-generated Skills group.
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

  // Sitemap (VitePress 1.x built-in): generates dist/sitemap.xml at build
  // time. host=GitHub Pages URL with the repo path included.
  // Sitemap is read by Google/Bing/DuckDuckGo for indexing.
  sitemap: {
    hostname: 'https://veawho.github.io/via54Skills/',
  },

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

  // vite-plugin: RSS feed generator.
  // Produces dist/feed.rss during build. The plugin also injects an
  // RSS icon into the navbar's socialLinks automatically.
  //
  // Items come from any markdown page that has frontmatter `date:` or
  // `published:`. SKILL.md files currently don't, so the RSS feed will
  // be sparse — that's fine for a docs site.
  //
  // baseUrl MUST be just the hostname — vitepress-plugin-rss reads
  // VitePress's `base` config internally and prepends it to baseUrl.
  // Setting baseUrl to ".../via54Skills/" produced double-prefixed
  // links like `https://.../via54Skills//via54Skills/en/` in the feed.
  vite: {
    plugins: [
      RssPlugin({
        title: 'via54Skills',
        baseUrl: 'https://veawho.github.io',
        copyright: 'Copyright (c) 2026 veawho',
      }),
    ],
  },
})