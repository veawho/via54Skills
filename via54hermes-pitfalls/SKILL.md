---
name: via54hermes-pitfalls
description: Use when integrating any tool, code, or daemon with Hermes Agent (gateway, .env, state.db, memory, Telegram, Feishu), and you hit a silent failure, stale status, or weird behavior. This is a quick-reference index of 10 real incidents from veawho/via54Hermes (private knowledge base) that covers the most common traps. Read this BEFORE debugging mysterious Hermes issues.
---

# via54hermes-pitfalls

> **Source of truth**: [veawho/via54Hermes](https://github.com/veawho/via54Hermes) (private)
> Hermes Agent 自身运维 15+ 事故案例 + 5 架构 SVG
> **Use when**: 你 (AI 助手) 跟 Hermes Agent 整合时遇到**silent fail / 状态错 / 字段错**。
> **Don't use for**: Hermes 内部架构理解 (用 `via54hermes` 仓库), 飞书 bot 集成
> (用 `via54feishu` skill), macOS 启动 (用 `via54macfix` skill)。

---

## Quick-Reference Index (10 个最高频坑)

| # | 坑 | 关键字段 | silent fail 吗? |
|---|---|---|---|
| 1 | `TELEGRAM_PROXY` 必须是 `socks5://` | `.env` | ❌ 显式错 |
| 2 | `telegram.allowed_chats` 是 chat_id 不是 bot_id | `config.yaml` | ❌ bot 不响应 |
| 3 | `write_file` 对中国古典文本 silent fail | tool 行为 | ✅ **silent fail** |
| 4 | `memory` 字段用 `old_text` 不是 `old_string` | `memory` tool | ✅ **silent fail** |
| 5 | `hermes config set model` flatten nested | `hermes config` CLI | ⚠ partial fail (provider 字段丢) |
| 6 | `C:/Users/...` YAML `\U` 触发 Unicode escape | YAML | ❌ "8 hex digits expected" |
| 7 | `hermes gateway status` stale 5-30s | `hermes gateway` CLI | ❌ false positive |
| 8 | `X-Hermes-Api-Key` header **不工作** | `Authorization: Bearer` 必须 | ❌ 401 |
| 9 | 飞书 Lark approval skill 损坏 | `~/.config/feishu/credentials.json` | ❌ 401/500 |
| 10 | `state.db` 跟 `memory_log.db` 不共享 | SQLite | ❌ "找不到 session" |

---

## 详细坑 + 修法 (含来源 incident)

### 坑 1: Telegram proxy `socks5://` 不是 `http://`

**症状**: `gateway.log` 反复 "Server disconnected" 5s 重连, `state: "connected"` 是 stale 假阳性。

**修法**:
```bash
# .env
TELEGRAM_PROXY=socks5://127.0.0.1:7890   # ← 强制 scheme
```

**真相源**: via54Hermes/incidents/2026-05/28-telegram-proxy-http-vs-socks5.md

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
  # 2. 端口真 listen
  lsof -nP -iTCP:18791 -sTCP:LISTEN  # default gateway port
  # 3. 日志真在打
  tail -5 ~/.hermes/logs/gateway.log
  # 4. /health/detailed 真返回 200
  curl -s http://127.0.0.1:8642/health/detailed | python3 -c "import json,sys; print(json.load(sys.stdin)['platforms']['telegram']['state'])"
  ```
- **3 方位铁证**: `ps + lsof + curl` 都通过才算 running

**真相源**: via54Hermes/references/api-server-routes.md ("gateway_state.json is the source of truth. hermes gateway status reports Scheduled Task state (5-30s stale). /health/detailed is live.")

---

### 坑 8: `X-Hermes-Api-Key` header 不工作

**症状**: 调 `/api/sessions` 返 401, 改用 `X-Hermes-Api-Key: <key>` 没用。

**修法**: 用 `Authorization: Bearer <key>` (从 `~/.hermes/.env` 拿)。

**真相源**: via54Hermes/references/api-server-routes.md ("X-Hermes-Api-Key header does NOT work. Returns 401. Only Authorization: Bearer is accepted.")

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
| **`via54hermes-pitfalls`** | **本 skill**: Hermes 整合的 10 个 silent fail 速查 |

---

## 维护

- 跟 via54Hermes GitHub 同步 (每月 1 次)
- 跟 via54Larkbotgo / Larkfix 仓库的 `references/hermes-pitfalls.md` 内容 1:1 (per design)
- 新 incident 加到 via54Hermes 后, 这里 1 周内 mirror
