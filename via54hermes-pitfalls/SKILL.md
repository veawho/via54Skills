---
name: via54hermes-pitfalls
description: Use when integrating any tool, code, or daemon with Hermes Agent (gateway, .env, state.db, memory, Telegram, Feishu), and you hit a silent failure, stale status, or weird behavior. This is a quick-reference index of 11 real incidents from veawho/via54Hermes (private knowledge base) that covers the most common traps. Read this BEFORE debugging mysterious Hermes issues.
---

# via54hermes-pitfalls

> **Source of truth**: [veawho/via54Hermes](https://github.com/veawho/via54Hermes) (private)
> Hermes Agent 自身运维 15+ 事故案例 + 5 架构 SVG
> **Use when**: 你 (AI 助手) 跟 Hermes Agent 整合时遇到 **silent fail / 状态错 / 字段错**。
> **Don't use for**: Hermes 内部架构理解 (用 `via54hermes` 仓库), 飞书 bot 集成 (用 `via54feishu` skill), macOS 启动 (用 `via54macfix` skill)。

---

## Quick-Reference Index (11 个最高频坑)

| # | 坑 | 关键字段 | silent fail 吗? |
|---|---|---|---|
| 1 | `TELEGRAM_PROXY` 选 `socks5://` / `http://` / `https://` 哪个 | `.env` / `config.yaml` | ❌ 间歇断 |
| 2 | `telegram.allowed_chats` 是 chat_id 不是 bot_id | `config.yaml` | ❌ bot 不响应 |
| 3 | `write_file` 对中国古典文本 silent fail | tool 行为 | ✅ **silent fail** |
| 4 | `memory` 字段用 `old_text` 不是 `old_string` | `memory` tool | ✅ **silent fail** |
| 5 | `hermes config set model` flatten nested | `hermes config` CLI | ⚠ partial fail (provider 字段丢) |
| 6 | `C:/Users/...` YAML `\U` 触发 Unicode escape | YAML | ❌ "8 hex digits expected" |
| 7 | `hermes gateway status` stale 5-30s | `hermes gateway` CLI | ❌ false positive |
| 8 | `X-Hermes-Api-Key` header **不工作** | `Authorization: Bearer` 必须 | ❌ 401 |
| 9 | 飞书 Lark approval skill 损坏 | `~/.config/feishu/credentials.json` | ❌ 401/500 |
| 10 | `state.db` 跟 `memory_log.db` 不共享 | SQLite | ❌ "找不到 session" |
| 11 | `via54-mcp` 启动失败 `template-registry.yaml` 缺失 | `~/template-registry.yaml` | ❌ engine init fail |

---

## 详细坑 + 修法 (含来源 incident + 本会话实测)

### 坑 1: Telegram proxy 选 `socks5://` / `http://` / `https://` 哪个?

**症状 (legacy via54Hermes incident 28 文档)**: 写 `http://...` 时 `gateway.log` 反复 "Server disconnected" 5s 重连, `state: "connected"` 是 stale 假阳性。

**真相 (本会话 2026-06-15 修正)**: **该 incident 28 是 telethon 库的时代, 跟现在 PTB 22.x + httpx[socks] 行为不同**。

**Hermes Agent 官方文档 (current, PTB)** — https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram:

> **"Supported schemes: `http://`, `https://`, `socks5://`. The proxy applies to both the main Telegram connection and the fallback IP transport."**

**3 方案实测 (本机 macOS, Clash 7890, 走 api.telegram.org, 10 次稳定性)**:

| scheme | 成功/失败 | 备注 |
|---|---|---|
| `http://127.0.0.1:7890` | **9/10** | 跟 macOS `scutil --proxy` 默认 `HTTPSProxy: 7890` 一致 |
| `socks5://127.0.0.1:7890` | 8/10 | Hermes 官方 config.yaml 示例用此 |
| `socks5h://127.0.0.1:7890` (remote DNS) | 8/10 | 跟 socks5:// 几乎一样 |

**httpx[socks] 实测** (per `pip install httpx[socks]==0.28.1`):
```python
import httpx
httpx.Proxy('socks5://127.0.0.1:7890')   # ✓ build OK (socksio 1.0.0 内置)
with httpx.Client(proxy='socks5://127.0.0.1:7890', timeout=10) as c:
    r = c.get('https://api.telegram.org')  # 302 0.75s ✓
```

**Hermes `resolve_proxy_url()` 优先级** (per `gateway/platforms/base.py:341+`):
1. `TELEGRAM_PROXY` env (highest)
2. `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` (lowercase variants)
3. macOS system proxy via `scutil --proxy` (auto-detect)

**macOS `scutil --proxy` 真返**:
```
HTTPSEnable: 1, HTTPSProxy: 127.0.0.1, HTTPSPort: 7890
SOCKSEnable:  1, SOCKSProxy:  127.0.0.1, SOCKSPort:  7890
HTTPEnable:   1, HTTPProxy:   127.0.0.1, HTTPPort:   7890
```
macOS 启用了 3 个 scheme 全部走 7890 (HTTP/HTTPS/SOCKS 共用)。但 `_detect_macos_system_proxy()` 只返 `http://127.0.0.1:7890` (走 `HTTPEnable` 字段)。

**Hermes gateway.log 实际 proxy 格式** (per 2026-06-15 verify):
```
INFO gateway.platforms.telegram: [Telegram] Proxy detected; passing explicitly to HTTPXRequest: http://127.0.0.1:7890
```

**PTB 22.x vs telethon 关键差异**:

| 库 | 行为 | Hermes 现在用 |
|---|---|---|
| **telethon** | 必须 SOCKS5, http:// silent fail | ❌ (已不常用) |
| **python-telegram-bot 22.6 + httpx[socks]** | 3 scheme 都支持 | ✅ (Hermes 现在用) |

**推荐 (本机 macOS + Hermes v0.16)**:

| 场景 | 选 scheme | 原因 |
|---|---|---|
| **短期不动** | `http://127.0.0.1:7890` (现状) | macOS auto-detect 走通, 9/10 最稳 |
| **中期官方推荐** | `socks5://127.0.0.1:7890` (Hermes config.yaml 示例) | 跟官方示例一致, GFW 抵抗 |
| **公网服务器** | `https://` + 自建 mitmproxy | TLS 加密 CONNECT |

**推荐 yaml** (中期):
```yaml
# ~/.hermes/config.yaml
telegram:
  proxy_url: "socks5://127.0.0.1:7890"
```

**避免**: 误信 via54Hermes incident 28 写 "MUST be socks5://" — 那是 telethon 时代 (2026-05-28), 跟现在 PTB 行为不同 (per 本会话 2026-06-15 验证)。

**真相源**:
- Hermes 官方 docs (current): https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram
- via54Hermes incident 28 (legacy): `~/Desktop/developments/via54Hermes/incidents/2026-05/28-telegram-proxy-http-vs-socks5.md`
- GitHub issue #8908 (socks5://7890 跟 token duplication 无关, proxy 跟 token 是分开 issue)

---

### 坑 2: chat_id ≠ bot_id

**症状**: bot 不响应你的消息, 或循环收自己消息。

**修法**:
```yaml
# config.yaml
telegram:
  allowed_chats: 1521667184    # 你的 chat_id, 不是 bot_id (8765399418)
```

**真相源**: via54Hermes/incidents/2026-05/20-telegram-chatid-vs-botid.md

---

### 坑 3: write_file / patch 对中国古典文本 silent fail

**症状**: `write_file(path, content)` 返 `{"success": true, "bytes_written": N}` 但文件 0 字节或不变。

**触发条件** (全部):
- 文件 content > 1500 字符
- 包含 parallel couplet 模式 (5-char 或 7-char 行)
- classical Chinese 字符 (e.g. 春江花月夜 / 静夜思 / 登鹳雀楼)

**修法**:
- 拆成多个小段写 (每段 < 1500 字符)
- 写完**必 verify**: `wc -c file` 对比 `git show HEAD:file | wc -c`
- SKILL.md 写完用 `grep -c '关键词' file` 验关键 token 真写入

**真相源**: via54Hermes/incidents/2026-06/04-write-file-sensitive-string-silent-fail.md

---

### 坑 4: memory 字段 `old_text` 不是 `old_string`

**症状**: `memory(action="replace", ...)` 返 success 但内容没改。

**修法**:
```python
# ✅ 正确
memory(action="replace", target="memory",
       old_text="model: MiniMax-M2.7",
       content="model: MiniMax-M3")

# ❌ silent fail (patch 字段名)
memory(action="replace", target="memory",
       old_string="model: MiniMax-M2.7",  # ← WRONG
       content="model: MiniMax-M3")
```

**真相源**: via54Hermes/incidents/2026-06/05-memory-old-string-vs-old-text.md + references/memory-api-pitfalls.md

---

### 坑 5: `hermes config set model` flatten nested

**症状**: `~/.hermes/config.yaml` 中 `model:` 从嵌套变 scalar, `provider` 字段丢。

**修法**:
- **不用** `hermes config set model <name>` 改 model
- **手动**用 `sed` 改 `~/.hermes/config.yaml`:
  ```bash
  sed -i 's/  default: .*/  default: MiniMax-M3/' ~/.hermes/config.yaml
  # 保持嵌套结构: model: { default, provider, base_url }
  ```

**真相源**: via54Hermes/incidents/2026-06/09-config-set-model-flattened.md

---

### 坑 6: PyYAML `C:/Users/...` 触发 `\U` Unicode escape

**症状**: `Failed to parse config.yaml: expected escape sequence of 8 hexadecimal numbers`。

**修法**: YAML 字符串里用**双反斜杠** (e.g. `C:\\Users\\...`) 或用 `raw` Python 字符串。

**真相源**: via54Hermes/incidents/2026-06/02-yaml-parse-failure.md + references/windows-paths-pitfalls.md

---

### 坑 7: `hermes gateway status` 返 stale 5-30 秒

**症状**: `hermes gateway status` 说"running", 实际 gateway 已经死。

**修法**:
- **别信** `hermes gateway status`, 用真实验证:
  ```bash
  # 1. 进程真在
  ps aux | grep "hermes_cli.main gateway" | grep -v grep
  # 2. 端口真 listen (per Hermes 默认 18791, 但可能 config 改)
  lsof -nP -iTCP -sTCP:LISTEN | grep -E "18791|8642"
  # 3. 日志真在打
  tail -5 ~/.hermes/logs/gateway.log
  # 4. /health/detailed 真返回 200
  curl -s http://127.0.0.1:8642/health/detailed | python3 -c "import json,sys; print(json.load(sys.stdin)['platforms']['telegram']['state'])"
  ```
- **3 方位铁证**: `ps + lsof + curl` 都通过才算 running

**真相源**: via54Hermes/references/api-server-routes.md ("gateway_state.json is the source of truth. hermes gateway status reports Scheduled Task state (5-30s stale). /health/detailed is live.")

---

### 坑 8: `X-Hermes-Api-Key` header 不工作

**症状**: 调 `/api/sessions` 返 401, 改用 `X-Hermes-Api-Key: *** 没用。

**修法**: 用 `Authorization: Bearer *** (从 `~/.hermes/.env` 拿)。

**真相源**: via54Hermes/references/api-server-routes.md ("X-Hermes-Api-Key header does NOT work. Returns 401. Only Authorization: Bearer *** accepted.")

---

### 坑 9: 飞书 Lark approval skill 损坏

**症状**: Larkfix daemon 启 exit code 1, `Lark approval failed: 401 unauthorized`。

**修法**:
1. 备份还原: `cp ~/.config/feishu/credentials.json.bak ~/.config/feishu/credentials.json`
2. 重启 daemon: `pkill -f feishu_bot_daemon.py && python3 ~/.hermes/scripts/feishu_bot_daemon.py &`
3. 验 WS: `lsof -nP -p <PID> | grep msg-frontier` 看到 `ESTABLISHED`

**真相源**: via54Hermes/incidents/2026-05/15-lark-approval-skill-corrupt.md

---

### 坑 10: state.db 跟 memory_log.db 不共享

**症状**: `session_search` 找到 session, 但 Desktop sidebar 看不到。

**修法**:
- 用 `session_search` 找老 session (memory_log.db 维护)
- 用 Desktop sidebar 看新 session (state.db 维护)
- **两个 DB 不互相迁移**, 老 session 永远在 memory_log.db

**真相源**: via54Hermes/docs/04-state-db/two-session-dbs.md

---

### 坑 11 (本会话新增 2026-06-15): `via54-mcp` 启动失败 `template-registry.yaml` 缺失

**症状**: `via54-mcp` 启时报:
```
MCP 初始化失败: engine init: register not found:
open /Users/david/template-registry.yaml: no such file or directory
```
`/Users/david/.local/bin/via54-mcp` 进程立即 exit, 端口 8090 不 listen。

**根因**: `via54-mcp` 启动时 hardcoded 读 `~/template-registry.yaml` (从 `cmd/via54-mcp/main.go` 源码可知),**不**读 `~/Desktop/developments/via54Design/templates/registry.yaml` 源文件。

**修法** (per 本会话 2026-06-15 验证):
```bash
# 1. 找源文件
ls /Users/david/Desktop/developments/via54Design/templates/registry.yaml
# 2. 复制到 mcp 期望路径
cp /Users/david/Desktop/developments/via54Design/templates/registry.yaml \
   /Users/david/template-registry.yaml
# 3. 重启 via54-mcp (launchd kickstart -k 或前台)
/Users/david/.local/bin/via54-mcp -http :8090 &
# 4. 验证
lsof -nP -iTCP:8090 -sTCP:LISTEN
# 期望: via54-mcp PID X IPv6 *:8090 (LISTEN)
```

**真相源**: via54Design 仓库 `cmd/via54-mcp/main.go` (hardcoded path); 模板源 `templates/registry.yaml` (14.7 KB)

**Pinned 注意**: 本机 `~/template-registry.yaml` 跟 `via54Design/templates/registry.yaml` 内容**不自动同步**。`via54Design` 仓库改了 template, `~/template-registry.yaml` **不会**自动更新。每月需手动 `cp`。

---

## 真相源 (Source of Truth)

- **本地**: `~/Desktop/developments/via54Hermes/` (cloned from `veawho/via54Hermes`)
- **GitHub**: https://github.com/veawho/via54Hermes (private)
- **架构 SVG (5 个)**: `~/Desktop/developments/via54Hermes/assets/diagrams/*.svg`
  - `deployment-topology.svg` (144 节点)
  - `gateway-lifecycle.svg` (112 节点)
  - `state-db-pipeline.svg` (119 节点)
  - `api-server-routing.svg` (156 节点)
  - `telegram-data-flow.svg` (145 节点)

---

## 跟其他 via54* skill 的关系

| Skill | 何时用 |
|---|---|
| `via54feishu` | 飞书 bot 跨 OS 集成 (WebSocket / Webhook) |
| `via54macfix` | macOS 启动 Hermes / 修 plist / spctl |
| `via54merge` | 合并多个 venv / Python 整合 |
| `via54goport` | Python → Go port (用 via54Larkbotgo 模式) |
| **`via54hermes-pitfalls`** | **本 skill**: Hermes 整合的 11 个 silent fail 速查 |

---

## 维护

- 跟 via54Hermes GitHub 同步 (每月 1 次)
- 跟 via54Larkbotgo / Larkfix 仓库的 `references/hermes-pitfalls.md` 内容 1:1 (per design)
- 新 incident 加到 via54Hermes 后, 这里 1 周内 mirror
