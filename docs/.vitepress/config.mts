import { defineConfig } from 'vitepress'
import { readFileSync } from 'node:fs'
import { generateSidebar } from 'vitepress-sidebar'
import { RssPlugin } from 'vitepress-plugin-rss'

// ----------------------------------------------------------------------------
// Helpers: read the inline SW registrar at build time (no runtime fetch).
// VitePress renders `head` HTML server-side, so the registrar script is
// inlined directly into every page — the user's first page load triggers
// SW registration immediately.
//
// Note on path resolution: this file lives at docs/.vitepress/config.mts.
// The SW registrar sits one level up at docs/scripts/sw-registrar.js —
// so the relative path is `../scripts/sw-registrar.js`.
// ----------------------------------------------------------------------------
const SW_REGISTRAR = readFileSync(
  new URL('./sw-registrar.js', import.meta.url),
  'utf8',
)

// ----------------------------------------------------------------------------
// JSON-LD: SoftwareApplication schema describing the via54Skills site.
// Schema.org / Google Rich Results understand this for indexing.
// We include this once on every page (VitePress inlines via head[]).
// ----------------------------------------------------------------------------
const JSON_LD_SOFTWARE = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'via54Skills',
  alternateName: 'via54 Skills',
  url: 'https://veawho.github.io/via54Skills/',
  description:
    'Personal Skills repository by veawho for Hermes Agent, Claude Code, OpenClaw, OpenCode, and Codex CLI.',
  inLanguage: ['zh-CN', 'en-US'],
  author: {
    '@type': 'Person',
    name: 'veawho',
    url: 'https://github.com/veawho',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://veawho.github.io/via54Skills/{search_term_string}',
    },
    // Search is via local FlexSearch inside the page; this entrypoint is
    // mostly a hint to search engines, not a working endpoint.
    'query-input': 'required name=search_term_string',
  },
})

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

  // ------------------------------------------------------------------------
  // head: extra HTML injected into every page's <head>.
  //
  // 1. Open Graph + Twitter Card meta: drives link previews in Slack,
  //    Twitter, Discord, LinkedIn. og-image.png (1200×630) is served at
  //    /via54Skills/og-image.png by VitePress's static asset pipeline.
  //
  // 2. Web App Manifest: makes the site installable as a PWA on iOS/Android.
  //    Linked from <link rel="manifest">.
  //
  // 3. JSON-LD: structured data for Google Rich Results / Knowledge Graph.
  //    A WebSite schema with name, description, author, languages.
  //
  // 4. Service worker registrar: inlined at build time, registers
  //    /via54Skills/sw.js on every page load (network-first PWA).
  // ------------------------------------------------------------------------
  head: [
    // Open Graph (Facebook / LinkedIn / Slack / Discord / Telegram / etc.)
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'via54Skills' }],
    ['meta', { property: 'og:title', content: 'via54Skills' }],
    ['meta', {
      property: 'og:description',
      content: 'Personal Skills for Hermes / Claude / OpenClaw / OpenCode / Codex',
    }],
    ['meta', {
      property: 'og:image',
      content: 'https://veawho.github.io/via54Skills/og-image.png',
    }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:locale:alternate', content: 'en_US' }],
    ['meta', { property: 'og:url', content: 'https://veawho.github.io/via54Skills/' }],

    // Twitter Card (X / Twitter)
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'via54Skills' }],
    ['meta', {
      name: 'twitter:description',
      content: 'Personal Skills for Hermes / Claude / OpenClaw / OpenCode / Codex',
    }],
    ['meta', {
      name: 'twitter:image',
      content: 'https://veawho.github.io/via54Skills/og-image.png',
    }],
    ['meta', { name: 'twitter:creator', content: '@veawho' }],

    // Web App Manifest (PWA installability)
    ['link', { rel: 'manifest', href: '/via54Skills/manifest.webmanifest' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'via54Skills' }],

    // JSON-LD (schema.org structured data for Google Rich Results)
    ['script', { type: 'application/ld+json' }, JSON_LD_SOFTWARE],

    // Service worker registrar (inlined at build time)
    ['script', {}, SW_REGISTRAR],
  ],

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