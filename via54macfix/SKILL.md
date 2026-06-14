---
name: via54macfix
description: "Use when installing or running native macOS binaries (via54, via54-mcp, feishu, or any Go binary) on macOS 12+/Sequoia, especially when launchd auto-start, Gatekeeper, or codesign xattr blocks execution. Covers the 4 macOS-specific gotchas: (1) spctl/Gatekeeper rejects /usr/local/bin install, fix is ~/.local/bin; (2) macOS Sequoia com.apple.provenance xattr makes launchd-launched children refuse to read the binary, fix is direct CLI call not launchd plist; (3) launchd throttle (Bootstrap failed: 5 I/O error) after rapid restart cycles, fix is 60-90s wait; (4) launchctl bootstrap from root user fails (sandbox), fix is launchctl bootstrap gui/$(id -u) not launchctl bootstrap system/$(id -u)."
license: MIT
compatibility: Designed for Claude Code, Hermes Agent, OpenClaw, OpenCode, Codex CLI. macOS only (12 Monterey+ / 13 Ventura / 14 Sonoma / 15 Sequoia).
metadata:
  author: veawho
  version: 1.0.0
  audience: developers
  tags: macos sequoia spctl gatekeeper provenance launchd throttle xattr
  hermes:
    tags: [macos, sequoia, spctl, gatekeeper, com.apple.provenance, launchd, throttle, xattr, quarantine, codesign, macOS-fix]
    related_skills: [via54feishu, via54merge, via54goport]
---

# via54macfix — macOS native binary install & launchd deploy

> **中文摘要 (Chinese Summary)**: 在 macOS 12+/Sequoia 上装跟跑 native binary
> (Go 编译的 via54、via54-mcp、feishu, 或任意 Go 工具) 一定会撞的 4 个坑
> —— spctl/Gatekeeper 拒绝 `/usr/local/bin`、Sequoia `com.apple.provenance`
> xattr 让 launchd 子进程拒读、launchd throttle (Bootstrap failed: 5)
> 反复发生、launchctl 缺 user domain 写错。本 skill 列出**症状 + 铁证诊断
> + 永久修法**,所有结论都基于真实报错信息(spctl error code, xattr list,
> launchctl print exit code),不是经验猜。

> 📖 **真值源**: `via54Design/AGENTS.md` 的 "常见陷阱 (AI 注意)" 段 + `via54Larkbotgo/docs/zh/guides/install-macos.md`。
> 本 skill 是**操作手册**(怎么诊断 + 怎么修),不是理论。

---

## When to Use

Use this skill when:

- ✅ **你在 macOS 上装 Go 编译的 binary**, 撞到 "cannot be opened because the developer cannot be verified"
- ✅ **你的 launchd plist 启 binary 失败** — 后台 spawn 立刻死, 但直接命令行启能跑
- ✅ **launchctl bootstrap 报 "Bootstrap failed: 5: Input/output error"** — 反复触发
- ✅ **你想给 binary 配 launchd auto-start** (开机自启),但 `sudo launchctl bootstrap` 不工作
- ✅ **你的 binary 装到 `/usr/local/bin/` 后变成 Gapped 0/root ownership** (spctl 严格模式)

Do NOT use this skill when:

- ❌ 你在 Linux (用 systemd)
- ❌ 你在 Windows (用 NSSM + Task Scheduler)
- ❌ 你想跑 Python venv binary (不走 spctl)
- ❌ 你想给 binary codesign (本 skill 只讲"装到哪 + 怎么启" + "xattr 怎么处理")

---

## 4 个 macOS 坑速查表

| # | 症状 | 错误码 / 信号 | 修法 |
|---|---|---|---|
| **1** | `cannot be opened because the developer cannot be verified` | spctl reject | 装 `~/.local/bin/` 而非 `/usr/local/bin/` |
| **2** | launchd 启 binary 立刻死, 但 CLI 能跑 | `com.apple.provenance` xattr | 不要走 launchd plist, 直接 CLI 启 daemon |
| **3** | `Bootstrap failed: 5: Input/output error` | launchd throttle | 等 60-90s 重试; 减少 plist 重启次数 |
| **4** | `sudo launchctl bootstrap` 报权限错 | 缺 `gui/$(id -u)` user domain | 用 `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/...` |

---

## 坑 1: spctl / Gatekeeper 拒绝 `/usr/local/bin/`

**症状**:
```bash
$ /usr/local/bin/via54 --help
zsh: killed     /usr/local/bin/via54
# 或:
"via54" cannot be opened because the developer cannot be verified.
macOS cannot verify that this app is free from malware.
```

