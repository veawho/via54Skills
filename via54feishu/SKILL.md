---
name: via54feishu
description: Use when integrating any AI agent or AI tool (Hermes, OpenClaw, Codex, AI-IDE tools, Antigravity, Claude, Qclaw, minimax-code, etc.) with a Feishu/Lark bot for DM, group chat, and Feishu Docs. Covers permission scope opening, WebSocket long-connection vs Webhook selection, multi-OS install (macOS/Windows/Linux), AI tool integration matrix (Pattern A inbox/outbox bridge vs Pattern B direct API adapter), end-to-end runbook, and known macOS gotchas (spctl, com.apple.provenance xattr, launchd throttle).
license: MIT
compatibility: Designed for Claude Code, Hermes Agent, OpenClaw, OpenCode, Codex CLI. macOS / Linux / Windows.
metadata:
  author: veawho
  version: 1.0.0
  audience: developers
  tags: feishu lark bot ai-agent integration multi-os
  hermes:
    tags: [feishu, lark, bot, ai-agent, multi-os, macos, windows, linux, websocket, webhook, hermes, openclaw, codex, antigravity, claude, qclaw, minimax-code]
    related_skills: [via54macfix, via54merge, via54goport]
---

# via54feishu — Feishu/Lark bot 跨 OS + 多 AI 工具集成

> **中文摘要 (Chinese Summary)**: 把 Feishu/Lark bot 接到 Hermes、OpenClaw、Codex、
> AI-IDE 工具(Claude/Cursor/Windsurf)、Antigravity、Qclaw、minimax-code 等
> 任意 AI agent / AI 工具。涵盖 **私聊/群聊/飞书文档 3 大能力的权限开通**、
> **WebSocket 长连接 vs Webhook 2 种连接方式选择**、**macOS/Windows/Linux
> 3 OS 安装**、**8 个 AI 工具的集成矩阵**、**inbox/outbox IPC 协议**(bot
> daemon ↔ AI agent 桥)、**端到端跑通 example**。

> 📄 **真值源**: `github.com/veawho/via54Larkbotgo` 仓库的 `docs/` 子目录 (中英双语 VitePress 站点,18 个 markdown, ~120 KB)。本 skill 是浓缩版,**具体语法和示例代码以仓库 docs 为准**。

---

## When to Use

Use this skill when:

- ✅ **你要在 Feishu/Lark 跟一个 AI agent 对接** (Hermes、OpenClaw、Codex、Qclaw、minimax-code 等本地 daemon 类的)
- ✅ **你要在 macOS/Windows/Linux 上部署 Feishu/Lark bot** (跨 OS 安装)
- ✅ **你要选 WebSocket 长连接 vs Webhook** (哪种连接方式适合你)
- ✅ **你要在飞书 app 后台开通权限** (私聊/群聊/飞书文档 3 大能力需要的 scope)
- ✅ **你要在 IDE 类 AI 工具(Claude Code / Cursor / Windsurf)里集成飞书 bot** (Pattern B API adapter)

Do NOT use this skill when:

- ❌ 你只想调飞书开放平台发消息 (用各语言 SDK 直接调即可,不需要 inbox/outbox 桥)
- ❌ 你用第三方 IM(BotFramework / Discord / Slack / Telegram)而不是飞书/Lark
- ❌ 你要 host 飞书 app backend 自身的运营 (这不是 bot 集成问题)

---

## What this skill covers

按主人原话(per definition):
> "在不同系统(macOS/Windows/linux)中,让 aiagent 和 AI 工具等(包括但不限于 hermes、openclaw、codex、AI-IDE 工具、antigravity、claude、Qclaw、minimax-code 等等)可以更好地接入飞书 bot/Lark bot,需要集成 bot 的私聊/群聊/飞书文档等全能力的权限开通说明、长连接和 webhook 两种连接方式的说明等等"

**6 大块内容**:

1. **权限开通 (per capabilities)** — 飞书 app 后台 11 个 scope × 私聊/群聊/飞书文档 3 大能力
2. **连接方式对比** — WebSocket (默认,本机/内网) vs Webhook (多副本/公网)
3. **多 OS 安装指南** — macOS spctl / Windows NSSM / Linux systemd
4. **AI 工具集成矩阵** — 8 个工具 × 2 种范式 (Pattern A inbox/outbox 桥, Pattern B API adapter)
5. **inbox/outbox IPC 协议** — bot daemon ↔ AI agent 之间的文件契约 (跨语言)
6. **端到端跑通 example** — Hermes ↔ Go skeleton 7 步实跑

