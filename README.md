# via54Skills

> **中文**: veawho (Devin Wei) 个人写的 Hermes Agent / Claude / OpenClaw / OpenCode / Codex 通用 Skills 仓库。
> **English**: Personal Skills repository by veawho (Devin Wei), cross-compatible with Hermes Agent, Claude Code, OpenClaw, OpenCode, and Codex CLI.

---

## 📑 目录 / Table of Contents

- [默认规则 / Default Rules](#默认规则--default-rules)
- [命名规范 / Naming Convention](#命名规范--naming-convention)
- [兼容性 / Compatibility](#兼容性--compatibility)
- [双语策略 / Bilingual Strategy](#双语策略--bilingual-strategy)
- [现有 Skills / Current Skills](#现有-skills--current-skills)
- [安装 / Installation](#安装--installation)
- [Git Workflow](#git-workflow)
- [License](#license)

---

## 默认规则 / Default Rules

> **以下规则写入仓库的硬性默认。违反任何一条的 PR 不会被合入。**
> The following are hard defaults for this repo. PRs violating any rule will not be merged.

1. **命名 / Naming**: `via54<lowercase-action>`。Hermes 的 `name` 字段 regex `^[a-z0-9][a-z0-9._-]*$` 强制小写,Claude/OpenClaw/OpenCode/Codex 的 regex `^[a-z0-9]+(-[a-z0-9]+)*$` 也只允许小写 + 单连字符。所以**全小写、无下划线、无点、无连字符**是最大公约数。

2. **双语 README / Bilingual README**: 所有顶层文档(README、AGENTS.md、CONTRIBUTING.md)必须中英双语并列。中文在前(默认),English 跟在后。

3. **中文注释 / Chinese Annotations**: SKILL.md body 里 **重要段落**(决策矩阵、pitfalls、铁律、verification checklist)必须紧跟一段 `> **中文注释**: ...` 解释。目的是让中文用户在阅读时不需要二次翻译。

4. **Frontmatter 兼容性 / Frontmatter Compatibility**: 必填字段必须满足**所有**支持工具的 regex,见下表。

5. **Live 铁律 / Live Iron Rule**: skill 的每条结论必须有 `ps` / `lsof` / `curl` / `find` / 真启动至少 2 种 live tool 输出支持。**禁止靠 backup manifest 或历史推断**。这条铁律写在所有 skill 的 Common Pitfalls 第一条。

---

## 命名规范 / Naming Convention

**`via54<lowercase-action>`** — 每个 skill 必须 `via54` 前缀,小写,简洁。

### 例子 / Examples

| Skill | 含义 / Meaning | 命名边界 |
|---|---|---|
| `via54merge` | venv / service / 二进制合并 | 单动作 |
| `via54goport` | Python → Go 改写 | 动词+宾语 |
| `via54deploy` | (未来) 部署 | 短动词 |
| `via54backuprotate` | (未来) 备份轮转 | 复合动作(允许) |
| ~~`via54Merge`~~ | ❌ 拒:camelCase 不通过 Hermes regex |
| ~~`via54_merge`~~ | ❌ 拒:下划线被 Claude/OpenCode/OpenClaw regex 拒 |
| ~~`via54.merge`~~ | ❌ 拒:点被 Claude/OpenCode/OpenClaw regex 拒 |

> **中文注释**: 选小写是因为 Hermes validator 拒 camelCase,Claude/OpenClaw/OpenCode/Codex 4 个工具的 regex 也都只接受 `^[a-z0-9]+(-[a-z0-9]+)*$`。如果未来某个工具放宽,我们再讨论是否切到 camelCase。**今天:全小写,无分隔符。**

### 目录即名字 / Directory = Name

- Skill 目录 = skill 名:`via54merge/SKILL.md`,`via54goport/SKILL.md`
- SKILL.md frontmatter 的 `name` 字段必须 = 目录名
- 所有 skill 都放仓库根目录(没有 category 子目录,这个仓库本身就是单一 namespace)

---

## 兼容性 / Compatibility

> **现状**: SKILL.md 是 Anthropic 2025-12-18 发布的 [Agent Skills 开放标准](https://agentskills.io)。**Claude Code / Hermes Agent / OpenClaw / OpenCode / Codex CLI** 全部兼容。

### 各工具的字段约束(实测 / 文档)

| 字段 / Field | Hermes | Claude Code | OpenClaw | OpenCode | Codex CLI |
|---|---|---|---|---|---|
| `name` (必填) | `^[a-z0-9][a-z0-9._-]*$` ≤64 | `^[a-z0-9]+(-[a-z0-9]+)*$` ≤64 | 同 Claude | 同 Claude | 同 Claude |
| `description` (必填) | ≤1024 | ≤1024 | ≤1024 | ≤1024 | ≤1024 |
| `license` | optional | optional | optional | optional | optional |
| `compatibility` | **忽略** | optional | optional | optional | optional |
| `metadata` | `metadata.hermes.{tags,related_skills}` 嵌套 | flat string→string | flat | flat | flat |
| `when_to_use` | **不支持** | optional | optional | optional | optional |
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

> **目标**: 中文是默认阅读语言,英文是国际通用 + 让 Claude/OpenClaw 等英文 AI 工具更好理解。

### 规则 / Rules

1. **README / AGENTS.md / CONTRIBUTING.md**: 顶部放中文(完整版本),下面紧跟 English version(等价内容,不一定逐字)。中文在前是**用户偏好**,不是质量判断。

2. **SKILL.md body**: **不需要逐段双语**——这是技术文档,中文注释足够了。规则:
   - **每个 `## ` 大段落开头**(Overview / When to Use / Decision Matrix / Pitfalls / Verification):在第一段 `>` 引用块里用 `**中文摘要** (Chinese Summary): ...` 给一段中文摘要
   - **关键表格 / 决策 / pitfall / iron rule 之后**:跟一段 `> **中文注释**: ...`
   - 代码块、命令行、文件路径**保持英文**(这些是机器可读的,翻译反而错)

3. **Frontmatter description**: **保持英文**。原因:`description` 是 trigger 字段,英文 AI 工具的触发匹配更好。中文会大幅降低英文 AI 工具的识别率。

4. **Frontmatter metadata.tags**: **保持英文**(空格分隔),同 description 原因。

5. **Commit messages**: **英文**。GitHub 是英文主导,中文 commit message 难搜。

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