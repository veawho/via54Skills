---
name: via54merge
description: Use when consolidating duplicated Python venvs, redundant Python service daemons, or overlapping native binaries on macOS / Linux dev machines. Covers the decision matrix (merge vs isolate vs Go-rewrite), the uv pip install workflow to bridge two venvs, shell wrapper shebang rewrites, launchd plist / systemd unit reconciliation, and post-merge verification (md5, ps, lsof, curl).
version: 1.0.0
author: veawho
license: MIT
metadata:
  hermes:
    tags: [python, venv, consolidation, services, launchd, macos, devops]
    related_skills: [via54goport, hermes-agent-skill-authoring, plan]
---

# via54merge — Consolidate Duplicated Python Runtimes, Services & Binaries

## Overview

When you have multiple Python venvs serving overlapping purposes, several LaunchAgent plists running near-duplicate daemons, or two native binaries compiled from the same `go.mod` doing different jobs — the natural question is "can I merge these?". This skill gives you the decision matrix and the runnable steps. It does **not** advocate merging for the sake of it: each consolidation has a real cost (validation, regression test, deployment risk) and the merge should pay for itself in **disk, memory, or cognitive load**.

## When to Use

- You have ≥2 Python venvs where the public-package overlap is >80% and one has clear superset capability.
- A single user-facing workflow is spread across 2-4 LaunchAgent / systemd plists that could plausibly run in one process.
- Two native binaries (Go / Rust / C) were compiled from the same source tree and only differ by subcommand.
- You suspect a feishu-bot / discord-bot / similar daemon is duplicating code that already exists in another daemon.

## When NOT to Use

- The two services have **different reliability profiles** (one must survive crashes of the other).
- Different deployment cadences (service A ships daily, service B ships quarterly) — merging creates a forced common-release rhythm.
- The "merge" is just renaming files — that's a refactor, not a consolidation. Use a code review skill instead.
- Security boundaries must remain separate (e.g. one runs as root, one as user).

## Decision Matrix

Before merging anything, score it:

| Criterion | Score 0 | Score 1 | Score 2 |
|---|---|---|---|
| Public-package overlap | <50% | 50-80% | >80% |
| Cross-language coupling | None | Subprocess / IPC | Shared imports |
| Failure-mode independence | Coupled | Partially independent | Fully independent |
| Deployment cadence match | Mismatch | Loose match | Tied |
| Restart blast radius | Critical | Tolerable | Acceptable |

**Action**: sum scores. ≥7 = strongly merge. 5-6 = merge if pain is acute. ≤4 = don't merge.

## Pre-Merge Inventory (Real Evidence, Not Assumptions)

Always do this first. Every conclusion must be backed by `ps`, `lsof`, `pip list`, or `find` — never by backup manifest inference.

```bash
# 1. List every Python venv on the system
find ~ -maxdepth 6 -name "pyvenv.cfg" 2>/dev/null

# 2. For each venv, list installed packages (use uv — reads metadata more reliably than pip)
for v in $(find ~ -maxdepth 6 -name "pyvenv.cfg" 2>/dev/null); do
  py="$(dirname "$v")/bin/python"
  echo "=== $v ==="
  ~/.hermes/bin/uv pip list --python "$py" 2>&1 | tail -n +4
done

# 3. Public-package intersection (names only — version diffs go in the migration plan)
diff <(uv pip list --python /path/A | awk 'NR>3 {print $1}' | sort) \
     <(uv pip list --python /path/B | awk 'NR>3 {print $1}' | sort) | head -40

# 4. Real processes (ps, not plutil)
ps aux | grep -E "<service-name>" | grep -v grep

# 5. Listening ports (lsof)
lsof -nP -iTCP:8080 -iTCP:8090 -iTCP:9119 2>&1 | grep LISTEN

# 6. launchd plists that reference the binaries / venvs
for p in ~/Library/LaunchAgents/*.plist; do
  prog=$(plutil -extract ProgramArguments.0 raw "$p" 2>/dev/null)
  echo "  $(basename $p) → $prog"
done
```

## The Merge Workflow (venv → venv)

**Scenario**: venv A is the superset. venv B has 2-4 unique packages. We move wrapper shebangs to A, deprecate B.

### Step 1 — Back up venv B before touching anything

