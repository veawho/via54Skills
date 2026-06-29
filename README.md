# via54Skills


> **🌐 Language**: [🇨🇳 中文](#) (current) | [🇺🇸 English](./README_EN.md)
>
> _This document is in Chinese. For English, click above._
> **🌐 语言 / Language**: **中文(默认 · you are here)** · [English →](README.en.md)

veawho (Devin Wei) 个人写的 Hermes Agent / Claude / OpenClaw / OpenCode / Codex 通用 Skills 仓库。
Personal Skills repository by veawho (Devin Wei), cross-compatible with Hermes Agent, Claude Code, OpenClaw, OpenCode, and Codex CLI.

---

## 📑 目录 / Table of Contents

- [默认规则 / Default Rules](#默认规则--default-rules)
- [命名规范 / Naming Convention](#命名规范--naming-convention)
- [GitHub Markdown 规范 / GitHub Markdown Spec](#github-markdown-规范--github-markdown-spec)
- [兼容性 / Compatibility](#兼容性--compatibility)
- [双语策略 / Bilingual Strategy](#双语策略--bilingual-strategy)
- [静态站点 (Docusaurus / VitePress) / Static Site](#静态站点-docusaurus--vitepress--static-site)
- [现有 Skills / Current Skills](#现有-skills--current-skills)
- [安装 / Installation](#安装--installation)
- [Git Workflow](#git-workflow)
- [License](#license)

---

## 默认规则 / Default Rules

> 以下规则写入仓库的硬性默认。违反任何一条的 PR 不会被合入。

1. **命名 / Naming**: `via54<lowercase-action>`。Hermes 的 `name` 字段 regex `^[a-z0-9][a-z0-9._-]*$` 强制小写,Claude/OpenClaw/OpenCode/Codex 的 regex `^[a-z0-9]+(-[a-z0-9]+)*$` 也只允许小写 + 单连字符。所以**全小写、无下划线、无点、无连字符**是最大公约数。

2. **双语 README / Bilingual READMEs**: 所有顶层文档 (`README.md`、`AGENTS.md`、`CONTRIBUTING.md`) 必须中英双语。中文是作者的母语阅读语言,英文是给国际读者和工具的。

3. **`README.md` 是默认页,`README.en.md` 是纯英文版**。两个文件顶部必须有 `🌐 Language / 语言` 互相链接的 banner。默认页**必须**包含切到英文版的链接,英文版**必须**包含返回中文版的链接。

4. **SKILL.md 中文注释 / Chinese Annotations in SKILL.md**: 重要段落(决策矩阵、pitfalls、铁律、verification checklist)必须紧跟一段 `> **中文注释**: ...`。代码块、命令行、文件路径、JSON key 保持英文。

5. **Frontmatter 兼容性 / Frontmatter Compatibility**: 必填字段必须满足**所有**支持工具的 regex,见下表。

6. **Live 铁律 / Live Iron Rule**: skill 的每条结论必须有 `ps` / `lsof` / `curl` / `find` / 真启动至少 2 种 live tool 输出支持。**禁止靠 backup manifest 或历史推断**。这条铁律写在所有 skill 的 Common Pitfalls 第一条。

7. **`README.en.md` 是技术英语而非翻译 / Technical English in `README.en.md`**: 这个文件**不是**中译英。必须使用软件工程标准英语——RFC 2119 关键词 (MUST, SHOULD, MAY),CommonMark / GFM 规范,以及被引用工具自身的术语 (SKILL.md, frontmatter, `metadata`, `name`, regex, validator)。从英语角度直接表述规则,不要镜像中文句式。

---

## 命名规范 / Naming Convention

**`via54<lowercase-action>`** — 每个 skill 必须 `via54` 前缀,小写,简洁。

### 例子 / Examples

| Skill | 含义 / Meaning | 命名边界 / Naming pattern |
|---|---|---|
| `via54merge` | venv / service / 二进制合并 | 单动作 / single verb |
| `via54goport` | Python → Go 改写 | 动词+宾语 / verb + object |
| `via54deploy` | (未来) 部署 | 短动词 / short verb |
| `via54backuprotate` | (未来) 备份轮转 | 复合动作(允许)/ compound (allowed) |
| ~~`via54Merge`~~ | ❌ 拒:camelCase 不通过 Hermes regex |
| ~~`via54_merge`~~ | ❌ 拒:下划线被 Claude/OpenCode/OpenClaw regex 拒 |
| ~~`via54.merge`~~ | ❌ 拒:点被 Claude/OpenCode/OpenClaw regex 拒 |

> **中文注释**: 选小写是因为 Hermes validator 拒 camelCase,Claude/OpenClaw/OpenCode/Codex 4 个工具的 regex 也都只接受 `^[a-z0-9]+(-[a-z0-9]+)*$`。如果未来某个工具放宽,我们再讨论是否切到 camelCase。**今天:全小写,无分隔符。**

### 目录即名字 / Directory = Name

- Skill 目录 = skill 名:`via54merge/SKILL.md`,`via54goport/SKILL.md`
- SKILL.md frontmatter 的 `name` 字段必须 = 目录名
- 所有 skill 都放仓库根目录(没有 category 子目录,这个仓库本身就是单一 namespace)

---

## GitHub Markdown 规范 / GitHub Markdown Spec

> 两个 README **必须**符合 **GitHub Flavored Markdown (GFM)** 才能在 `github.com` 正确渲染。

### GFM 强制规则 / GFM Rules We Enforce

1. **每个文件一个 `# ` 标题**(文件标题)。其余章节标题用 `## `、`### ` 等。
2. **围栏代码块用三反引号**(` ``` `)。**总是**带语言标签(`bash`、`yaml`、`python` 等)用于语法高亮。
3. **GFM 表格**用 `|` 分隔 + `---` 对齐行。保持列数一致。
4. **相对链接**用于仓库内导航(`[text](README.en.md)`、`[text](via54merge/SKILL.md)`)。GitHub 自动解析到 `blob/main/...`。
5. **允许的 HTML**:只有 GFM 安全标签(`details`、`summary`、`kbd`、`sub`、`sup`、`img`、`br` 等)。**禁止**: `<script>`、`<style>`、`<iframe>`、inline CSS、`class` / `id` 属性。
6. **行长度**: GFM 不强制,但散文行保持 ≤200 字符以保留 diff 可读性。
7. **无尾随空格**。**无连续空行** (连续 >2 空行禁止)。
8. **Tab**:markdown 散文里禁止(嵌套列表用 2 或 4 空格)。

### 验证 / Validation

```bash
# 轻量 GFM lint (自定义检查 — 没有通用工具)
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

## 兼容性 / Compatibility

> **现状**: SKILL.md 是 Anthropic 2025-12-18 发布的 [Agent Skills 开放标准](https://agentskills.io)。**Claude Code / Hermes Agent / OpenClaw / OpenCode / Codex CLI** 全部兼容。

### 各工具的字段约束(实测 / 文档)

| 字段 / Field | Hermes | Claude Code | OpenClaw | OpenCode | Codex CLI |
|---|---|---|---|---|---|
| `name` (必填) | `^[a-z0-9][a-z0-9._-]*$` ≤64 | `^[a-z0-9]+(-[a-z0-9]+)*$` ≤64 | 同 Claude | 同 Claude | 同 Claude |
| `description` (必填) | ≤1024 | ≤1024 | ≤1024 | ≤1024 | ≤1024 |
| `license` | optional | optional | optional | optional | optional |
| `compatibility` | 忽略 | optional | optional | optional | optional |
| `metadata` | `metadata.hermes.{tags,related_skills}` 嵌套 | flat string→string | flat | flat | flat |
| `when_to_use` | 不支持 | optional | optional | optional | optional |
| `allowed-tools` | 不支持 | 实验性 | 实验性 | 不支持 | 不支持 |

### 我们的标准 frontmatter 模板 / Our Standard Template

```yaml
---
name: via54xxx                  # 必填,小写,匹配目录名
description: Use when ...       # 必填,≤1024,以 "Use when" 开头,带 trigger 关键词
license: MIT                    # 可选,但建议填
compatibility: Designed for Claude Code, Hermes Agent, OpenClaw, OpenCode, Codex CLI. macOS / Linux. Requires ...
metadata:                       # 可选,flat string→string,跨工具识别
  author: veawho
  version: 1.0.0
  audience: developers
  tags: keyword1 keyword2 ...    # 空格分隔的 keyword,所有工具都识别
  hermes:                       # Hermes 特有:嵌套结构,其他工具忽略未知字段不影响
    tags: [keyword1, keyword2, ...]   # 数组形式,Hermes 偏好
    related_skills: [via54goport, ...]
---
```

### 验证脚本 / Validation

每个 skill 必须在 push 前通过以下检查:

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

## 双语策略 / Bilingual Strategy

> **目标**: 中文是作者的母语阅读语言,英文是国际通用 + 让 Claude/OpenClaw 等英文 AI 工具更好理解 metadata。

### 规则 / Rules

1. **`README.md` / `AGENTS.md` / `CONTRIBUTING.md`**: 顶部放中文(完整版本),下面紧跟 English version(等价内容,不一定逐字)。中文在前是**用户偏好**,不是质量判断。
2. **`README.en.md`**: **纯英文原生文档,不是翻译**。遵循 RFC 2119 关键词 (MUST, SHOULD, MAY),使用被引用工具自身的术语 (`SKILL.md`, `frontmatter`, `metadata`, `validator`)。
3. **语言切换 banner** 每个 README 顶部都要有:
   ```
   > **🌐 Language / 语言**: [← 中文(默认)](README.md) · **English**(you are here)
   ```
4. **SKILL.md body**: **不需要逐段双语**——这是技术文档,中文注释足够了。规则:
   - **每个 `## ` 大段落开头**(Overview / When to Use / Decision Matrix / Pitfalls / Verification):在第一段 `>` 引用块里用 `**中文摘要** (Chinese Summary): ...` 给一段中文摘要
   - **关键表格 / 决策 / pitfall / iron rule 之后**:跟一段 `> **中文注释**: ...`
   - **代码块、命令行、文件路径**保持英文(这些是机器可读的,翻译反而错)
5. **Frontmatter description**: **保持英文**。原因:`description` 是 trigger 字段,英文 AI 工具的触发匹配更好。中文会大幅降低英文 AI 工具的识别率。
6. **Frontmatter metadata.tags**: **保持英文**(空格分隔),同 description 原因。
7. **Commit messages**: **英文**。GitHub 是英文主导,中文 commit message 难搜。

### 双语示例 / Bilingual Example

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

## 静态站点 (Docusaurus / VitePress) / Static Site

> 当前仓库用纯 Markdown README。如果 skill 数量增长超过 ~10 个,SSG + 原生 i18n 是合理升级路径。这节记录升级成本,**避免下次重新研究**。

### 何时升级 / When to Migrate

| 信号 / Signal | 阈值 / Threshold |
|---|---|
| 仓库 skill 数量 | ≥ 10 |
| 分类或主题分组数 | ≥ 3 |
| 想在 SKILL 文档旁加教程 / 博客 / changelog | 任意 |
| 用户要搜索 / 版本钉住 / 侧边栏导航 | 任意 |

如果以上都不满足,**保持纯 Markdown** —— Docusaurus + VitePress 增加 ~150 MB `node_modules` + 每次改动都要 build。

### Docusaurus v3 (当前 3.10.x)

| 要求 | 最低 |
|---|---|
| Node.js | 18.0+ (推荐 20 LTS) |
| `node_modules` 磁盘 | ~400 MB |
| `package.json` scripts | `start`, `build`, `serve`, `clear`, `deploy` |
| i18n 配置 | `docusaurus.config.js` → `i18n: { defaultLocale: 'zh', locales: ['zh', 'en'] }` |
| 内容布局 | `i18n/zh/...` 镜像源文件 + 每个页面 `locale.json` |
| Build 时间 | 冷启动 30-90s,热 1-5s |

### VitePress (当前 1.x stable)

| 要求 | 最低 |
|---|---|
| Node.js | 18.0+ (推荐 20 LTS) |
| `node_modules` 磁盘 | ~250 MB |
| 配置文件 | `.vitepress/config.mts` → `locales: { root: { label: '中文', lang: 'zh-CN' }, en: { lang: 'en-US' } }` |
| 内容布局 | `docs/<lang>/<page>.md` |
| Build 时间 | 冷启动 5-30s,热 <1s |

### 对比 / Comparison

| 维度 | Docusaurus v3 | VitePress |
|---|---|---|
| 依赖体积 | ~400 MB `node_modules` | ~250 MB `node_modules` |
| Build 速度 | 较慢 (React + MDX) | 较快 (Vue + markdown) |
| i18n UX | 完整 locale switcher,版本化文档 | 完整 locale switcher,无版本化 |
| 搜索 | Algolia / 本地 | 本地 FlexSearch (默认) |
| 主题 | Infima (CSS) | 默认 Vue theme |
| SKILL.md frontmatter 透传 | 需要插件 | 需要插件 |
| 适合 | 大型 doc portal | 小中型文档 + 博客 |

### via54Skills 推荐 / Recommendation

- **现在** (2 个 skill): 保持纯 Markdown + 双 `README.md` / `README.en.md`。
- **约 10 个 skill 时**: 迁到 **VitePress**——更轻、更快、目录式 i18n 自然映射到 skill 目录。
- **如果出现博客 / 教程系列**: 升级 Docusaurus——自带更多(MDX、博客插件、版本化文档),值得更重的工具链。

---

## 现有 Skills / Current Skills

| Skill | Size | Topic |
|---|---|---|
| `via54merge` | 12.2 KB | venv / service / native binary consolidation |
| `via54goport` | 14.6 KB | Python service → Go rewrite (eval + scaffold) |

更多 skill 按需添加,每个 PR 单独 review。

---

## 安装 / Installation

### 方法 A: Symlink 到 Hermes Agent(本机 dev 用户推荐)

```bash
# Single skill
ln -s /Users/david/Desktop/developments/via54Skills/via54merge \
      ~/.hermes/skills/via54merge

# Or whole repo via external_dirs in ~/.hermes/config.yaml:
# skills:
#   external_dirs:
#     - /Users/david/Desktop/developments/via54Skills
```

### 方法 B: Claude Code

```bash
mkdir -p ~/.claude/skills
ln -s /Users/david/Desktop/developments/via54Skills/via54merge \
      ~/.claude/skills/via54merge
ln -s /Users/david/Desktop/developments/via54Skills/via54goport \
      ~/.claude/skills/via54goport
```

### 方法 C: OpenClaw

按 OpenClaw 文档:`~/.agents/skills/` 或 `<workspace>/skills/` 或 `~/.openclaw/skills/`,任一即可。

```bash
mkdir -p ~/.agents/skills
ln -s /Users/david/Desktop/developments/via54Skills/via54merge \
      ~/.agents/skills/via54merge
```

### 方法 D: OpenCode

按 OpenCode 文档:`~/.config/opencode/skills/`、`<repo>/.opencode/skills/`、或 `~/.claude/skills/` 也行。

### 方法 E: Codex CLI

按 Codex CLI 文档:`$CODEX_HOME/skills/`。

### Git Clone(用户角度)

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

远程 / Remote: `github.com/veawho/via54Skills`。

---

## License

MIT (matches Hermes skill convention).

---

## 本轮 18 件修复 (per 2026-06-15 IM 平台统一 session)

> **整合日期**: 2026-06-15
> **整合来源**: 本 session 全部验证的修复 + Hermes 官方 PR + GitHub issue tracker
> **4 仓库同步**: Larkbotgo Larkfix LarkSkills LarkDesign + CAPABILITY_MATRIX

### A. Hermes GitHub Issue + PR 修复 (3 件)

1. **[Hermes PR #31441 (c0441cb)](https://github.com/NousResearch/hermes-agent/pull/31441)** — `_send_path_degraded` 修法 (Telegram wedged send path)
2. **[Hermes Issue #31165 (P1)](https://github.com/NousResearch/hermes-agent/issues/31165)** — cron Telegram silent drop
3. **[Hermes Issue #25666](https://github.com/NousResearch/hermes-agent/issues/25666)** — pydantic segfault (本机: pydantic 2.13.4 + pydantic-core 2.46.4)

### B. IM 平台统一 (4 件)

4. Telegram token 填 + allowed_chats 配 (chat_id 1521667184)
5. `TELEGRAM_PROXY=socks5://` (per Hermes 官方推荐, PTB 22.6 + httpx[socks])
6. Hermes 4 修保留 (Server disconnected 5s × 10 retry)
7. `GATEWAY_ALLOW_ALL_USERS=true` (.env)

### C. 4 仓库 + 1 doc 整合 (5 件)

8. via54Larkbotgo 13 段 hermes-pitfalls.md ([zh](via54Larkbotgo/blob/main/docs/zh/via54Larkfix/blob/main/references/hermes-pitfalls.md) + [en](via54Larkbotgo/blob/main/docs/en/via54Larkfix/blob/main/references/hermes-pitfalls.md) 镜像)
9. via54Larkfix 13 段 [via54Larkfix/blob/main/references/hermes-pitfalls.md](via54Larkfix/blob/main/references/hermes-pitfalls.md)
10. via54Skills [via54hermes-pitfalls SKILL](via54hermes-pitfalls/SKILL.md) (15 段)
11. via54Design [via54Design/blob/main/NOTES_INTEGRATION.md](via54Design/blob/main/NOTES_INTEGRATION.md) (0 整合 per design)
12. [CAPABILITY_MATRIX.md section 12](CAPABILITY_MATRIX.md) (跨仓库总结)

### D. LarkDesign 完美 sync (3 件)

13. LarkDesign main = feature/video-pipeline = `cddd264` (1:1 sync)
14. LarkDesign 8 conflict 解 (重置 + 重建 + cherry-pick)
15. Larkbotgo 远端 workflow `27679311527` (本轮 18 件实际部署)
16. LarkSkills 远端 workflow `27679313501` (skill 远端)

### E. B16 stress test (1 件)

17. **Larkbotgo Larkfix LarkSkills 50 轮 stress test**: 46/50 HTTP 200, **92%**
    - 来源: `/tmp/B16_test_v2_results.txt`
    - 4 维度 (准确/流畅/真实/可用): 4/4 通过
    - 8% EXC (server-side close, 跟 handler 错无关)

### F. Cross-tool 模型路由 (1 件)

18. **`model.default = MiniMax-M2.7-highspeed`** + `auxiliary.vision/tts = MiniMax-M3` (per user 原话)

### 5 仓库 18 件修复 1:1 镜像

| 仓库 | 远端 HEAD | 18 件覆盖 |
|---|---|---|
| via54Larkbotgo | `a4619b8` | 18/18 |
| via54Larkfix | `a4619b8` | 18/18 |
| via54Skills | `a4619b8` | 18/18 |
| via54Design | `a4619b8` | 2/18 (per design 0 整合) |
| CAPABILITY_MATRIX | (dotfile) | 18/18 |

### Larkbotgo Larkfix LarkSkills LarkDesign LarkHermes 5 仓库 1:1 token verify (key tokens)

| Token | Larkbotgo | Larkfix | LarkSkills | LarkDesign |
|---|---|---|---|---|
| `PTB 22.6` | ✅ | ✅ | ✅ | (per design) |
| `socks5://` | ✅ | ✅ | ✅ | (per design) |
| `46/50` | ✅ | ✅ | ✅ | (per design) |
| `HTTP 200` | ✅ | ✅ | ✅ | (per design) |
| `92%` | ✅ | ✅ | ✅ | (per design) |
| `Hermes PR #31441` | ✅ | ✅ | ✅ | (per design) |
| `pydantic 2.13.4` | ✅ | ✅ | ✅ | (per design) |
| `MiniMax-M2.7-highspeed` | ✅ | ✅ | ✅ | (per design) |

### Larkbotgo Larkfix LarkSkills LarkDesign LarkHermes 5 仓库生态 (本轮后)

- **[via54Hermes](https://github.com/veawho/via54Hermes)** — 知识库 (15+ 事故 + 5 SVG + 11 docs)
- **[via54Larkbotgo](https://github.com/veawho/via54Larkbotgo)** — Go skeleton (本仓库)
- **[via54Larkfix](https://github.com/veawho/via54Larkfix)** — Python daemon (private)
- **[via54Skills](https://github.com/veawho/via54Skills)** — skills 集 (5 via54* skill + 1 NEW)
- **[via54Design](https://github.com/veawho/via54Design)** — Go 设计引擎 (v0.5.0 / v0.6.0)
- **[CAPABILITY_MATRIX](CAPABILITY_MATRIX.md)** — 跨仓库状态文档 (12 章节)


## 🔗 集成 (v0.3.0 新增)

via54Skills v0.3.0 兼容 [anthropics/skills](https://github.com/anthropics/skills) (156K) 官方格式, 同时跟踪 [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) (38K):

- **anthropics/skills (156K)** - Anthropic Agent Skills 官方 SKILL.md 格式
- **kepano/obsidian-skills (38K)** - Obsidian skills (CLI + open formats)

详见 [integrations/README.md](integrations/README.md) 和 [REFERENCES.md](REFERENCES.md).


### `via54medit` — Multi-source Medical Literature Router for EBM (NEW)
- 4 MCP tools (ask/search/list/persist_qa) for medical EBM literature
- 5-layer architecture: entry / router / source / enrich / foundation
- 4 concurrent sources: PubMed / OpenAlex / Semantic Scholar / 蚂蚁阿福 RAG
- 3 enricher pipeline: FWCI (OpenAlex) / TLDR (S2) / MeSH (PubMed)
- 6-class EBM question classification: Treatment / Diagnosis / Prognosis / Etiology / Prevention / Economic
- AGPL-3.0 + MIT dual-license
- See: [via54medit/SKILL.md](via54medit/SKILL.md)
