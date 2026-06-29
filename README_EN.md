# via54Skills


> **🌐 Language**: [🇨🇳 中文](./README.md) | [🇺🇸 English](#) (current)
>
> _This document is in English. For Chinese, click above._
> Personal Hermes Agent / Claude / OpenClaw / OpenCode / Codex skills. Naming: via54<lowercase-action>. Bilingual.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/veawho/via54Skills)](https://github.com/veawho/via54Skills/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/veawho/via54Skills)](https://github.com/veawho/via54Skills/issues)
[![English README](https://img.shields.io/badge/README-English-blue.svg)](README_EN.md)
[![中文 README](https://img.shields.io/badge/README-中文-red.svg)](README.md)

## Introduction

Personal Hermes Agent / Claude / OpenClaw / OpenCode / Codex skills. Naming: via54<lowercase-action>. Bilingual.

## Quick Start

```bash
# Clone
git clone https://github.com/veawho/via54Skills.git
cd via54Skills

# Project-specific setup (see docs/)
```

## Features

<!-- TODO: Fill in specific features -->

## Documentation

- [中文 README](README.md)
- Full docs: `docs/`
- [CHANGELOG](CHANGELOG.md)
- [CONTRIBUTING](CONTRIBUTING.md)
- [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md)
- [SECURITY](SECURITY.md)
- [REFERENCES](REFERENCES.md)

## Citation

```bibtex
@software{via54_skills,
  author = {veawho (巫师叔叔)},
  title  = {via54Skills},
  year   = {2026},
  url    = {https://github.com/veawho/via54Skills}
}
```

## License

This project is licensed under [AGPL-3.0](LICENSE).

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## References

See [REFERENCES.md](REFERENCES.md) - all via54 repos + upstream projects.

## Contact

- Owner: [veawho (巫师叔叔)](https://github.com/veawho)
- Issues: [GitHub Issues](https://github.com/veawho/via54Skills/issues)


### `via54medit` — Multi-source Medical Literature Router for EBM (NEW)
- 4 MCP tools (ask/search/list/persist_qa) for medical EBM literature
- 5-layer architecture: entry / router / source / enrich / foundation
- 4 concurrent sources: PubMed / OpenAlex / Semantic Scholar / 蚂蚁阿福 RAG
- 3 enricher pipeline: FWCI (OpenAlex) / TLDR (S2) / MeSH (PubMed)
- 6-class EBM question classification: Treatment / Diagnosis / Prognosis / Etiology / Prevention / Economic
- AGPL-3.0 + MIT dual-license
- See: [via54medit/SKILL.md](via54medit/SKILL.md)