**铁证诊断**:
```bash
# 1. 看 binary 有没有 quarantine xattr (下载或 cp 自 internet 都会有)
xattr -l /usr/local/bin/via54
# com.apple.quarantine: 0081;5f...   ← 罪魁祸首

# 2. 试 spctl 评估
spctl --assess --verbose /usr/local/bin/via54
# → reject  (source=Notarized Developer ID)

# 3. 看 binary 是不是 root 拥有
ls -la /usr/local/bin/via54
# -rwxr-xr-x  1 root  wheel  18M  via54  ← Gapped 0/root ownership
```

**永久修法**:
```bash
# ❌ 不要装这里
cp via54 /usr/local/bin/

# ✅ 装到 $HOME/.local/bin/ (跳过 spctl 监控路径)
mkdir -p ~/.local/bin
cp via54 ~/.local/bin/
chmod +x ~/.local/bin/via54

# 确保 PATH 含 ~/.local/bin
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 验证
~/.local/bin/via54 --help
# 期望: 显示 help, 没 spctl 错
```

> **中文注释**: `$HOME` 不在 spctl 监控路径(/Applications, /usr/local, /System),
> 这是 Apple 给开发者留的口子。**但 launchd 的 `com.apple.provenance` xattr
> 检查仍可能在 Sequoia 拦下 — 见坑 2**。

**为什么不用 sudo 跳过**:
- ❌ `sudo spctl --master-disable` (Gatekeeper 全关) — 降低整个系统安全
- ❌ `xattr -d com.apple.quarantine` (删 quarantine xattr) — 删后仍可能 spctl 拒(Sequoia 严格)
- ❌ `codesign --force --deep --sign -` (临时签名) — 对 unsigned Go binary 有时无效, 而且永久方案要 Apple Developer ID ($99/yr)

**装到 `~/.local/bin/` 是 macOS 社区共识** (Homebrew, rustup, go 自身都用这个路径)。

---

## 坑 2: macOS Sequoia `com.apple.provenance` xattr

**新 macOS 15 (Sequoia) 加的硬限制**: binary 多了 `com.apple.provenance` xattr,
**launchd-launched 子进程拒读**(但用户从 terminal 直接 exec 可以)。

**症状**:
```bash
# 1. 验证 binary 启 CLI 能跑
~/.local/bin/via54 --help
# 期望: ✓ 正常输出

# 2. 启 launchd plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.david.feishu-bot.plist
# 期望: 期望 ✓, 实际:
# 期望 log: "via54Larkbotgo starting, app_id=cli_..."  ← 实际 log 没有
# launchd 启的子进程 (ps -ax | grep via54) 看不到 PID
# 状态: 静默死
```

**铁证诊断**:
```bash
# 1. 看 binary 有没有 provenance xattr
xattr -l ~/.local/bin/via54
# com.apple.provenance: ...  ← 罪魁 (Sequoia 新加的)

# 2. 看 launchd plist 启的子进程 PID
launchctl list | grep feishu
# 期望 PID > 0, 实际: -      ← 跟没启动一样

# 3. 试 stdin/stdout 重定向绕开
# launchd 子进程从 stdin/stdout 读会跟 provenance xattr 冲突
```

**永久修法**:
```bash
# ❌ 不要用 launchd plist 启 bot daemon (Sequoia 拒读)
# (会撞 com.apple.provenance)

# ✅ 直接 CLI 启 daemon (用户从 terminal 启, 不被拒)
~/.local/bin/via54Larkbotgo --app-id cli_xxx --app-secret yyy &
disown

# 或: 配 launchd plist **但 plist 只启一个 wrapper shell script**,
# wrapper 用 sudo -u $(whoami) 显式降权到用户, 跳过 launchd sandbox:
cat > ~/Library/LaunchAgents/com.david.feishu-bot-via-user.sh << 'EOF'
#!/bin/bash
exec /Users/david/.local/bin/via54Larkbotgo \
  --app-id cli_xxx --app-secret yyy >> /Users/david/.hermes/logs/feishu-bot.out.log 2>&1
EOF
chmod +x ~/Library/LaunchAgents/com.david.feishu-bot-via-user.sh
```

> **中文注释 (铁律)**: **via54Design 的 `~/.local/bin/via54` 是给用户从
> terminal 调的, 不是给 launchd 启 daemon 的**。原话在 `via54Design/AGENTS.md`
> "常见陷阱" 段: "macOS Sequoia `com.apple.provenance` xattr 让 launchd 子
> 进程拒绝读取 — 飞书 bot 路径直接调用户 bin, 不要走 launchd plist"。