---

## Decision tree (开始之前)

```
你要对接的 AI 工具跑在哪里?
  ├── 本机/内网 (无公网 IP)
  │     ↓
  │     → 范式 A: inbox/outbox 桥
  │     → 选 WebSocket 长连接 (默认)
  │     → 你的 bot daemon 装在 ~/.local/bin/ (避免 macOS spctl 拒绝)
  │
  └── 公网服务器 (有公网 IP + DNS + TLS)
        ↓
        需要多副本/高可用?
        ├── 是 → 选 Webhook
        └── 否 → 选 WebSocket (更简单)
              ↓
              → 范式 A (inbox/outbox 桥) 或 范式 B (直接 API adapter)
```

> 📖 **详细决策**: 仓库 `docs/zh/guides/connection-modes.md` 或 `docs/en/guides/connection-modes.md`

---

## Quick start (Hermes on macOS, WebSocket)

```bash
# 1. 飞书 app 后台: 创建企业自建应用, 开通 scope (见 reference/permissions.md)
# 2. 凭证
echo '{"app_id": "cli_xxx", "app_secret": "yyy"}' > ~/.config/feishu/credentials.json
chmod 600 ~/.config/feishu/credentials.json

# 3. Python deps (Hermes inbox_watcher + 飞书 SDK)
~/.hermes/bin/uv venv --python 3.11 ~/.local/share/feishu-cli/venv
~/.hermes/bin/uv pip install --python ~/.local/share/feishu-cli/venv/bin/python3 \
  lark-oapi websockets cryptography requests

# 4. 装 Go skeleton (或保留 Python daemon)
cd ~/Desktop/developments
git clone https://github.com/veawho/via54Larkbotgo.git
cd via54Larkbotgo
go build -o bin/via54Larkbotgo ./
ln -sf $PWD/bin/via54Larkbotgo ~/.local/bin/via54Larkbotgo
chmod +x ~/.local/bin/via54Larkbotgo

# 5. 启 bot
~/.local/bin/via54Larkbotgo --app-id cli_xxx --app-secret yyy &

# 6. 启 inbox_watcher (Hermes 端)
~/.hermes/hermes-agent/venv/bin/python3 \
  ~/.hermes/scripts/inbox_watcher.py --foreground &

# 7. 飞书给 bot 发私聊, 收到 LLM 回复
```

> 📖 **完整 step-by-step**: 仓库 `docs/zh/guides/ai-tools-hermes.md` 或 `docs/zh/guides/e2e-hermes-bot.md`

---

## 1. Permission scopes (3 capabilities)

| Capability | Required scope | Why |
|---|---|---|
| **DM (私聊)** | `im:message` | Subscribe to `im.message.receive_v1` |
| **Group (群聊)** | `im:message.group_at_msg` (or `im:message` for all) | @bot 或 all |
| **DM/Group send** | `im:message.send_as_bot` | POST `/im/v1/messages` |
| **Feishu Docs read** | `docx:document:readonly` | GET doc content |
| **Feishu Docs edit** | `docx:document` | edit docs |
| **Feishu Docs create** | `docx:document:create` | POST new doc |
| **open_id lookup** | `contact:user.id:readonly` | sender lookup |

> 详细 11 scope 列表 + per-OS 验证路径: `reference/permissions.md`

---

## 2. WebSocket vs Webhook

| 维度 | WebSocket 长连接 | Webhook (HTTPS 回调) |
|---|---|---|
| 方向 | bot 主动连飞书 | 飞书主动 POST 你 |
| 公网 IP | ❌ 不需要 | ✅ 必须 |
| 延迟 | 实时 < 100ms | 200ms-2s |
| 多实例 | 互斥 | 任意 |
| 复杂度 | SDK 内置 | 自己 HTTPS server + 验签 |
| **适合** | **本机/内网 AI 工具 (默认)** | 公网 SaaS 多副本 |

> **默认用 WebSocket**。只有需要多副本/高可用才用 Webhook。

---

## 3. Multi-OS install (cheat sheet)

