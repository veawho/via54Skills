# via54Skills

Personal Hermes Agent skills authored by **veawho** (Devin Wei).

## Naming Convention

**`via54<lowercase-action>`** — every skill must be prefixed with `via54` and use all-lowercase camel-ish names (no underscores, no hyphens within the action).

Examples:
- `via54merge` — Python venv / service / binary consolidation
- `via54goport` — Python → Go service rewrite with SDK assessment

Rules:
1. **Always `via54` prefix** — distinguishes personal skills from upstream / hub-installed skills.
2. **All lowercase** — required by Hermes skill validator (`VALID_NAME_RE = ^[a-z0-9][a-z0-9._-]*$`). camelCase is rejected.
3. **One word action** (or tight phrase) — `via54<verb>` or `via54<noun-verb>` if needed (e.g. `via54deploy`, `via54backup`, `via54backuprotate`).
4. **Skill directory = skill name** — `via54merge/SKILL.md`, `via54goport/SKILL.md`. Always at the root of this repo (no category subdirs; this repo IS the category).
5. **Frontmatter `name` field** must match the directory name exactly.

## Repository Layout

```
via54Skills/
├── README.md           ← you are here
├── via54merge/
│   └── SKILL.md
├── via54goport/
│   └── SKILL.md
└── <future-via54xxx>/
    ├── SKILL.md
    └── references/     ← optional supporting files
        └── <topic>.md
```

## Authoring Rules

Each skill must follow the standard Hermes SKILL.md frontmatter:

```yaml
---
name: via54xxx              # must match directory name
description: Use when <trigger>. <one-line behavior>.
version: 1.0.0
author: veawho
license: MIT
metadata:
  hermes:
    tags: [tag1, tag2]
    related_skills: [other-skill]
---
```

Validation invariants (enforced by Hermes):
- Frontmatter starts with `---` at byte 0
- `name` matches `^[a-z0-9][a-z0-9._-]*$`, ≤64 chars
- `description` ≤1024 chars, starts with "Use when ..."
- Body length 8-15k chars (peer-matched). If >20k, split into `references/`.

## Installation (Local Symlink)

Skills are loaded from `~/.hermes/skills/` and from external_dirs. The standard setup is to symlink this repo's skills directory into `~/.hermes/skills/`:

```bash
ln -s /Users/david/Desktop/developments/via54Skills/via54merge \
      ~/.hermes/skills/via54merge
ln -s /Users/david/Desktop/developments/via54Skills/via54goport \
      ~/.hermes/skills/via54goport
```

Or, to symlink the whole repo as one category-less skill source, add it to `external_dirs` in `~/.hermes/config.yaml`:

```yaml
skills:
  external_dirs:
    - /Users/david/Desktop/developments/via54Skills
```

After symlinking, restart the Hermes session so the skill loader picks up the new entries (`skill_view` is cached at session start).

## Git Workflow

```bash
cd /Users/david/Desktop/developments/via54Skills
git add via54<new-skill>/
git commit -m "feat: add via54<new-skill> skill"
git push origin main
```

Remote: `github.com/veawho/via54Skills`.

## License

MIT (matches Hermes skill convention).