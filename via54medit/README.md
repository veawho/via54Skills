# via54medit

Medical literature router skill (EBM-focused).

See [SKILL.md](./SKILL.md) for the full skill definition.

## Quick Install

```bash
# 1. Copy skill to your agent's skills directory
cp -r SKILL.md /path/to/agent/skills/via54medit/

# 2. Restart agent to load skill
# (in Hermes: re-scan skills/)
# (in Claude Code: /reload)
# (in OpenClaw: re-init)
```

## What it does

Enables your AI agent to:

- **EBM 6-class question classification** (treatment / diagnosis / prognosis / etiology / prevention / economic)
- **PICO extraction** (Population/Intervention/Comparison/Outcome)
- **Multi-source concurrent fetch** (PubMed + OpenAlex + Semantic Scholar + 蚂蚁阿福 RAG)
- **3-stage enrichment** (FWCI + TLDR + MeSH)
- **4-tier ranking** (cited + recency + authority + availability)
- **MCP tool integration** (ask / search / list / persist_qa)

## Source

The actual implementation lives in: https://github.com/veawho/via54Medit

This skill is a distilled knowledge artifact — for the latest code, examples, and
architecture details, see the source repository.