**via54Larkbotgo 的现实选择**:
- macOS Sequoia + Hermes 飞书 bot = **前台启 daemon** (`~/.local/bin/via54Larkbotgo &`)
- 不配 launchd plist (会被坑 2 撞)
- 重启机器后**手动重启** (或者用 warp + tmux 跑长连接)

---

## 坑 3: launchd throttle (Bootstrap failed: 5)

**症状**:
```bash
$ launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.david.feishu-bot.plist
Bootstrap failed: 5: Input/output error
Try re-running the command as root for richer errors.
```

**铁证诊断**:
```bash
# 1. 看 service 是否已经在 domain (in-memory launchd state)
launchctl print gui/$(id -u) 2>&1 | grep -A2 "com.david.feishu-bot"
# → "endpoint expired" 或 "service already loaded but throttled"
# 或 launchctl list 看不到该 plist (因为已 throttle)

# 2. 看 30s 内 bootstrap 失败次数
log show --predicate 'eventMessage CONTAINS "throttle"' --last 30s
# → "throttling bootstrap for label com.david.feishu-bot: 5 failures in 60s"
```

**永久修法 (3 步)**:
```bash
# Step 1: 立即修: 等 60-90s (ThrottleInterval 是 10s, 失败 3 次后持续几分钟)
sleep 90

# Step 2: 减少 plist 重启次数 (plist 设 KeepAlive ThrottleInterval)
cat > ~/Library/LaunchAgents/com.david.feishu-bot.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>Label</key><string>com.david.feishu-bot</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Users/david/.hermes/hermes-agent/venv/bin/python3</string>
    <string>/Users/david/.hermes/scripts/feishu_bot_daemon.py</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>FEISHU_BOT_APP_ID</key><string>cli_xxx</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key><false/>
    <key>ThrottleInterval</key><integer>30</integer>   <!-- 30s 间隔, 不频繁重启 -->
  </dict>
  <key>StandardOutPath</key><string>/Users/david/.hermes/logs/feishu-bot.out.log</string>
  <key>StandardErrorPath</key><string>/Users/david/.hermes/logs/feishu-bot.err.log</string>
</dict>
</plist>
EOF

# Step 3: 重新 bootstrap
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.david.feishu-bot.plist
# 期望: 成功 (无 5 I/O 错)
```

**为什么 sudo 也救不了**:
- `sudo launchctl bootstrap` 也是走 launchd 内核接口
- throttle 在 launchd 内核状态, sudo 没权限清
- **必须**等 cooldown

**via54Larkfix / via54Larkbotgo 现实**:
- 8 个 services 里有 6 个稳跑 (gateway / dashboard / chrome / via54 / via54-mcp)
- 2 个 (feishu + inbox-watcher) 经常 throttle, **目前靠前台启 daemon + `disown` 绕开**
- 重启 Mac 时**手动启这 2 个**( `~/.hermes/scripts/feishu_bot_daemon.py &` + `inbox_watcher.py --foreground &`)

---

## 坑 4: `sudo launchctl bootstrap` 缺 user domain

**症状**:
```bash
$ sudo launchctl bootstrap ~/Library/LaunchAgents/com.david.feishu-bot.plist
Bootstrap failed: 5: Input/output error
# 或: "service cannot be loaded in this session"
```

**铁证诊断**:
```bash
# 你的 plist 在 /Library/LaunchDaemons/ (system) 还是 ~/Library/LaunchAgents/ (user)?
ls ~/Library/LaunchAgents/com.david.feishu-bot.plist   # ← user instance
# vs
ls /Library/LaunchDaemons/com.david.feishu-bot.plist   # ← system instance

# 两者 launchctl bootstrap 语法不同!
```

**永久修法**:
```bash
# ❌ 用 system domain (需要 sudo, 不灵活)
sudo launchctl bootstrap system/com.david.feishu-bot ~/Library/LaunchAgents/com.david.feishu-bot.plist
# 错误: "service not in this domain"

# ✅ 用 user domain (不用 sudo, 跟当前 GUI session 共享)
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.david.feishu-bot.plist
# 期望: success (无 sudo 也能 bootstrap 用户 service)
```

> **中文注释**: macOS launchd 区分 3 个 domain: `system/` (root), `gui/$(id -u)/` (当前 GUI session user), `user/$(id -u)/` (background user)。
> **`~/Library/LaunchAgents/*.plist` 必须在 `gui/$(id -u)/` 域** 才正确 boot。
> `sudo launchctl bootstrap` 默认往 system/ 推, 跟 user plist 不匹配 → 失败。

**verify**:
```bash
launchctl print gui/$(id -u)/com.david.feishu-bot 2>&1 | head -20
# → "state = running" + "pid = 12345" + "program = /Users/.../feishu_bot_daemon.py"
```