### macOS ⚠️ 3 gotchas

```bash
# Gotcha 1: spctl 拒绝 /usr/local/bin/
cp via54 ~/.local/bin/  # 装到 $HOME 跳过 quarantine
chmod +x ~/.local/bin/via54

# Gotcha 2: Sequoia com.apple.provenance xattr
# 用直接命令行启 bot, 不要用 launchd plist (launchd 子进程拒读)
~/.local/bin/via54Larkbotgo --app-id cli_xxx --app-secret yyy &

# Gotcha 3: launchd throttle
# 多次 bootstrap 失败触发 5-15 分钟 throttle
sleep 90 && launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.david.feishu-bot.plist
```

### Windows (WSL2 recommended)

```bash
wsl
sudo apt install python3.11
curl -LsSf https://astral.sh/uv/install.sh | sh
~/.cargo/bin/uv venv --python 3.11 ~/.local/share/feishu-cli/venv
~/.cargo/bin/uv pip install --python ~/.local/share/feishu-cli/venv/bin/python3 lark-oapi
```

### Linux (systemd user)

```ini
# ~/.config/systemd/user/feishu-bot.service
[Service]
ExecStart=%h/.local/bin/via54Larkbotgo --app-id cli_xxx --app-secret yyy
Restart=on-failure
StandardOutput=append:%h/.hermes/logs/feishu-bot.out.log
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now feishu-bot.service
loginctl enable-linger $USER  # 开机自启
```

---

## 4. AI tool integration matrix

| 工具 | 范式 A (inbox/outbox) | 范式 B (API adapter) | 状态 |
|---|---|---|---|
| **Hermes** | ✅ `inbox_watcher.py` (本机实跑) | n/a | ✅ |
| **OpenClaw** | ✅ 同 Hermes | n/a | 🚧 doc |
| **Codex CLI** | ✅ 同 Hermes | n/a | 🚧 doc |
| **Qclaw / antigravity / minimax-code** | ✅ 同 Hermes | n/a | 🚧 doc |
| **Claude Code** | n/a | ✅ Anthropic SDK + Feishu streaming | 🚧 doc |
| **Cursor / Windsurf** | n/a | ✅ LSP plugin | 🚧 doc |

**范式 A** (inbox/outbox 桥,适合 AI Agent):
- bot daemon 写 `/tmp/hermes_inbox/<msg_id>.json`
- AI Agent 端 daemon (e.g. Hermes `inbox_watcher.py`) 读 inbox → 调 LLM → 写 outbox
- bot daemon 读 outbox → POST 飞书

**范式 B** (API adapter,适合 AI-IDE 工具):
- bot daemon 直接调 Claude SDK / OpenAI API
- 拿 streaming response → 飞书流式回复
- 无 inbox/outbox 中间层

---

## 5. inbox/outbox protocol (核心契约)

`/tmp/hermes_inbox/<msg_id>.json` schema:
```json
{
  "msg_id":      "om_xxxxxxxx",
  "chat_id":     "oc_xxxxxxxx",
  "text":        "今天天气怎么样",
  "sender":      "ou_xxxxxxxx",
  "received_at": 1717920000.123
}
```

State machine:
```
/tmp/hermes_inbox/<msg_id>.json     ← bot daemon writes
       ↓
.processing/<msg_id>.json         ← per-msg lock (watcher)
       ↓
.done/<msg_id>.json               ← success
.error/<msg_id>.retry<N>.json     ← failure (60s backoff, max 3)
.badjson                          ← parse fail (no retry)
```

> 完整 22KB 规范: `reference/protocol/feishu_inbox_protocol.md` 或仓库 `docs/.../feishu-inbox-protocol.md`

---

## 6. E2E runbook (7 步)

1. 启 inbox_watcher (前台,期望 log "fsnotify enabled")
2. 启 bot daemon (前台,期望 log "ws client connecting")
3. 飞书私聊 bot 发消息
4. 看消息流: `ls /tmp/hermes_inbox/`, `tail inbox-watcher.out.log`, `ls /tmp/hermes_outbox/`, `tail via54Larkbotgo.log`
5. 飞书收到 LLM 回复
6. 错误处理测试: `.error/`, `.done/`, `oc_test_` prefix skip
7. 退出清理: `pkill`, `rm inbox/outbox`

---

