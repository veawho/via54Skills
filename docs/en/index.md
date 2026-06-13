# via54Skills

> **🌐 Language / 语言**: [← 中文(默认)](README.md) · **English**(you are here)

Personal Skills repository by **veawho** (Devin Wei), cross-compatible with **Hermes Agent**, **Claude Code**, **OpenClaw**, **OpenCode**, and **Codex CLI**.

---

## 📑 Table of Contents

- [Default Rules](#default-rules)
- [Naming Convention](#naming-convention)
- [GitHub Markdown Spec](#github-markdown-spec)
- [Compatibility](#compatibility)
- [Bilingual Strategy](#bilingual-strategy)
- [Static Site (Docusaurus / VitePress)](#static-site-docusaurus--vitepress)
- [Current Skills](#current-skills)
- [Installation](#installation)
- [Git Workflow](#git-workflow)
- [License](#license)

---

## Default Rules

> The following are **non-negotiable** for this repo. PRs violating any rule will not be merged.

1. **Naming**: `via54<lowercase-action>`. Hermes's `name` regex `^[a-z0-9][a-z0-9._-]*$` requires lowercase; Claude / OpenClaw / OpenCode / Codex all enforce `^[a-z0-9]+(-[a-z0-9]+)*$`. The intersection is lowercase letters only — **no underscores, no dots, no hyphens**.

2. **Bilingual READMEs**: Every top-level doc (`README.md`, `AGENTS.md`, `CONTRIBUTING.md`) ships with both Chinese and English. Chinese is the author's native reading language, English is for international and tooling audiences.

3. **`README.md` is the default; `README.en.md` is English-only**. They are linked by a banner at the top of each file (`🌐 Language / 语言`). The default file MUST contain the language switcher link; the alternate file MUST contain the return link.

4. **Chinese Annotations in SKILL.md**: Important sections (Decision Matrix, Pitfalls, Iron Rules, Verification Checklist) MUST be followed by a `> **中文注释**: ...` blockquote. Code blocks, CLI commands, file paths, and JSON keys stay in English.

5. **Frontmatter Compatibility**: Required fields MUST satisfy every supported tool's regex. See the compatibility table below.

6. **Live Iron Rule**: Every conclusion in a skill must be backed by ≥2 live tool outputs (`ps`, `lsof`, `curl`, `find`, real launch, etc.). No inference from backup manifests, no historical speculation. This rule is the first item in every skill's Common Pitfalls section.

7. **Technical English in `README.en.md`**: This file is not a translation. It uses standard software-engineering English — RFC 2119 keywords (MUST, SHOULD, MAY), CommonMark / GFM conventions, and the terminology of the tools named (SKILL.md, frontmatter, `metadata`, `name`, regex, validator). Phrase the rule from the English side; do not mirror Chinese sentence structure.

---

## Naming Convention

**`via54<lowercase-action>`** — every skill must use the `via54` prefix, lowercase, concise.

### Examples

| Skill | Meaning | Naming pattern |
|---|---|---|
| `via54merge` | venv / service / binary consolidation | single verb |
| `via54goport` | Python → Go rewrite | verb + object |
| `via54deploy` | (future) deployment | short verb |
| `via54backuprotate` | (future) backup rotation | compound (allowed) |
| ~~`via54Merge`~~ | ❌ Rejected: camelCase fails the Hermes regex |
| ~~`via54_merge`~~ | ❌ Rejected: underscores rejected by Claude / OpenCode / OpenClaw |
| ~~`via54.merge`~~ | ❌ Rejected: dots rejected by Claude / OpenCode / OpenClaw |

> The lowercase-only constraint comes from cross-tool compatibility — Hermes requires lowercase, the others require lowercase + single hyphens. The intersection is lowercase letters only. If a tool relaxes its constraint later, we can reconsider. **Current rule: lowercase, no separators.**

### Directory = Name

- Skill directory = skill name: `via54merge/SKILL.md`, `via54goport/SKILL.md`
- SKILL.md frontmatter `name` field MUST equal the directory name
- All skills live at the repo root (no category subdirectories; this repo IS the namespace)

---

## GitHub Markdown Spec

> Both READMEs MUST conform to **GitHub Flavored Markdown (GFM)** so they render correctly on `github.com`.

### GFM Rules We Enforce

1. **One `# ` heading per file** (file title). All other section headings use `## `, `### `, etc.
2. **Fenced code blocks with triple backticks** (` ``` `). Always specify a language tag (`bash`, `yaml`, `python`, etc.) for syntax highlighting.
3. **GFM Tables** with `|` separators and a `---` alignment row. Keep column count consistent.
4. **Relative links** for in-repo navigation (`[text](README.en.md)`, `[text](via54merge/SKILL.md)`). GitHub auto-resolves them to `blob/main/...`.
5. **Allowed HTML**: only GFM-safe tags (`details`, `summary`, `kbd`, `sub`, `sup`, `img`, `br`, etc.). **Forbidden**: `<script>`, `<style>`, `<iframe>`, inline CSS, `class` / `id` attributes.
6. **Line length**: GFM allows long lines (no hard limit), but we keep prose lines ≤200 chars where practical to preserve diff readability.
7. **No trailing whitespace**. **No consecutive blank lines** (>2 in a row).
8. **Tabs**: forbidden in markdown prose (use 2 or 4 spaces for nested lists).

### Validation

```bash
# Light GFM lint (custom check — no universal tool)
python3 << 'PYEOF'
import re, pathlib
for p in [pathlib.Path('README.md'), pathlib.Path('README.en.md')]:
    txt = p.read_text()
    no_code = re.sub(r'```.*?```', '', txt, flags=re.DOTALL)
    h1 = len(re.findall(r'^# [^\n]+', no_code, re.MULTILINE))
    assert h1 == 1, f'{p}: {h1} H1 headings (want 1)'
    assert '\t' not in txt, f'{p}: contains tabs'
    assert not re.search(r'\n\n\n+', txt), f'{p}: consecutive blank lines'
    print(f'  ✓ {p}')
PYEOF
```

---

## Compatibility

> SKILL.md is the [Agent Skills open standard](https://agentskills.io) published by Anthropic on 2025-12-18. **Claude Code / Hermes Agent / OpenClaw / OpenCode / Codex CLI** all load it.

### Field Constraints per Tool (tested / documented)

| Field | Hermes | Claude Code | OpenClaw | OpenCode | Codex CLI |
|---|---|---|---|---|---|
| `name` (required) | `^[a-z0-9][a-z0-9._-]*$` ≤64 | `^[a-z0-9]+(-[a-z0-9]+)*$` ≤64 | same as Claude | same as Claude | same as Claude |
| `description` (required) | ≤1024 | ≤1024 | ≤1024 | ≤1024 | ≤1024 |
| `license` | optional | optional | optional | optional | optional |
| `compatibility` | ignored | optional | optional | optional | optional |
| `metadata` | `metadata.hermes.{tags,related_skills}` nested | flat string→string | flat | flat | flat |
| `when_to_use` | not supported | optional | optional | optional | optional |
| `allowed-tools` | not supported | experimental | experimental | not supported | not supported |

### Our Standard Frontmatter Template

```yaml
---
name: via54xxx                  # required, lowercase, matches directory name
description: Use when ...       # required, ≤1024, starts with "Use when", trigger keywords
license: MIT                    # optional but recommended
compatibility: Designed for Claude Code, Hermes Agent, OpenClaw, OpenCode, Codex CLI. macOS / Linux. Requires ...
metadata:                       # optional, flat string→string, cross-tool recognized
  author: veawho
  version: 1.0.0
  audience: developers
  tags: keyword1 keyword2 ...    # space-separated keywords, all tools recognize
  hermes:                       # Hermes-specific: nested; other tools ignore unknown fields
    tags: [keyword1, keyword2, ...]   # array form, Hermes preference
    related_skills: [via54goport, ...]
---
```

### Validation Script

Each skill MUST pass these checks before push:

```bash
# 1. Hermes validator
~/.hermes/hermes-agent/venv/bin/python3 -c "
import sys; sys.path.insert(0, '$HOME/.hermes/hermes-agent')
from tools.skill_manager_tool import _validate_frontmatter
import pathlib
_validate_frontmatter(pathlib.Path('via54xxx/SKILL.md').read_text())
print('✓ Hermes OK')
"

# 2. Claude / OpenCode / OpenClaw / Codex name regex
python3 -c "
import re, yaml, pathlib
content = pathlib.Path('via54xxx/SKILL.md').read_text()
m = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
name = yaml.safe_load(m.group(1))['name']
assert re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', name), f'Claude regex fail: {name}'
print('✓ Claude/OpenCode/OpenClaw/Codex OK')
"
```

---

## Bilingual Strategy

> Chinese is the author's native reading language; English is the international lingua franca and helps English AI tools (Claude / OpenClaw / OpenCode / Codex) parse metadata more reliably.

### Rules

1. **`README.md` / `AGENTS.md` / `CONTRIBUTING.md`**: ship Chinese at the top, English follows immediately. The Chinese-first order reflects author preference, not a quality claim.
2. **`README.en.md`**: **English only, written as a native document, not a translation.** Follow RFC 2119 keyword conventions (MUST, SHOULD, MAY). Use terms that match the upstream tools' own documentation (`SKILL.md`, `frontmatter`, `metadata`, `validator`).
3. **Language switcher banner** at the top of each README:
   ```
   > **🌐 Language / 语言**: [← 中文(默认)](README.md) · **English**(you are here)
   ```
4. **SKILL.md body**: no per-paragraph bilingual needed. Put `> **中文摘要** (Chinese Summary): ...` at the start of every `## ` section, and `> **中文注释**: ...` after every key table / decision / pitfall / iron rule. Code blocks, CLI, and file paths stay in English.
5. **Frontmatter `description`**: English. The `description` field is the trigger field; English AI tools match English triggers far more reliably.
6. **Frontmatter `metadata.tags`**: English (space-separated). Same reason as `description`.
7. **Commit messages**: English. GitHub is English-dominant; Chinese commit messages are harder to search.

### Bilingual Example (SKILL.md)

```markdown
# via54merge — Consolidate Duplicated Python Runtimes, Services & Binaries

> **中文摘要** (Chinese Summary): 本技能用于在 macOS / Linux 开发机上合并重复的 Python venv...

## Overview

When you have multiple Python venvs serving overlapping purposes...

> **中文注释**: 不要为了合并而合并。每次合并的真实成本包括验证、回归测试、部署风险...

## Decision Matrix

| Criterion | Score 0 | Score 1 | Score 2 |
|---|---|---|---|
| ... | ... | ... | ... |

> **中文注释**: 决策矩阵打分。≥7 分强烈合并,5-6 分痛点强才合并,≤4 分别碰。
```

---

## Static Site (Docusaurus / VitePress)

> This repo currently ships plain Markdown READMEs. If / when the skills grow past ~10 entries, a static-site generator (SSG) with native i18n becomes the right home. This section captures the upgrade path so we don't research it twice.

### When to Migrate

| Signal | Threshold |
|---|---|
| Number of skills in repo | ≥ 10 |
| Number of categories or topical groupings | ≥ 3 |
| Pages you'd want beside the SKILL docs (tutorials, blog posts, change log) | any |
| Users asking for search / version pinning / sidebar nav | any |

If none of these apply, **stay on plain Markdown** — Docusaurus + VitePress add ~150 MB of `node_modules` and a build step per change.

### Docusaurus v3 (current: 3.10.x)

| Requirement | Minimum |
|---|---|
| Node.js | 18.0+ (20 LTS recommended) |
| Disk for `node_modules` | ~400 MB |
| `package.json` scripts | `start`, `build`, `serve`, `clear`, `deploy` |
| i18n config | `docusaurus.config.js` → `i18n: { defaultLocale: 'zh', locales: ['zh', 'en'] }` |
| Content layout | `i18n/zh/...` mirror of source, plus `locale.json` per page |
| Build time | 30-90 s cold, 1-5 s hot |

### VitePress (current: 1.x stable)

| Requirement | Minimum |
|---|---|
| Node.js | 18.0+ (20 LTS recommended) |
| Disk for `node_modules` | ~250 MB |
| Config file | `.vitepress/config.mts` → `locales: { root: { label: '中文', lang: 'zh-CN' }, en: { lang: 'en-US' } }` |
| Content layout | `docs/<lang>/<page>.md` |
| Build time | 5-30 s cold, <1 s hot |

### Comparison

| Aspect | Docusaurus v3 | VitePress |
|---|---|---|
| Bundle size | ~400 MB `node_modules` | ~250 MB `node_modules` |
| Build speed | slower (React + MDX) | faster (Vue + markdown) |
| i18n UX | full locale switcher, versioned docs | full locale switcher, no versioning |
| Search | Algolia / local | local FlexSearch (default) |
| Theme | Infima (CSS) | default Vue theme |
| SKILL.md frontmatter passthrough | needs plugin | needs plugin |
| Best for | large doc portals | small-medium docs, blogs |

### Recommendation for via54Skills

- **Now** (2 skills): stay on plain Markdown + dual `README.md` / `README.en.md`.
- **At ~10 skills**: migrate to **VitePress** — smaller, faster, and the directory-based i18n maps cleanly to skill directories.
- **If a blog or tutorial series appears**: Docusaurus gives more out of the box (MDX, blog plugin, versioned docs) and is worth the heavier toolchain.

---

## Current Skills

| Skill | Size | Topic |
|---|---|---|
| `via54merge` | 12.2 KB | venv / service / native binary consolidation |
| `via54goport` | 14.6 KB | Python service → Go rewrite (eval + scaffold) |

New skills ship as separate PRs; each is reviewed against the rules above.

---

## Installation

### Method A: Symlink to Hermes Agent (recommended for local dev users)

```bash
ln -s /Users/david/Desktop/developments/via54Skills/via54merge \
      ~/.hermes/skills/via54merge

# Or whole repo via external_dirs in ~/.hermes/config.yaml:
# skills:
#   external_dirs:
#     - /Users/david/Desktop/developments/via54Skills
```

### Method B: Claude Code

```bash
mkdir -p ~/.claude/skills
ln -s /Users/david/Desktop/developments/via54Skills/via54merge \
      ~/.claude/skills/via54merge
ln -s /Users/david/Desktop/developments/via54Skills/via54goport \
      ~/.claude/skills/via54goport
```

### Method C: OpenClaw

Per OpenClaw docs: `~/.agents/skills/`, `<workspace>/skills/`, or `~/.openclaw/skills/`. Any of these works.

```bash
mkdir -p ~/.agents/skills
ln -s /Users/david/Desktop/developments/via54Skills/via54merge \
      ~/.agents/skills/via54merge
```

### Method D: OpenCode

Per OpenCode docs: `~/.config/opencode/skills/`, `<repo>/.opencode/skills/`, or `~/.claude/skills/` (OpenCode also reads the Claude path).

### Method E: Codex CLI

Per Codex CLI docs: `$CODEX_HOME/skills/`.

### Git Clone (from a user's perspective)

```bash
git clone https://github.com/veawho/via54Skills.git
```

---

## Git Workflow

```bash
cd /Users/david/Desktop/developments/via54Skills
git checkout -b feat/via54<new-skill>
# write via54<new-skill>/SKILL.md + maybe references/
git add via54<new-skill>/
git commit -m "feat: add via54<new-skill> skill

<short description in English>

Bilingual:
- SKILL.md Chinese Summary at top
- 中文注释 after key sections
- README.md / AGENTS.md bilingual (中/英)
- Frontmatter: Claude/Hermes/OpenClaw/OpenCode/Codex compatible

Validated:
- Hermes _validate_frontmatter OK
- Claude regex ^[a-z0-9]+(-[a-z0-9]+)*$ OK
- Description ≤1024 chars OK"
git push -u origin feat/via54<new-skill>
# PR review → merge → local skill auto-picks-up
```

Remote: `github.com/veawho/via54Skills`.

---

## License

MIT (matches the Hermes skill convention).