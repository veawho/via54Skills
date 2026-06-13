---
name: via54goport
description: Use when evaluating whether to rewrite a Python daemon or service in Go (or when actually doing the rewrite). Covers the "should I rewrite?" decision matrix, feasibility checks (SDK availability, LOC, IPC model), skeleton scaffolding with larksuite/oapi-sdk-go or similar Go SDKs, file-IPC compatibility with existing Python consumers, and parallel dual-runtime migration strategies.
license: MIT
compatibility: Designed for Claude Code, Hermes Agent, OpenClaw, OpenCode, Codex CLI. macOS / Linux / Windows. Requires Go 1.21+, gh CLI, and Python 3.11+ for the pre-rewrite inventory.
metadata:
  author: veawho
  version: 1.0.0
  audience: developers
  tags: go python rewrite port migration services lark feishu
  hermes:
    tags: [go, python, rewrite, port, migration, services, lark, feishu]
    related_skills: [via54merge, hermes-agent-skill-authoring, plan]
---

# via54goport — Evaluate & Rewrite Python Services in Go

> **中文摘要** (Chinese Summary): 本技能用于判断是否要把 Python daemon / service 改写成 Go(或真做改写)。覆盖"该不该改写"的决策矩阵、可行性检查(SDK 可用性、LOC、IPC 模型)、用 larksuite/oapi-sdk-go 等 Go SDK 搭 skeleton、与现有 Python consumer 的 file-IPC 字节兼容、以及双 runtime 并行迁移策略。

## Overview

The Go rewrite question comes up whenever Python startup latency, venv weight, or daemon count is annoying. The honest answer is usually "no, don't rewrite" — but for a small class of services (WS long connections, file-system IPC, simple subprocess orchestration) Go is genuinely cheaper to operate. This skill teaches you to **distinguish the two cases honestly**, and when the answer is "yes", gives you the skeleton + verification path that won't blow up the existing Python consumers downstream.

> **中文注释**: 改写问题的诚实回答通常是"不要改"。但对一小类服务(WS 长连接、文件系统 IPC、简单 subprocess 编排),Go 真的更省运维。本技能教你怎么诚实区分两类情况。

## When to Use

- A Python daemon is in your critical path (consumer of `/tmp/...` IPC, or upstream of one).
- The daemon has <1000 lines and depends only on libraries that have **mature official Go SDKs** (Feishu/Lark, AWS, GCP, Slack, GitHub).
- You're tired of venv bloat and want to fold the daemon into the same `~/.local/bin/<tool>` namespace as your Go binaries.
- The daemon's main loop is **polling / file watching / WS long connection** — these translate 1:1 to Go.

## When NOT to Use

- The Python service is part of a much larger Python framework (Hermes Agent, Django, FastAPI) — rewriting pulls in 100k+ LOC.
- The service **subprocess-calls another Python service** to do real work (e.g. subprocess → hermes-agent venv → LLM call). The Go rewrite can't help here — you still pay the Python startup cost.
- The Python service depends on libraries with **no Go equivalent** (scikit-learn, pandas, langchain, torch). Don't reimplement ML in Go.
- The Python service has heavy `asyncio` patterns or `*args/**kwargs` reflection — Go's static typing makes this painful.

## Decision Matrix

Before writing any Go, score these:

> **中文注释**: 决策矩阵。≥9 强烈改写,6-8 改一个保留其他,≤5 改 Python 而不是改 Go。