```bash
# Don't `rm -rf`. Rename + keep on disk for 1 week.
mv ~/.path/to/venv-B ~/.path/to/venv-B.deprecated-$(date +%Y%m%d)
```

### Step 2 — Install B's unique packages into A

```bash
# Identify unique packages
DIFF=$(comm -23 \
  <(uv pip list --python ~/.path/to/venv-B/bin/python | awk 'NR>3 {print $1}' | sort) \
  <(uv pip list --python ~/.path/to/venv-A/bin/python | awk 'NR>3 {print $1}' | sort))

# Install all unique packages into A (let uv's resolver handle version arbitration)
uv pip install --python ~/.path/to/venv-A/bin/python $DIFF
```

### Step 3 — Rewrite wrapper shebang (atomic, with backup)

```bash
# Before:
head -1 ~/.local/bin/wrapper
# → #!/path/to/venv-B/bin/python3

# Backup:
cp -p ~/.local/bin/wrapper ~/.local/bin/wrapper.bak-$(date +%Y%m%d)

# Rewrite with sed (preserve mtime/perms via cp -p above)
sed -i '' "1s|#!/path/to/venv-B/bin/python3|#!/path/to/venv-A/bin/python3|" ~/.local/bin/wrapper

# Verify:
head -1 ~/.local/bin/wrapper
```

### Step 4 — Verify the wrapper still works

```bash
~/.local/bin/wrapper --help
~/.local/bin/wrapper <key-subcommand>  # e.g. `auth status`, `version`
```

### Step 5 — Restart the daemon (in foreground first, to see errors)

```bash
# Test in foreground for 5-10s — confirms WS / network / subprocess call paths
~/.path/to/venv-A/bin/python3 /path/to/daemon.py 2>&1 | head -20
```

If foreground succeeds, the dependency merge is good. **Now restart under launchd:**

```bash
# Kill any old daemons
pkill -f "venv-B/bin/python3.*daemon.py"

# Bootout + bootstrap (one plist at a time, with sleep between to avoid launchd throttle)
launchctl bootout "gui/$(id -u)/com.example.service" 2>&1
sleep 2
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/com.example.service.plist
sleep 2
```

### Step 6 — Verify

```bash
ps aux | grep daemon.py | grep -v grep      # should now show venv-A
launchctl list | grep com.example.service  # status=0, pid != -
```

### Step 7 — Wait 1 week before deleting venv-B.deprecated

Don't `rm -rf` on day 1. If nothing broke by day 7, then `rm -rf`.

## Service Consolidation (Multiple Daemons → One)