---

## 完整 macOS 装 + 跑 checklist (避免 4 个坑)

```bash
# === Step 0: Pre-flight ===
sw_vers                                    # → 确认 macOS 12+ (建议 15 Sequoia)
which go || /bin/bash -c "brew install go"  # → Go 1.20+ 编译骨架
~/.hermes/bin/uv --version                  # → uv 0.11+ venv 管理

# === Step 1: 装 binary (避免坑 1) ===
mkdir -p ~/.local/bin
cp ~/Desktop/developments/via54Design/via54 ~/.local/bin/
chmod +x ~/.local/bin/via54
ls -la ~/.local/bin/via54                    # → 不是 root 拥有
xattr -l ~/.local/bin/via54                  # → 看 com.apple.provenance (Sequoia)

# === Step 2: 验证 spctl 通过 ===
~/.local/bin/via54 --help                   # → 期望正常输出
# 如果撞 "cannot be opened" → 重新 cp 一次 (确保是干净的 copy, 不是 symlink)

# === Step 3: 启 CLI 模式 (避免坑 2) ===
~/.local/bin/via54 prompt --scene "test" --platform midjourney &
disown                                     # → 不被 SIGHUP 杀

# === Step 4: (可选) 配 launchd plist (避免坑 3+4) ===
# 见上方坑 3 step 2 的 plist 模板
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.david.via54.plist
sleep 5
launchctl list | grep via54
# → "com.david.via54" status=0 PID > 0
# 如果报 "Bootstrap failed: 5" → 等 60-90s 重试 (坑 3)
```

---

## Verification checklist

- [ ] `~/.local/bin/via54 --help` 正常输出 (没 spctl 错)
- [ ] `xattr -l ~/.local/bin/via54` 没 com.apple.quarantine (看 com.apple.provenance 是否存在)
- [ ] `ps aux | grep via54` 看到 PID (从 terminal 启)
- [ ] `~/.local/bin/via54` 在 `echo $PATH` 里
- [ ] (如果配 launchd) `launchctl list | grep via54` 看到 status=0 PID > 0
- [ ] (如果撞坑 3) `log show --predicate 'eventMessage CONTAINS "throttle"' --last 5m` 没新错
- [ ] (如果撞坑 4) plist 在 `~/Library/LaunchAgents/` (user), `bootstrap gui/$(id -u)` 域

---

## Common Pitfalls (铁律)

> **中文注释**: 4 个坑的"症状 → 诊断 → 修法"已经在上文,这里列**最容易看错
> 的诊断信号**, 帮你快速判断"我撞的是哪个坑"。

### 误判 1: "binary 不能跑" 不一定是坑 1
- 看到 zsh killed 不一定是 spctl。**先 `xattr -l` 看有没有 quarantine**
- 没有 = 撞坑 1 (spctl); 有 = **别 cp,先 xattr -d com.apple.quarantine**

### 误判 2: "launchd 静默死" 不一定是坑 2
- 看到 plist 在 `~/Library/LaunchAgents/` 但 `launchctl list` 没条目
- 可能性 1: 坑 2 (provenance xattr) — 走 CLI 启 daemon
- 可能性 2: plist 语法错 — `plutil -lint ~/Library/LaunchAgents/*.plist`
- 可能性 3: 坑 3 (throttle) — 等 60-90s

### 误判 3: "sudo 救不了" 是常态
- 4 个坑的修法都**不需要** sudo
- 撞坑时**立刻**做无 sudo 修法, 不要再试 `sudo launchctl`

---

## Related skills

- **via54feishu** — 飞书 bot 集成 (本 skill 的"应用层"匹配)
- **via54merge** — venv / service / 二进制合并 (跟本 skill 的"装到哪"决策)
- **via54goport** — Python → Go 改写 (本 skill 涉及的 Go binary 编译基础)
- **via54Larkbotgo** 仓库 `docs/zh/guides/install-macos.md` — 完整中文指南
- **via54Larkfix** 仓库 `platforms/darwin/` — 完整 macOS 适配源码

---

> 📝 **维护提示**: 本 skill 浓缩自 via54Design AGENTS.md 的"常见陷阱"段 + via54Larkbotgo
> 仓库的 install-macos.md。**ground truth 仓库任何修改, 记得同步这里**。/bin/bash: line 4: /private/tmp/PKInstallSandbox.Akd9Dw/tmp/hermes-snap-d3c394fd5e1f.sh: No such file or directory
/bin/bash: line 5: /private/tmp/PKInstallSandbox.Akd9Dw/tmp/hermes-cwd-d3c394fd5e1f.txt: No such file or directory