| Criterion | 0 (don't rewrite) | 1 (possible) | 2 (definitely) |
|---|---|---|---|
| Service LOC | >2000 | 500-2000 | <500 |
| Pure deps have Go SDK | <50% | 50-80% | >80% |
| IPC is file-based / WS / TCP | subprocess chains | mixed | clean IPC |
| Restart frequency | Once per host | Daily | Hourly or more |
| Memory ceiling | Need >500MB | 200-500MB | <200MB |
| Team Go fluency | None | Some | High |

Sum scores. **≥9** = strong yes, write the skeleton. **6-8** = rewrite only one specific daemon at a time, leave the rest. **≤5** = fix the Python instead (memory tuning, single-file rewrite, faster interpreter).

## Feasibility Check (Before You Write a Line)

For each external library the Python service imports, ask: **does an official Go SDK exist, and is it production-quality?**

```bash
# 1. List all third-party imports in the service
grep -E "^(import|from) " /path/to/service.py | grep -vE "^(import|from) (os|sys|json|time|re|threading|shutil|glob|subprocess|warnings|urllib|ssl|pathlib|argparse|signal|typing|__future__)"
# → output: import lark_oapi; import websockets; import cryptography; ...

# 2. For each, search pkg.go.dev / GitHub:
# Example for lark-oapi:
gh search repos larksuite/oapi-sdk-go --limit 3
# Look for: official org, recent commits (within 6 months), >100 stars, MIT/Apache license
```

> **铁律 (Iron Rule)**: 除非 SDK 存在 **且** 来自与 Python 同一个组织(或官方背书的 mirror),不要开始改写。社区移植滞后 6-12 个月,会漏 edge case。

**Iron rule**: never start a Go rewrite unless the SDK exists **and** is from the same org as the Python one (or an officially blessed mirror). Community ports lag by 6-12 months and miss edge cases.

## Pre-Rewrite Inventory

Same as `via54merge`: live state, not backup manifest text.

```bash
# 1. Service LOC + actual structure
wc -l /path/to/service.py
grep -nE "^(def |class )" /path/to/service.py | head -30

# 2. Where it writes / reads (the IPC contract)
grep -nE "open\(|write_text|read_text|/tmp/" /path/to/service.py | head -20

# 3. What subprocess calls it makes (this is what Go can't eliminate)
grep -nE "subprocess\.(run|Popen|call)" /path/to/service.py | head -10

# 4. Live process check
ps aux | grep service_name | grep -v grep

# 5. All launchd / systemd units that reference it
grep -l service_name /etc/systemd/system/*.service ~/Library/LaunchAgents/*.plist 2>/dev/null
```

## Skeleton Scaffolding (the lark-oapi case study)

This is the pattern that worked for `feishu_bot_daemon.py` (851 LOC Python → 245 LOC Go skeleton).

### Step 1 — Verify the Go SDK has the event model you need

```bash
go get github.com/larksuite/oapi-sdk-go/v3@latest
GOMOD=$(go env GOPATH)/pkg/mod/github.com/larksuite/oapi-sdk-go/v3@*

# What's the entrypoint? (WS client, REST client, channel wrapper?)
grep -E "^func New" "$GOMOD/ws/client.go" | head -3

# Is there a high-level channel abstraction?
ls "$GOMOD/channel/" 2>&1 | head -10
grep -E "OnMessage|OnReaction|OnCard" "$GOMOD/channel/channel.go" | head -5

# What's the message type?
grep -B2 -A20 "type NormalizedMessage" "$GOMOD/channel/types/types.go" | head -30
```

### Step 2 — Initialize the module + pull transitive deps

```bash
mkdir -p ~/Desktop/developments/feishu-bot-go
cd ~/Desktop/developments/feishu-bot-go
go mod init github.com/<user>/feishu-bot-go
go get github.com/larksuite/oapi-sdk-go/v3@latest
# This may pull gogo/protobuf, gorilla/websocket — let go mod tidy resolve
go mod tidy
```

**Gotcha**: `go mod tidy` can hang or fail on `proxy.golang.org` (slow / blocked). If so, manually:
```bash
go get github.com/larksuite/oapi-sdk-go/v3/ws@latest
go get github.com/gorilla/websocket@v1.5.0
go get github.com/gogo/protobuf@v1.3.2
```

> **中文注释**: `go mod tidy` 在网络受限环境会卡住或失败。如果失败,手动 `go get` 子包+ transitive deps。

### Step 3 — Write the skeleton

The skeleton must:
- Connect WS (via the SDK's high-level channel)
- Bridge SDK events → existing IPC (file /tmp/hermes_inbox/<msg_id>.json)
- Poll existing IPC (file /tmp/hermes_outbox/*.json) → SDK API call
- Run as foreground process, not daemon, until verified

```go
// main.go skeleton pattern
package main

import (
    lark "github.com/larksuite/oapi-sdk-go/v3"
    larkchannel "github.com/larksuite/oapi-sdk-go/v3/channel"
    larktypes "github.com/larksuite/oapi-sdk-go/v3/channel/types"
    larkws "github.com/larksuite/oapi-sdk-go/v3/ws"
)

func main() {
    // 1. REST client (for sending messages)
    restClient := lark.NewClient(appID, appSecret)
    
    // 2. WS long-connection
    wsClient := larkws.NewClient(appID, appSecret,
        larkws.WithLogLevel(larkcore.LogLevelInfo),
    )
    
    // 3. Channel (high-level: message normalization, dedup, bot identity cache)
    ch := larkchannel.NewChannel(restClient, wsClient)
    
    // 4. Receive handler — bridges to existing IPC
    ch.OnMessage(func(ctx context.Context, msg *larktypes.NormalizedMessage) error {
        // Write /tmp/hermes_inbox/<msg_id>.json in EXACTLY the format
        // inbox_watcher.py expects (verify by reading the Python _write_inbox())
        return writeInboxFile(msg.MessageID, msg.ChatID, msg.UserID, msg.Content)
    })
    
    // 5. Lifecycle hooks
    ch.OnReady(func() { log.Printf("✓ ws connected") })
    ch.OnError(func(err error) { log.Printf("✗ ws error: %v", err) })
    
    // 6. Start
    ch.Start(ctx)
}
```

### Step 4 — Compile and verify

```bash
go build -o bin/feishu-bot-go .
./bin/feishu-bot-go -h
./bin/feishu-bot-go   # should fail with "must provide --app-id"
```

### Step 5 — Field test in foreground (5s)

```bash
cd /tmp
./path/to/bin/feishu-bot-go --app-id cli_xxx --app-secret yyy 2>&1 | head -20 &
PID=$!
sleep 5
kill $PID 2>/dev/null
# Look for: "ws connected" / "connected to wss://..."
```

### Step 6 — IPC compatibility check (CRITICAL)

The Go skeleton's writes to `/tmp/hermes_inbox/*.json` must be **byte-compatible** with what `inbox_watcher.py` reads. Otherwise the downstream consumer breaks silently.

```bash
# Read the Python writer's exact JSON format
grep -B2 -A20 "_write_inbox" /path/to/Python_daemon.py

# Field names must match: msg_id, chat_id, sender_open_id, sender_name, text, received_at
# Missing/renamed fields → inbox_watcher silently drops messages
```

In the Go write:
```go
type InboxMessage struct {
    MsgID        string  `json:"msg_id"`
    ChatID       string  `json:"chat_id"`
    SenderOpenID string  `json:"sender_open_id"`
    SenderName   string  `json:"sender_name"`
    Text         string  `json:"text"`
    ReceivedAt   float64 `json:"received_at"`
}
```

### Step 7 — Atomic write (avoid half-reads)

The Python `_write_inbox` uses `tmp + rename` pattern. Go must do the same:

```go
tmp := dst + ".tmp"
os.WriteFile(tmp, data, 0644)
return os.Rename(tmp, dst)  // atomic on POSIX
```

## Migration Strategy: Parallel Dual-Runtime

Don't flip the switch on day 1. Run both side by side:

1. **Week 1**: Go skeleton runs in foreground, writes to `/tmp/hermes_inbox_2/` (separate dir).
2. **Week 2**: Point `inbox_watcher.py` at the new dir via symlink or config flag.
3. **Week 3**: Move Go skeleton to launchd, retire Python daemon (after 7-day stability window).
4. **Week 4**: Delete the Python daemon file.

If at any step the downstream consumer (e.g. `inbox_watcher`) breaks, **roll back to Python** — don't try to debug the Go skeleton in production.

> **中文注释**: 双 runtime 并行 1-2 周,出问题随时回滚 Python。**不要在生产环境 debug Go skeleton**。

## Common Pitfalls

1. **SDK field naming differences**. Go SDK often uses `MessageId` not `MessageID`, `ChatId` not `ChatID`. Copy the exact field names from the SDK source — don't guess.

2. **Message struct ≠ SDK struct**. The Python SDK's `P2ImMessageReceiveV1` has nested event/message/sender. The Go SDK's high-level `NormalizedMessage` flattens this — convenient, but verify you don't lose `MentionedBot`, `ChatType`, etc.

3. **Protobuf transitive deps missing**. After `go mod tidy`, if you see `missing go.sum entry for gogo/protobuf`, manually `go get` the sub-package. Don't try to vendor or skip.

4. **Field name in Go write vs Python read mismatch**. `json:"chat_id"` in Go must match `payload["chat_id"]` in Python. Mismatches fail silently — messages get written but never processed.

5. **Sandboxed venv still needed**. Even after Go rewrite, the Python `inbox_watcher.py` may still need the hermes-agent venv to call the LLM. Don't `rm -rf` venvs prematurely.

6. **launchd restart loop on Go daemon**. If your Go binary exits with non-zero status and the plist has `KeepAlive.Crashed=true`, launchd will throttle. Test the binary in foreground first; only after 60s of clean exit do you put it under launchd.

7. **Importing the wrong SDK path**. `larkws.NewClient(appId, appSecret, ...)` is in `github.com/larksuite/oapi-sdk-go/v3/ws`, not `/v3/service/im/v1`. Each sub-package has its own `NewClient`.

## Verification Checklist

Before retiring the Python daemon:

- [ ] Go binary compiles with no warnings
- [ ] Foreground test: connect to Feishu / Slack / etc., receive ≥1 message, see it in `/tmp/...inbox`
- [ ] Outbox watcher: write a reply file, see it sent to Feishu
- [ ] `inbox_watcher.py` (or equivalent downstream consumer) processes the Go-written inbox file identically to Python-written ones (md5 the resulting outbox after processing)
- [ ] WS reconnect on network drop: kill -STOP the Go daemon, wait 30s, SIGCONT, see reconnect log
- [ ] Heartbeat (if applicable): 60s+ idle doesn't drop connection
- [ ] Run side-by-side with Python for 7 days; reply rate / error rate comparable
- [ ] launchd plist points to absolute Go binary path, with WorkingDirectory set
- [ ] Old Python daemon kept as `.bak` for 1 week

## One-Shot Recipes

### Recipe 1: Bootstrap a Go skeleton from a Python daemon

```bash
# 1. Inventory the Python daemon
DAEMON=/path/to/daemon.py
wc -l "$DAEMON"
grep -E "^(import|from) " "$DAEMON" | head

# 2. Pick the dominant third-party lib — look for the one that justifies Python
# (e.g. lark-oapi → oapi-sdk-go)
gh search repos <vendor>/<lang>-sdk --limit 3

# 3. Scaffold
mkdir -p ~/Desktop/developments/<daemon-name>-go
cd ~/Desktop/developments/<daemon-name>-go
go mod init github.com/veawho/<daemon-name>-go
go get <sdk-path>@latest
go mod tidy

# 4. Write main.go (see skeleton above)
# 5. Build
go build -o bin/<daemon-name>-go .
```

### Recipe 2: Diff what the Python writer put on disk vs what the Go writer would put

```bash
# Capture Python output
/path/to/python/daemon.py &
sleep 5
# Trigger a message somehow (send to the bot)
# Read the inbox file
cat /tmp/hermes_inbox/<msg_id>.json
# Kill daemon
pkill -f daemon.py

# Now write equivalent in Go, run for 5s, trigger, read, diff
diff <(python -c "import json,sys; print(json.dumps(json.load(open(sys.argv[1]), indent=2, sort_keys=True))" /tmp/hermes_inbox/py_msg.json) \
     <(python -c "import json,sys; print(json.dumps(json.load(open(sys.argv[1])), indent=2, sort_keys=True))" /tmp/hermes_inbox/go_msg.json)
```

### Recipe 3: Run a Go daemon under launchd

```bash
PLIST=~/Library/LaunchAgents/com.example.go-daemon.plist

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.example.go-daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/david/Desktop/developments/example-go/bin/example-go</string>
        <string>--app-id</string>
        <string>cli_xxx</string>
        <string>--app-secret</string>
        <string>yyy</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/david/.hermes/logs/example-go.out.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/david/.hermes/logs/example-go.err.log</string>
</dict>
</plist>
EOF
plutil -convert binary1 "$PLIST"
plutil -lint "$PLIST"

UID_NUM=$(id -u)
launchctl bootstrap "gui/$UID_NUM" "$PLIST"
```