For the LaunchAgent case (daemons you can't merge because of language, but can co-run):

1. **List everything**: `ls ~/Library/LaunchAgents/*.plist` and `launchctl list`
2. **Score the matrix** above.
3. **If merging the binaries** (e.g. via Go subcommands): see `via54goport`.
4. **If keeping separate binaries**: at minimum normalize plist path conventions:
   - All ProgramArguments use **absolute paths** under `~/.local/bin/` (avoid `/usr/local/bin` which needs sudo + breaks macOS spctl on unsigned binaries).
   - All plists set `WorkingDirectory` explicitly (don't rely on `$HOME`).
   - All plists write logs to `~/.hermes/logs/<service>.{out,err}.log`.
   - All plists share a consistent `EnvironmentVariables.PATH`.

## Binary Consolidation (Two Go Binaries → One)

If you have `via54` and `via54-mcp` compiled from the same `cmd/...` source tree:

```bash
# Old: separate binaries, separate plists
~/.local/bin/via54 web --port 8080 &
~/.local/bin/via54-mcp -http :8090 &

# New: one binary with subcommands
~/.local/bin/via54 web --port 8080 &
~/.local/bin/via54 serve --mcp-port :8090 &

# Compile (single binary):
cd ~/Desktop/developments/via54Design
go build -o bin/via54 ./cmd/via54

# Old `via54-mcp` binary: deprecate the same way as venv-B
mv ~/.local/bin/via54-mcp ~/.local/bin/via54-mcp.deprecated-$(date +%Y%m%d)
```

## Common Pitfalls

1. **Inferring from backup manifests instead of `ps`/`lsof`**. Backup manifests are point-in-time; live system state is the truth. **Iron rule: every conclusion must be backed by live tool output, not manifest text.**

2. **Forgetting to kill old daemons before bootstrap**. The new launchd plist will conflict with the running process; symptoms: `Bootstrap failed: 5: Input/output error` or duplicate services competing for the same port.

3. **launchd throttle after repeated `bootstrap` failures**. macOS throttles `bootstrap` after 3 failures within `ThrottleInterval` (default 10s). Symptoms: persistent `Input/output error` even with valid plist. Fix: wait 60-90s, or bootout the entire user domain (`launchctl bootout gui/$(id -u)`) — but that stops every service, so prefer the wait.

4. **Version-downgrade surprise after `uv pip install`**. When venv A already has `cryptography==49.0.0` and venv B has `cryptography==46.0.7`, `uv pip install` against A won't downgrade. But if A is the target and B's deps include a version A doesn't have, **A's resolver picks a version A doesn't currently use** — which may surprise downstream code. Always run the wrapper's core flow after install.

5. **Wrapper shebang typo / wrong path**. `sed -i '' '1s|...|...|'` matches only line 1. If the wrapper has a shebang on line 2 (e.g. behind a `#!/usr/bin/env bash`), the sed silently no-ops. Always `head -1` before and after.

6. **launchd plist mtime vs binary path mismatch**. If the plist points to `~/.local/bin/wrapper` but the wrapper's shebang still points to the deprecated venv, the launchd-managed daemon still uses the old venv. Update both, or use a wrapper script that sources `.env` to switch.

7. **`.deprecated-$(date)` accumulating forever**. After 1 week of stable operation, `rm -rf ~/.local/share/<x>/venv.deprecated-*`. Don't let dead venvs accumulate.

## Verification Checklist

After any merge:

- [ ] Live `ps aux` shows the daemon running under the **new** venv's python interpreter
- [ ] `launchctl list` shows status=0 with non-empty PID
- [ ] The wrapper's key subcommands work (`auth status`, `version`, etc.)
- [ ] lsof shows the expected listening ports (if applicable)
- [ ] HTTP endpoints curl with 200 (if applicable)
- [ ] At least one full **end-to-end** flow succeeds (send a real message, not just `--help`)
- [ ] Backup of old venv/binary exists for at least 7 days
- [ ] Original plist is preserved as `.bak-$(date)` before any sed / edit
- [ ] Diff `git diff <service>.plist` shows only the intended change (path / shebang), nothing else

## One-Shot Recipes

### Recipe 1: Merge `feishu-cli/venv` into `hermes-agent/venv` (the canonical case)

```bash
# 1. Inventory
find ~/.local/share -name pyvenv.cfg
find ~/.hermes -name pyvenv.cfg

# 2. Diff packages
comm -23 \
  <(uv pip list --python ~/.local/share/feishu-cli/venv/bin/python3 | awk 'NR>3{print $1}' | sort) \
  <(uv pip list --python ~/.hermes/hermes-agent/venv/bin/python3 | awk 'NR>3{print $1}' | sort)

# 3. Backup
mv ~/.local/share/feishu-cli/venv ~/.local/share/feishu-cli/venv.deprecated-$(date +%Y%m%d)

# 4. Install unique into hermes-agent venv
uv pip install --python ~/.hermes/hermes-agent/venv/bin/python3 \
  lark-oapi feishu-cli pycryptodome requests-toolbelt

# 5. Rewrite wrapper
cp -p ~/.local/bin/feishu ~/.local/bin/feishu.bak-$(date +%Y%m%d)
sed -i '' "1s|feishu-cli/venv/bin/python3|hermes-agent/venv/bin/python3|" ~/.local/bin/feishu

# 6. Verify
~/.local/bin/feishu --help
~/.local/bin/feishu auth status
```

### Recipe 2: Restart a single launchd service after plist edit

```bash
UID_NUM=$(id -u)
PLIST=~/Library/LaunchAgents/com.example.service.plist
launchctl bootout "gui/$UID_NUM/com.example.service" 2>/dev/null
sleep 2
launchctl bootstrap "gui/$UID_NUM" "$PLIST" 2>&1
sleep 3
launchctl list | grep com.example.service
```

### Recipe 3: Find which venv a running daemon actually uses

```bash
PID=$(launchctl list | awk '/com.example.service/ {print $1}')
ps -p "$PID" -o command=
# Then check the shebang of that binary:
head -1 $(ps -p "$PID" -o command= | awk '{print $1}')
```