# via54Skills

> **🌐 Language / 语言**: [← 中文(默认)](README.md) · **English**(you are here)

Personal Skills repository by **veawho** (Devin Wei), cross-compatible with **Hermes Agent**, **Claude Code**, **OpenClaw**, **OpenCode**, and **Codex CLI**.

---

## 📑 Table of Contents

- [Default Rules](#default-rules)
- [Naming Convention](#naming-convention)
- [Compatibility](#compatibility)
- [Bilingual Strategy](#bilingual-strategy)
- [Current Skills](#current-skills)
- [Installation](#installation)
- [Git Workflow](#git-workflow)
- [License](#license)

---

## Default Rules

> The following are **hard defaults** for this repo. PRs violating any rule will not be merged.

1. **Naming**: `via54<lowercase-action>`. Hermes's `name` regex `^[a-z0-9][a-z0-9._-]*$` forces lowercase; Claude/OpenClaw/OpenCode/Codex regex `^[a-z0-9]+(-[a-z0-9]+)*$` only accepts lowercase + single hyphens. So **all lowercase, no underscores, no dots, no hyphens** is the common denominator.

2. **Bilingual README**: All top-level docs (README, AGENTS.md, CONTRIBUTING.md) must have Chinese and English side-by-side. **Chinese first** (user preference, not quality judgment).

3. **Chinese Annotations in SKILL.md**: Important sections (Decision Matrix, Pitfalls, Iron Rules, Verification Checklist) **must** be followed by a `> **中文注释**: ...` block. Goal: Chinese readers don't need a second translation pass.

4. **Frontmatter Compatibility**: Required fields must satisfy **all** supported tools' regex. See table below.

5. **Live Iron Rule**: Every conclusion in a skill must be backed by ≥2 live tool outputs (`ps`, `lsof`, `curl`, `find`, real launch, etc.). **No backup-manifest inference, no historical speculation**. This rule is the first item in every skill's Common Pitfalls section.

---

## Naming Convention

**`via54<lowercase-action>`** — every skill must use the `via54` prefix, lowercase, concise.

### Examples

| Skill | Meaning | Naming boundary |
|---|---|---|
| `via54merge` | venv / service / binary consolidation | single verb |
| `via54goport` | Python → Go rewrite | verb + object |
| `via54deploy` | (future) deployment | short verb |
| `via54backuprotate` | (future) backup rotation | compound (allowed) |
| ~~`via54Merge`~~ | ❌ Rejected: camelCase fails Hermes regex |
| ~~`via54_merge`~~ | ❌ Rejected: underscores rejected by Claude/OpenCode/OpenClaw regex |
| ~~`via54.merge`~~ | ❌ Rejected: dots rejected by Claude/OpenCode/OpenClaw regex |

> We chose lowercase because (a) Hermes validator rejects camelCase, and (b) Claude/OpenClaw/OpenCode/Codex all only accept `^[a-z0-9]+(-[a-z0-9]+)*$`. If any tool relaxes its rules in the future, we'll revisit. **Today: all lowercase, no separators.**

### Directory = Name

- Skill directory = skill name: `via54merge/SKILL.md`, `via54goport/SKILL.md`
- SKILL.md frontmatter `name` field must equal directory name
- All skills sit at the repo root (no category subdirs — this repo IS the namespace)

---

## Compatibility

> **Current state**: SKILL.md is the [Agent Skills open standard](https://agentskills.io) published by Anthropic on 2025-12-18. **Claude Code / Hermes Agent / OpenClaw / OpenCode / Codex CLI** all load it.

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

Each skill must pass these checks before push:

```bash
# 1. Hermes validator
~/.hermes/hermes-agent/venv/bin/python3 -c "
import sys; sys.path.insert(0, '$HOME/.hermes/hermes-agent')
from tools.skill_manager_tool import _validate_frontmatter
import pathlib
_validate_frontmatter(pathlib.Path('via54xxx/SKILL.md').read_text())
print('✓ Hermes OK')
"

# 2. Claude/OpenCode/OpenClaw/Codex name regex
python3 -c "
import re; import yaml; import pathlib
content = pathlib.Path('via54xxx/SKILL.md').read_text()
m = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
name = yaml.safe_load(m.group(1))['name']
assert re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', name), f'Claude regex fail: {name}'
print('✓ Claude/OpenCode/OpenClaw/Codex OK')
"
```

---

## Bilingual Strategy

> **Goal**: Chinese is the default reading language for the author; English is the international lingua franca and helps English AI tools (Claude / OpenClaw / OpenCode / Codex) parse better.

### Rules

1. **README / AGENTS.md / CONTRIBUTING.md**: Chinese at the top (full version), English follows immediately after. The Chinese-first order is **user preference**, not a quality claim.

2. **SKILL.md body**: **No per-paragraph bilingual needed** — this is technical docs, Chinese annotations are enough. Rules:
   - **Every `## ` section opener** (Overview / When to Use / Decision Matrix / Pitfalls / Verification): put a `> **中文摘要** (Chinese Summary): ...` blockquote at the start
   - **After key tables / decisions / pitfalls / iron rules**: append a `> **中文注释**: ...` blockquote
   - **Code blocks, CLI, file paths**: keep English (machine-readable; translating introduces errors)

3. **Frontmatter `description`**: **keep English**. Reason: `description` is the trigger field; English AI tools match better on English. Chinese descriptions drastically reduce English-AI-tool recognition.

4. **Frontmatter `metadata.tags`**: **keep English** (space-separated). Same reason as `description`.

5. **Commit messages**: **English**. GitHub is English-dominant; Chinese commit messages are harder to search.

### Bilingual Example

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

## Current Skills

| Skill | Size | Topic |
|---|---|---|
| `via54merge` | 12.2 KB | venv / service / native binary consolidation |
| `via54goport` | 14.6 KB | Python service → Go rewrite (eval + scaffold) |

More skills added as needed; each PR is reviewed individually.

---

## Installation

### Method A: Symlink to Hermes Agent (recommended for local dev users)

```bash
# Single skill
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

Per OpenClaw docs: `~/.agents/skills/` or `<workspace>/skills/` or `~/.openclaw/skills/`, any of these works.

```bash
mkdir -p ~/.agents/skills
ln -s /Users/david/Desktop/developments/via54Skills/via54merge \
      ~/.agents/skills/via54merge
```

### Method D: OpenCode

Per OpenCode docs: `~/.config/opencode/skills/`, `<repo>/.opencode/skills/`, or `~/.claude/skills/` (OpenCode also reads Claude's path).

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

MIT (matches Hermes skill convention).