## Common Pitfalls (铁律)

> **中文注释**: 这一节是本仓库总结的**最关键的 5 个坑**, 犯了任何一条
> 飞书 bot 集成都会失败。优先级: macOS > launchd > 协议 > scope > Hermes。

### 1. macOS spctl 拒绝 (HIGH)
```bash
# ❌ 会失败: "cannot be opened because the developer cannot be verified"
cp via54 /usr/local/bin/
# ✅ 装到 $HOME
cp via54 ~/.local/bin/
```

### 2. macOS Sequoia provenance xattr (HIGH)
- `com.apple.provenance` xattr 让 launchd 子进程拒读 binary
- 解: 飞书 bot daemon **直接用命令行启**, **不要**走 launchd plist
- via54Design 的 `.local/bin/via54` 是给用户调,不是给 launchd 启 daemon

### 3. launchd throttle (MEDIUM)
- 短时间内多次 `launchctl bootstrap` 失败 → 5-15 分钟 throttle (I/O 错 5)
- 错误码 `Bootstrap failed: 5: Input/output error`
- 解: 等 60-90s, 或 `sudo launchctl bootstrap`

### 4. oc_test_ chat_id 漏处理 (LOW)
- 飞书 app 后台给开发测试群 chat_id 加 `oc_test_` 前缀
- bot daemon 见到这个前缀**跳过 Feishu POST**(避免开发时骚扰真实用户)
- 必须**有**这条 fallback, 否则开发环境会 spam 飞书

### 5. inbox 跟 outbox 不同 FS (HIGH)
- macOS /tmp 是 APFS (同 FS), atomic rename OK
- WSL2 内 `/tmp` 是 tmpfs, 跟 Windows `%TEMP%` (NTFS) 不同 — cross-FS atomic rename **会失败**
- 规则: bot daemon 跟 inbox_watcher **必须在同一台机 + 同一 FS**

> 详细 macOS gotchas: `via54macfix` skill
> 详细 inbox 协议: `reference/protocol/feishu_inbox_protocol.md`

---

## Verification checklist (per integration)

- [ ] 飞书 app 后台 3 大能力 scope 开通
- [ ] 事件订阅 `im.message.receive_v1` 已配
- [ ] `~/.config/feishu/credentials.json` 写入, `chmod 600`
- [ ] Python deps (lark-oapi 等) 装好
- [ ] Go skeleton (或 Python daemon) 编译 + 启动
- [ ] inbox_watcher (Hermes 端) 启动 + fsnotify enabled
- [ ] 飞书发私聊 → 收到 LLM 回复
- [ ] 飞书发群 @bot → 收到 LLM 回复
- [ ] (可选) 飞书文档读写 (需要 docx:document scope)
- [ ] launchd / systemd service 配开机自启 (可选)

---

## Related skills

- **via54macfix** — macOS 二进制路径修复 (spctl / provenance xattr) — **必读** 如果目标 OS 是 macOS
- **via54merge** — venv / service / 二进制合并决策 (跟本 skill 配合)
- **via54goport** — Python → Go 改写评估 (如果要替换 Python daemon 用 Go skeleton)
- **via54Larkfix** (separate repo) — 飞书 CLI + 多 OS 部署完整归档 (private)
- **via54Larkbotgo** (separate repo) — 本 skill 的真值源仓库 (含完整中英 docs)

---

## References

- [via54Larkbotgo 仓库](https://github.com/veawho/via54Larkbotgo) — 真值源, 18 docs 中英双语
- [via54Larkfix 仓库](https://github.com/veawho/via54Larkfix) — 飞书 CLI + 多 OS 完整归档 (private)
- [Feishu 开放平台](https://open.feishu.cn/app) — 创建企业自建应用
- [Feishu OpenAPI 文档](https://open.feishu.cn/document/server-docs/api-call-guide/server-api-list) — API 参考
- [飞书 SDK (Python)](https://github.com/larksuite/oapi-sdk-python)
- [飞书 SDK (Go)](https://github.com/larksuite/oapi-sdk-go)

---

> 📝 **维护提示**: 本 skill 浓缩自 `via54Larkbotgo` 仓库 (中英 18 docs, ~120 KB)。
> 仓库是 ground truth,这里只是 quick reference。**Skills / docs 任何修改,记得更新 ground truth 仓库**。