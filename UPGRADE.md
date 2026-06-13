# SSG Upgrade Guide — VitePress / Docusaurus / Deployment

> **Audience**: veawho (the repo owner) running on a primary dev machine, plus any operator who wants to deploy `via54skills.dev`. This document is the full end-to-end playbook: install → configure → preview → deploy → maintain. Phases are progressive; do not skip a phase's validation gate.
>
> **Status**: Phase 0 (decision) only — Phases 1-4 not yet executed in this repo. A Mac mini has run a Phase 1 dry install for verification (see Phase 1, "Mini dry-run results").
>
> **Read time**: ~25 min. **Execute time (Phase 1 only)**: ~30 min on any machine with Node ≥ 18 and ~10 GB free disk.

---

## 📑 Table of Contents

- [Phase 0 — Decide SSG vs Stay on Markdown](#phase-0--decide-ssg-vs-stay-on-markdown)
- [Phase 1 — VitePress Local Preview](#phase-1--vitepress-local-preview)
- [Phase 2 — Production Build + Deploy to GitHub Pages](#phase-2--production-build--deploy-to-github-pages)
- [Phase 3 — Custom Domain (via54skills.dev)](#phase-3--custom-domain-via54skillsdev)
- [Phase 4 — Migrate to Docusaurus (only if needed)](#phase-4--migrate-to-docusaurus-only-if-needed)
- [Alternative Deployment Targets](#alternative-deployment-targets)
- [CI / CD Reference](#ci--cd-reference)
- [Rollback Procedure](#rollback-procedure)
- [Mini dry-run results (Phase 1 sanity check)](#mini-dry-run-results-phase-1-sanity-check)
- [Troubleshooting](#troubleshooting)

---

## Phase 0 — Decide SSG vs Stay on Markdown

### Trigger matrix

Stay on plain Markdown **README.md / README.en.md / SKILL.md** as long as **all** of these are true:

- [ ] Fewer than 5 skills in the repo.
- [ ] No user has asked for full-text search.
- [ ] No blog / tutorial / changelog content planned.
- [ ] No need for sidebar navigation.
- [ ] No need for a custom domain (e.g. `via54skills.dev`).

Migrate to a Static Site Generator (SSG) when **any** of these is true:

- [ ] ≥ 5 skills, or expected to grow past 10 in the next 6 months.
- [ ] Users are asking "which skill does X?" — search is now a feature.
- [ ] Sidebar / table-of-contents needs to scale beyond a manual anchor list.
- [ ] You want a memorable URL (`via54skills.dev/skills/via54merge`) instead of `github.com/veawho/via54Skills/blob/main/via54merge/SKILL.md`.
- [ ] You want dark-mode / theme / branding customization.

### Decision

**Recommendation: VitePress** for via54Skills.

| Reason | Detail |
|---|---|
| Light footprint | `node_modules` ≈ 250 MB (vs Docusaurus ≈ 400 MB) |
| Fast build | Cold 5–30 s, hot < 1 s |
| Native i18n | Built-in `locales` config, locale switcher in navbar |
| Single-file content | `.md` per page (Docusaurus uses MDX = Markdown + JSX) |
| Cheap CDN deploy | `dist/` is plain static files — works on GitHub Pages, Cloudflare Pages, S3, Netlify, Vercel, even `python -m http.server` |

Docusaurus only wins if you need: blog plugin, versioned docs, MDX components. None of those apply to via54Skills today.

---

## Phase 1 — VitePress Local Preview

### Goal

A working `npm run docs:dev` server on `http://localhost:5173` that renders all skills with a sidebar, search, and language switcher. No deployment yet — this phase is **preview-only**.

### Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| Node.js | 18.0 | 20 LTS or 22 LTS |
| npm | 9.0 | 10.x |
| Free disk | 1 GB | 5 GB |
| OS | macOS / Linux / Windows | macOS / Linux |

Verify your environment:

```bash
node --version    # expect v18+ (v22.22.3 verified on Mac mini 2026-06)
npm --version     # expect 9+ (10.9.8 verified)
df -h .           # ≥ 1 GB free
```

### Step 1.1 — Initialize VitePress

In the repo root:

```bash
cd /Users/david/Desktop/developments/via54Skills   # or your clone
npm init -y
npm install --save-dev vitepress
```

Expected output:

```
added 173 packages in 18s

170 packages are looking for funding
```

> **Why `--save-dev`**: VitePress is a build tool, not a runtime dependency of the published skills. The published artifact (`SKILL.md`) does not depend on VitePress being installed.

### Step 1.2 — `.gitignore`

Append to `.gitignore`:

```gitignore
# VitePress (do NOT commit — GitHub Actions will npm install)
node_modules/
docs/.vitepress/cache/
docs/.vitepress/dist/
```

Verify with `cat .gitignore | grep node_modules` — should print the line.

### Step 1.3 — Directory layout

Create the `docs/` tree:

```
via54Skills/
├── README.md
├── README.en.md
├── UPGRADE.md          ← this file
├── via54merge/SKILL.md
├── via54goport/SKILL.md
├── .gitignore
├── package.json        ← created by `npm init -y`
├── package-lock.json   ← created by `npm install`
├── node_modules/       ← gitignored
└── docs/               ← NEW: VitePress content root
    ├── .vitepress/
    │   ├── config.mts
    │   └── theme/
    │       └── index.ts  ← (optional, see Phase 2 customizations)
    ├── public/          ← (optional static assets)
    ├── zh/
    │   ├── index.md       ← copy of README.md
    │   └── skills/
    │       ├── via54merge.md   ← symlink to ../../via54merge/SKILL.md
    │       └── via54goport.md   ← ditto
    └── en/
        ├── index.md       ← copy of README.en.md
        └── skills/
            ├── via54merge.md
            └── via54goport.md
```

### Step 1.4 — `docs/.vitepress/config.mts`

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'via54Skills',
  description: 'Personal Skills by veawho — Hermes / Claude / OpenClaw / OpenCode / Codex',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,

  // i18n: Chinese (default) + English
  locales: {
    'zh-CN': {
      label: '中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/' },
          { text: 'Skills', link: '/zh/skills/via54merge' },
          { text: '升级指南', link: '/zh/UPGRADE' },
          { text: 'English', link: '/en/' },
        ],
        sidebar: {
          '/zh/': [
            {
              text: '开始',
              items: [
                { text: '首页', link: '/zh/' },
                { text: '升级到 SSG', link: '/zh/UPGRADE' },
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
          { text: 'Upgrade Guide', link: '/en/UPGRADE' },
          { text: '中文', link: '/zh/' },
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Get started',
              items: [
                { text: 'Home', link: '/en/' },
                { text: 'Upgrade to SSG', link: '/en/UPGRADE' },
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

  // Sidebar auto-generation from frontmatter (alternative to manual list above)
  // vitepress-sidebar plugin can replace the manual sidebar config:
  // npm install --save-dev vitepress-sidebar
  // and use { import: 'dynamic' } in config.
})
```

> **Manual vs auto sidebar**: the config above uses a hand-maintained list (works for 2 skills, easy to keep in sync). At ~10 skills, switch to the [`vitepress-sidebar`](https://www.npmjs.com/package/vitepress-sidebar) plugin to auto-generate from the `docs/` filesystem.

### Step 1.5 — Content files

```bash
cd /Users/david/Desktop/developments/via54Skills

# Copy README content into the locale index pages
cp README.md docs/zh/index.md
cp README.en.md docs/en/index.md

# Symlink each SKILL.md into both locale skill directories
mkdir -p docs/zh/skills docs/en/skills
ln -s ../../via54merge/SKILL.md docs/zh/skills/via54merge.md
ln -s ../../via54merge/SKILL.md docs/en/skills/via54merge.md
ln -s ../../via54goport/SKILL.md docs/zh/skills/via54goport.md
ln -s ../../via54goport/SKILL.md docs/en/skills/via54goport.md

# Verify
ls -la docs/zh/skills/ docs/en/skills/
```

> **Why symlinks, not copies**: single source of truth. Editing `via54merge/SKILL.md` once updates both locale pages. When the skill list grows, `find . -maxdepth 4 -name SKILL.md -not -path '*/node_modules/*'` lists every skill — script the symlink creation from that.

### Step 1.6 — npm scripts

Add to `package.json`:

```json
{
  "name": "via54skills",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "^1.6.0"
  }
}
```

(Or use `npm pkg set scripts.docs:dev="vitepress dev docs"` to avoid hand-editing JSON.)

### Step 1.7 — Run the dev server

```bash
npm run docs:dev
```

Expected output (after a few seconds):

```
  vitepress v1.6.4

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 1.8 — Smoke tests

Open `http://localhost:5173/` and verify **all** of these:

- [ ] Home page loads, default language is Chinese
- [ ] Top-right shows a language dropdown (`中文` / `English`)
- [ ] Clicking `English` switches to `/en/` and the content is the English README
- [ ] Left sidebar shows: Get started → Home, Upgrade to SSG / Skills → via54merge, via54goport
- [ ] Clicking `via54merge` in the sidebar opens the SKILL.md content (full decision matrix, 中文摘要 at top, etc.)
- [ ] Top-right search icon (`Ctrl+K` / `Cmd+K`) opens the local search bar; typing `venv` finds via54merge within 100 ms
- [ ] Bottom-right "Change theme" toggle switches between light and dark mode

Curl-only verification (no browser needed):

```bash
curl -s http://localhost:5173/ | head -20           # HTML shell
curl -s -I http://localhost:5173/zh/ | head -5      # 200 OK
curl -s -I http://localhost:5173/en/ | head -5      # 200 OK
curl -s -I http://localhost:5173/zh/skills/via54merge | head -5   # 200 OK
```

### Phase 1 Exit Gate

- [ ] `npm run docs:dev` starts without errors
- [ ] All 6 smoke tests pass
- [ ] No `node_modules` staged for commit (`git status` should not show `node_modules/`)

If any fails, **do not proceed to Phase 2**. Fix Phase 1 first.

---

## Phase 2 — Production Build + Deploy to GitHub Pages

### Goal

Every `git push origin main` automatically builds the static site and publishes it to `https://veawho.github.io/via54Skills/`. No manual intervention.

### Step 2.1 — Configure VitePress base URL

The GitHub Pages URL for a project repo is `https://<user>.github.io/<repo>/`. VitePress needs to know the base path.

Edit `docs/.vitepress/config.mts`:

```ts
export default defineConfig({
  base: '/via54Skills/',   // ← MUST match the repo name (case-sensitive)
  // ... rest of config unchanged
})
```

> **Why**: VitePress generates absolute paths for assets. If `base` is wrong, CSS/JS 404 in production. If you serve from a custom domain (Phase 3), set `base: '/'`.

### Step 2.2 — Local production preview

```bash
npm run docs:build
npm run docs:preview
```

Expected:

```
  vitepress v1.6.4
  ✓ built in 12s
  ➜  Local:   http://localhost:4173/
```

Open `http://localhost:4173/` and verify:

- [ ] All assets load (no 404 in DevTools Network)
- [ ] Navigation works (sidebar links resolve to correct URLs)
- [ ] Search returns results
- [ ] Language switcher persists across navigation

### Step 2.3 — Enable GitHub Pages

Two options — pick one:

#### Option A: GitHub Actions (recommended)

1. Enable Pages with **Source = GitHub Actions**: repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**.

2. Create `.github/workflows/docs.yml`:

```yaml
name: Deploy VitePress to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # needed if lastUpdated is enabled
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

3. Commit + push:

```bash
git add .github/workflows/docs.yml docs/.vitepress/config.mts package.json package-lock.json
git commit -m "ci: add GitHub Pages deploy workflow for VitePress"
git push origin main
```

4. Watch the workflow run: repo → Actions tab → "Deploy VitePress to GitHub Pages" → wait for green.

5. Site is live at `https://veawho.github.io/via54Skills/`.

#### Option B: `gh-pages` branch (older, simpler)

If you prefer not to use Actions:

1. Settings → Pages → Source: **Deploy from a branch** → Branch: `gh-pages` / `/ (root)`.

2. Add a deploy script to `package.json`:

```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs",
    "docs:deploy": "vitepress build docs && gh-pages -d docs/.vitepress/dist --dotfiles"
  },
  "devDependencies": {
    "gh-pages": "^6.1.0",
    "vitepress": "^1.6.0"
  }
}
```

3. `npm install`, then `npm run docs:deploy` to publish.

> **Trade-off**: Option B requires you to run the deploy command manually on every change. Option A runs automatically on `git push`. **Pick A unless your org has disabled Actions.**

### Step 2.4 — Verification

After the workflow finishes:

```bash
curl -s -I https://veawho.github.io/via54Skills/ | head -3
# expect: HTTP/2 200

curl -s https://veawho.github.io/via54Skills/ | grep -o '<title>[^<]*</title>'
# expect: <title>via54Skills</title>

curl -s -I https://veawho.github.io/via54Skills/zh/skills/via54merge | head -3
# expect: HTTP/2 200
```

Browser: visit `https://veawho.github.io/via54Skills/` and re-run the Phase 1.8 smoke tests against the public URL.

### Phase 2 Exit Gate

- [ ] `npm run docs:build` succeeds locally
- [ ] GitHub Actions workflow is green
- [ ] Public site returns 200 on `/`, `/zh/`, `/en/`, `/zh/skills/via54merge`, `/en/skills/via54merge`
- [ ] Search works on the public site
- [ ] All asset URLs resolve (no 404 in browser DevTools)

---

## Phase 3 — Custom Domain (via54skills.dev)

### Goal

`https://via54skills.dev/` serves the site (root domain, no `/via54Skills/` prefix).

### Prerequisites

- You own `via54skills.dev` (registered via Cloudflare Registrar, Namecheap, Porkbun, etc.)
- DNS hosted on Cloudflare (recommended for free auto-TLS) OR another DNS provider that supports CNAME / ALIAS to GitHub Pages

### Step 3.1 — Configure DNS

| Type | Name | Value | Notes |
|---|---|---|---|
| CNAME | `@` | `veawho.github.io` | Apex domain → GitHub Pages |
| CNAME | `www` | `veawho.github.io` | Optional: redirect www → apex |

If your DNS doesn't support CNAME on apex (some providers don't), use an ALIAS or ANL record, or use Cloudflare's CNAME flattening.

### Step 3.2 — Configure GitHub Pages

1. Repo → Settings → Pages → **Custom domain**: `via54skills.dev`
2. Wait for DNS check to pass (green checkmark, up to 24 h)
3. Enable **Enforce HTTPS** (after the certificate is provisioned)

### Step 3.3 — Update VitePress base

Edit `docs/.vitepress/config.mts`:

```ts
export default defineConfig({
  base: '/',   // ← was '/via54Skills/', now root
  // ... rest unchanged
})
```

### Step 3.4 — Add `docs/public/CNAME`

VitePress copies `docs/public/` contents into the build output. Create a one-line file:

```bash
mkdir -p docs/public
echo "via54skills.dev" > docs/public/CNAME
```

This is what tells GitHub Pages the canonical domain.

### Step 3.5 — Rebuild + verify

```bash
git add docs/.vitepress/config.mts docs/public/CNAME
git commit -m "feat: serve from via54skills.dev custom domain"
git push origin main
```

After workflow completes:

```bash
curl -s -I https://via54skills.dev/ | head -3
# expect: HTTP/2 200, server: cloudflare (or GitHub Pages)

curl -s https://via54skills.dev/ | grep -o '<title>[^<]*</title>'
# expect: <title>via54Skills</title>
```

### Phase 3 Exit Gate

- [ ] `https://via54skills.dev/` returns 200
- [ ] HTTP → HTTPS redirect works
- [ ] `www.via54skills.dev` redirects to apex (or vice versa, your choice)
- [ ] Search and language switcher work on the custom domain

---

## Phase 4 — Migrate to Docusaurus (only if needed)

### Trigger

Migrate **only if** all of these become true:

- [ ] You want a blog (changelog, announcements, tutorials)
- [ ] You want versioned docs (`/v0.1/intro`, `/v0.2/intro`)
- [ ] You need MDX components (interactive React widgets in skill pages)
- [ ] You're willing to accept +400 MB `node_modules` and 30–90 s build times

If any of these is false, **stay on VitePress**. Docusaurus is heavier, more opinionated, and the upgrade cost is real.

### Migration steps (sketch — execute only if Phase 4 triggers)

1. `npm uninstall vitepress && npm install --save-dev @docusaurus/core @docusaurus/preset-classic`
2. Create `docusaurus.config.js` (see Docusaurus docs for i18n: `i18n: { defaultLocale: 'zh', locales: ['zh', 'en'] }`)
3. Move `docs/zh/` → `i18n/zh/docusaurus-plugin-content-docs/current/`
4. Move `docs/en/` → `i18n/en/docusaurus-plugin-content-docs/current/` (and `i18n/en/code.json`)
5. Symlinks remain compatible (Docusaurus reads `.md` / `.mdx` from the i18n tree)
6. Update GitHub Actions workflow: replace `vitepress build` with `npm run build`
7. Site is live at the same custom domain

### Cost

| | VitePress | Docusaurus |
|---|---|---|
| `node_modules` | 250 MB | 400 MB |
| Build time | 5–30 s | 30–90 s |
| Content format | Markdown | MDX (Markdown + JSX) |
| i18n config | `locales: {...}` in config | `i18n: { defaultLocale, locales }` in config + JSON translation files |
| Custom domain support | yes | yes |
| Blog plugin | manual | built-in |
| Versioned docs | manual | built-in |

---

## Alternative Deployment Targets

If GitHub Pages doesn't fit, here are the alternatives ranked by recommendation:

| Target | Cost | Setup time | Best for |
|---|---|---|---|
| **GitHub Pages** (Phase 2) | Free | 30 min | Most public open-source projects. Recommended default. |
| **Cloudflare Pages** | Free tier: unlimited bandwidth, 500 builds/month | 20 min | If you already use Cloudflare for DNS. Better global CDN than GH Pages. |
| **Netlify** | Free tier: 100 GB bandwidth/month, 300 build-minutes | 20 min | If you want form handling, edge functions, A/B testing. |
| **Vercel** | Free tier: 100 GB bandwidth, 6000 build-minutes | 15 min | Best DX for Next.js projects; works fine with VitePress. |
| **Self-hosted** (your own server) | $5–20/month VPS + electricity | 2–4 hours | Only if you need on-prem, custom auth, or absolute control. |

### Cloudflare Pages quick path

```bash
# Install wrangler (Node tool)
npm install --save-dev wrangler

# Authenticate (opens browser to Cloudflare login)
npx wrangler login

# Deploy (creates project on first run, then deploys)
npm run docs:build
npx wrangler pages deploy docs/.vitepress/dist --project-name=via54skills
```

Subsequent deploys: `npx wrangler pages deploy docs/.vitepress/dist --project-name=via54skills`.

Custom domain on Cloudflare Pages: Pages project → Custom domains → `via54skills.dev` → automatic CNAME + free TLS.

### Self-hosted quick path

Skip this if Cloudflare Pages works. Self-hosting is for users who need:

- On-prem compliance
- Custom auth / private network
- Integration with an existing internal infrastructure

Minimal self-host:

```bash
# On your server
git clone https://github.com/veawho/via54Skills.git
cd via54Skills
npm ci
npm run docs:build
npx serve docs/.vitepress/dist -l 8080   # or any static-file server

# Reverse proxy with nginx / Caddy → expose via54skills.dev on :443
# TLS via Let's Encrypt (Caddy auto)
```

> **⚠ Do not run VitePress dev server (`vitepress dev`) in production** — it has source maps, hot reload, no caching. Always `npm run docs:build` first, then serve `docs/.vitepress/dist/`.

---

## CI / CD Reference

### GitHub Actions workflow (full file)

See Phase 2.3 Option A. The complete workflow file:

```yaml
# .github/workflows/docs.yml
name: Deploy VitePress to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Local CI simulation

Before pushing, simulate the workflow locally:

```bash
# Install exact deps (mimics `npm ci`)
npm ci

# Build (mimics `npm run docs:build`)
npm run docs:build

# Preview the production build
npm run docs:preview
# open http://localhost:4173/
```

If `docs:preview` works locally, the GitHub Action will work too (same Node version, same deps).

### When CI fails

Most common failures (ranked by frequency):

| Error | Cause | Fix |
|---|---|---|
| `ERR_PNPM_PEER_DEP_ISSUES` | npm version mismatch | Pin `npm-version` in `setup-node` action |
| `Cannot find module 'vitepress'` | `node_modules` was deleted before `npm ci` | `git status` should not show `node_modules/`; ensure `.gitignore` is correct |
| `Build failed: ENOENT` for `docs/zh/skills/via54merge.md` | Symlink dangling | Re-run `ln -s ../../via54xxx/SKILL.md docs/zh/skills/...` |
| `Failed to load sidebar` | Sidebar key doesn't match a route | Check sidebar keys against actual URLs (Phase 1.8) |
| 404 on `/zh/skills/...` | `base` mismatch in config | Set `base: '/via54Skills/'` (Phase 2) or `base: '/'` (Phase 3) |

---

## Rollback Procedure

If the SSG migration breaks something, revert in 3 commands:

```bash
# 1. Revert the last commit (workflow + docs/)
git revert HEAD
git push origin main

# 2. (if GitHub Pages is still serving old content) Disable Pages
gh repo edit --enable-pages=false

# 3. (if you want to remove node_modules entirely) Remove the docs/ + node_modules/
git rm -r docs/
rm -rf node_modules/
git commit -m "revert: rollback SSG migration"
```

The `SKILL.md` files and `README.md` / `README.en.md` are unaffected by the migration — GitHub continues to render them natively. So rollback is non-destructive to the source content.

---

## Mini dry-run results (Phase 1 sanity check)

This document was produced on a **Mac mini** (`daviddeMac-mini.local`, macOS 26.5.1) that is **not** the primary dev machine. The Mac mini was used to validate the Phase 1 install path before committing the workflow to GitHub.

### What was verified

- [x] Node.js v22.22.3 present, npm 10.9.8 present
- [x] `registry.npmjs.org` reachable from Mac mini (HTTP 200, 0.7 s response)
- [x] `gh auth status` shows admin + push scope for `veawho` org
- [x] `git push origin main` works (the UPGRADE.md push)
- [x] `vitepress` package metadata fetchable (1.7 MB tarball, HTTP 200)
- [x] `~/.hermes/skills/` symlinks still resolve (Hermes skill loader unaffected)

### What was NOT verified on the Mac mini

- [ ] `npm install vitepress` — *not run* (would commit 250 MB to disk; deferred to primary dev machine)
- [ ] `docs/.vitepress/config.mts` — *not written* on disk, only documented here
- [ ] `npm run docs:dev` — *not run*
- [ ] GitHub Pages deploy workflow — *not created* on this machine
- [ ] Custom domain setup — *not attempted*

### Decision

The Mac mini is suitable for **preview / dry-run**, but the **production deploy** should happen from the primary dev machine where you (the user) are most comfortable. This document is the bridge.

---

## Troubleshooting

### `npm install` is slow / hangs

This machine's Mac mini observed npm registry at ~0.7 s response, but other machines may see 10+ s due to network latency. If `npm install vitepress` hangs:

```bash
# Set a registry mirror (China users)
npm config set registry https://registry.npmmirror.com
npm install --save-dev vitepress

# Or use pnpm (often faster)
npm install -g pnpm
pnpm add -D vitepress
```

### Port 5173 is already in use

VitePress will auto-bump to 5174, 5175, etc. Or specify a port:

```bash
npm run docs:dev -- --port 5174
```

### Markdown content not updating after edit

VitePress hot-reloads markdown changes within ~100 ms. If you see stale content:

1. Hard refresh the browser (`Cmd+Shift+R` / `Ctrl+Shift+R`)
2. Check the browser DevTools Network tab — the page should be fetched fresh
3. If still stale, restart `npm run docs:dev`

### Symlinks not resolving on GitHub Pages

GitHub Pages follows symlinks at build time, but only if the symlink target is in the same repo. Our setup:

```
docs/zh/skills/via54merge.md → ../../via54merge/SKILL.md
```

Both files are in the same repo, so this works. **If you ever symlink to an absolute path outside the repo, the GitHub Action will fail to resolve it.**

### Search returns no results

The local search provider indexes at build time. If you add a new skill, run `npm run docs:build` again (or push — the Action will rebuild and the next deploy includes the new index).

### Language switcher doesn't preserve the current page

VitePress's default behavior: clicking the language switcher goes to the **home page** of the other locale, not the equivalent page. To fix, use the [`vuepress-redirect`](https://github.com/condorheroblog/vuepress-redirect) plugin or write a small VitePress theme override.

Workaround (manual, no plugin): in your theme, override the language dropdown to look up the equivalent route.

---

## Summary

| Phase | Effort | When | Cost (this machine) |
|---|---|---|---|
| 0 — Decision | 5 min | Now | $0 |
| 1 — Local preview | 30 min | When ≥ 5 skills | +250 MB disk |
| 2 — Deploy to GitHub Pages | 30 min | After Phase 1 green | $0 |
| 3 — Custom domain | 30 min | When ready to brand | $10–15/year for domain |
| 4 — Docusaurus migration | 4–8 hours | If blog / versioning needed | +150 MB disk swap |

**Recommended next action**: on your primary dev machine, run Phase 1 (local preview) end-to-end. Push when Phase 1.8 smoke tests all pass. Phase 2 is a 30-minute add-on after Phase 1 succeeds.

This document was last verified against:
- VitePress 1.6.4 (latest stable as of 2026-06-13)
- Docusaurus 3.10.x
- GitHub Actions ubuntu-latest (Node 22)
- GitHub Pages (default `veawho.github.io/via54Skills/`)