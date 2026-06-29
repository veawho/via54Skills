---
name: via54medit
description: |
  Use when building, debugging, or extending the via54Medit multi-source medical
  literature router (Phase 4.5, Go CLI + MCP Server, 4 MCP tools).

  中文摘要: 用 via54Medit 做循证医学 (EBM) 文献检索 - 自然语言问题 → PICO 抽取
  → 4 源并发 (PubMed/OpenAlex/S2/蚂蚁阿福) → 3 enricher (FWCI/TLDR/MeSH) →
  4-tier 排序 → 文献包输出。包含 5 层架构 (entry/router/source/enrich/foundation),
  EBM 6 类问题分类 (treatment/diagnosis/prognosis/etiology/prevention/economic),
  4 个 MCP tools (ask/search/list/persist_qa), AGPL-3.0 + MIT 双许可,
  以及 21 章节架构文档 (ARCHITECTURE.md 5 层 + 20 节设计)。

  English: Multi-source medical literature router for Evidence-Based Medicine.
  Go CLI + MCP Server, 4 MCP tools. 5-layer architecture, 6-class EBM question
  classification, 4-source concurrent dispatch, 3-source enricher pipeline,
  4-tier ranking, PDF full-text extraction via Rust+grobid, AGPL-3.0 + MIT
  dual-license.

license: AGPL-3.0
compatibility: Designed for Claude Code, Hermes Agent, OpenClaw, OpenCode, Codex CLI. Go 1.22+, Rust 1.75+, SQLite + Qdrant + bge-m3.
metadata:
  author: veawho (巫师叔叔)
  version: 4.5.0
  audience: developers + medical researchers
  tags: medical-literature ebm systematic-review pico rag mcp pubmed openalex semantic-scholar go rust qdrant bge-m3
  hermes:
    tags: [medical, ebm, pico, pubmed, openalex, rag, mcp, go, rust, qdrant, bge-m3, systematic-review, evidence-based-medicine, anthropics-skills, anthropic, claude-code]
    related_skills: [via54feishu, via54design, via54goport]
---

# via54medit — 多源医学文献语义路由器 (EBM)

> **中文摘要**: via54Medit 是一个用自然语言驱动的多源医学文献语义路由器 — 把
> 医生/研究者的临床问题, 路由到最合适的文献源 (PubMed / OpenAlex / Semantic
> Scholar / 蚂蚁阿福 RAG), 融合检索结果, 输出可标注、可入知识库、可生成 PPT
> 的循证证据包。不是又造一个文献检索工具, 是造**调度器**。

> 📄 **真值源**: `github.com/veawho/via54Medit` 仓库 (Phase 4.5, ahead 10 commits,
> Go 1.22 + Rust 1.75, 22 个子目录, 5 个 binary)。本 skill 是浓缩版,
> 具体语法以仓库代码 + docs/ARCHITECTURE.md 为准。

---

## When to Use

Use this skill when:

- ✅ **你要做循证医学 (EBM) 文献检索** (PICO 抽取 + 多源 + 融合)
- ✅ **你要写 / 改 / 调试 via54Medit 代码** (Go CLI + Rust + MCP Server)
- ✅ **你要加新的文献源** (PubMed / OpenAlex / S2 / 蚂蚁阿福 RAG)
- ✅ **你要加新的 MCP tool** (4 个现有: ask / search / list / persist_qa)
- ✅ **你要做 PICO 抽取** (Population/Intervention/Comparison/Outcome)
- ✅ **你要做文献去重 + 排序** (DoiPmid + title 相似度 + 4-tier ranking)
- ✅ **你要加 PDF 全文提取** (grobid + bge-m3 嵌入)
- ✅ **你要加新的 enricher** (FWCI / TLDR / MeSH)
- ✅ **你要做 systematic review / meta-analysis 准备** (PDF 全文筛选 + 引文链)

Do NOT use this skill when:

- ❌ 你只想调单个文献源的 API (PubMed eutils / OpenAlex / S2 直接调即可)
- ❌ 你在用别的文献工具 (litvar / Rayyan / Covidence) 而不是 via54Medit
- ❌ 你要做的是 LLM 通用任务, 跟医学文献无关

---

## What this skill covers

按主人原话:
> "用自然语言驱动的多源医学文献语义路由器, 把医生/研究者的临床问题路由到
> 最合适的文献源, 融合检索结果, 输出可标注、可入知识库、可生成 PPT 的
> 循证证据包"

涵盖 **5 层架构 + 21 章节设计** + **4 MCP tools** + **6 类 EBM 问题分类** +
**4 源并发调度** + **3 enricher** + **4-tier 排序** + **AGPL+MIT 双许可**。

---

## 1. 5 层架构 (5-Layer Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 5: 入口层 (Entry)                                          │
│  ├── cmd/medit/         CLI (13 subcommands, 1 binary)         │
│  ├── cmd/medit-mcp/     MCP Server (4 tools, 1 binary)          │
│  └── pkg/api/           公开 Go API (让第三方集成)                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: 语义路由层 (Router) — 核心创新点                         │
│  ├── internal/router/                                             │
│  │   ├── classify.go     问题分类 (EBM 6 类 + 5 类用户意图)         │
│  │   ├── plan.go         任务规划 (单源/多源/链式)                 │
│  │   ├── dispatch.go     源调度 (并发 4 源, 限速, 重试, 降级)        │
│  │   └── merge.go        结果融合 (去重 + 4-tier 排序)                │
│  └── internal/prompt/    提示词工程 (医学 PICO 抽取)                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: 文献源层 (Source) — 4 个可插拔源                           │
│  ├── internal/source/                                             │
│  │   ├── pubmed.go       PubMed eutils API (主流医学)              │
│  │   ├── openalex.go     OpenAlex API (免费 + 引用)               │
│  │   ├── semanticscholar.go  S2 API (AI TLDR + influential)     │
│  │   └── antalc.go       蚂蚁阿福 RAG (中文医学)                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: 富化层 (Enricher) — 3 个独立可插拔                          │
│  ├── internal/enrich/                                              │
│  │   ├── enricher.go     统一接口                                │
│  │   ├── openalex.go     PMID → OpenAlex (FWCI + cited_by)        │
│  │   ├── semanticscholar.go  OpenAlex → S2 (TLDR + influential)   │
│  │   └── pubmed.go       S2 → PubMed (MeSH + PMC abstract)        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: 基础层 (Foundation) — 5 个 0 依赖抽象                       │
│  ├── internal/foundation/                                          │
│  │   ├── embedder.go     Embedder 接口 (bge-m3/openai/sense-nova)  │
│  │   ├── vectorstore.go  VectorStore 接口 (qdrant/meili/sqlite)    │
│  │   ├── llm.go          LLM Provider 接口 (hermes/openai/...)     │
│  │   ├── config.go       YAML 加载                                │
│  │   └── log.go          结构化日志 (log/slog)                    │
└─────────────────────────────────────────────────────────────────┘
```

**核心创新**: 4 个源 + 3 个 enricher + 4 MCP tools, 但核心是**调度器** (Router)
而非检索器 (Retriever)。

---

## 2. 4 个 MCP Tools (Phase 4.0)

| Tool | 描述 | 用法 |
|------|------|------|
| `ask` | 主入口: 自然语言问题 → 文献包 | 客户端最常用 |
| `search` | 纯搜索, 不融合 | 调试 / 透明查询 |
| `list` | 列出已检索/已缓存的文献 | 历史查询 |
| `persist_qa` | 持久化 Q&A 对到知识库 | 长期学习 |

**v4.5 计划 (Phase 5.0)** 加 3 个新 tools:
- `search_arxiv` (来自 paper-search-mcp 1.9K stars)
- `search_pubmed` (直接 PubMed eutils)
- `download_paper` (PDF 下载, 配合 grobid)

---

## 3. EBM 6 类问题分类

`internal/router/classify.go` 实现的分类器:

| 类型 | 示例 |
|------|------|
| **Treatment** (治疗) | "SGLT2 抑制剂对心衰预后?" |
| **Diagnosis** (诊断) | "疑似 xxx 病的敏感性?" |
| **Prognosis** (预后) | "早期肺癌 5 年生存率?" |
| **Etiology** (病因) | "吸烟致肺癌的相对风险?" |
| **Prevention** (预防) | "HPV 疫苗有效率?" |
| **Economic** (经济) | "新药 vs 旧药成本效益?" |

+ 5 类用户意图: PICO 抽取 / 综述请求 / 找全文 / 引用查询 / 一般问题

---

## 4. 4 源并发调度

```go
// internal/router/dispatch.go
func (r *Router) Dispatch(ctx, q Query) []Paper {
    var wg sync.WaitGroup
    results := make(chan []Paper, 4)

    for _, src := range r.sources {  // 4 个源
        wg.Add(1)
        go func(s Source) {
            defer wg.Done()
            papers, err := s.Fetch(ctx, q)
            if err == nil {
                results <- papers
            }
        }(src)
    }
    wg.Wait()
    close(results)

    all := []Paper{}
    for p := range results { all = append(all, p) }
    return r.merge.Dedup(all)  // 去重 + 4-tier 排序
}
```

4 源: PubMed / OpenAlex / Semantic Scholar / 蚂蚁阿福 RAG

---

## 5. 3 个 Enricher (独立可插拔)

每个 enricher 是 idempotent, 跑两次效果一样:

| Enricher | 输入 | 输出 |
|----------|------|------|
| **openalex** | PMID | FWCI + cited_by_count |
| **semanticscholar** | OpenAlex | TLDR + influential citations |
| **pubmed** | S2 | MeSH terms + PMC abstract |

可单独使用或组合 (OpenAlex → S2 → PubMed 链式)

---

## 6. 4-Tier 排序

```go
score = w1 * cited_count + w2 * recency + w3 * authority + w4 * availability
```

默认权重: `w1=0.3, w2=0.3, w3=0.3, w4=0.1`

---

## 7. 关键技术决策 (ARCHITECTURE §21)

| 决策 | 理由 |
|------|------|
| **不依赖 via54Design** | 独立运行原则: `git clone && go build` 0 外部业务依赖 |
| **hand-roll foundation (5 文件, 500-800 行)** | 避免大依赖, 易维护 |
| **可借鉴 via54Design 接口** | Embedder/VectorStore/LLM/Config/Log 签名一致 |
| **AGPL-3.0 + MIT 双许可** | 源码 AGPL, 模板/配置/文档 MIT |
| **Go + Rust + Shell 三语言** | Go 主体 / Rust 性能热路径 / Shell 胶水 |
| **SQLite + Qdrant + bge-m3** | 轻量本地优先, 可换向量库 |

---

## 8. 命令速查 (Command Cheat Sheet)

```bash
# Build
go build -o bin/medit.exe ./cmd/medit
go build -o bin/medit-mcp.exe ./cmd/medit-mcp
cd rust && cargo build --release

# Test
go test ./...                   # 单元
go test -tags=integration       # 集成
cd rust && cargo test
go test -race -cover ./...

# Quality Gate (8 项)
go vet ./...
gofmt -l .
cd rust && cargo clippy
cd rust && cargo fmt --check
go build ./... && go test -count=1 ./...

# Run
./bin/medit version
./bin/medit ask "SGLT2 抑制剂对心衰预后"
./bin/medit-mcp -addr :8080
```

---

## 9. 与相关项目关系

| 项目 | 关系 |
|------|------|
| **via54Design** | 借鉴 embedder/vectorstore/llm 接口, 不强制依赖 |
| **via54Hermes** | 通过 MCP transport 集成 (MCP server 是 Layer 5 入口之一) |
| **via54Skills** | 当前 skill 归档位置 |
| **paper-search-mcp** (1.9K) | 计划集成 (Phase 5.0 加 3 个新 tools) |
| **local-deep-research** (8.6K) | 计划集成 (Phase 5.0+ local LLM 推理) |

---

## 10. 集成项目 (v4.5 高星项目对标)

| 项目 | ★ Stars | 集成方式 |
|------|---------|----------|
| [LearningCircuit/local-deep-research](https://github.com/LearningCircuit/local-deep-research) | 8.6K | Phase 5.0+ local LLM |
| [openags/paper-search-mcp](https://github.com/openags/paper-search-mcp) | 1.9K | Phase 5.0 加 3 tools |
| [ChaokunHong/MetaScreener](https://github.com/ChaokunHong/MetaScreener) | 1.3K | PDF 全文筛选 |
| [asreview/asreview](https://github.com/asreview/asreview) | 937 | Active learning |
| [titipata/pubmed_parser](https://github.com/titipata/pubmed_parser) | 734 | PubMed XML 解析 |
| [J535D165/pyalex](https://github.com/J535D165/pyalex) | 391 | OpenAlex Python 库 |

详见 [integrations/README.md](https://github.com/veawho/via54Medit/tree/main/integrations/README.md) 在真值源仓库。

---

## 11. 测试覆盖

| 类型 | 命令 | 目标 |
|------|------|------|
| 单元测试 | `go test ./...` | ≥80% coverage |
| 集成测试 | `go test -tags=integration` | 4 源端到端 |
| 竞态检测 | `go test -race` | 0 race condition |
| Lint | `go vet + cargo clippy` | 0 warning |
| Format | `gofmt + cargo fmt` | 100% formatted |
| E2E | `vhs` (录制) | MCP 端到端 |

---

## 12. 关键文件位置 (Quick Reference)

| 路径 | 描述 |
|------|------|
| `cmd/medit/main.go` | CLI 入口 |
| `cmd/medit-mcp/main.go` | MCP Server 入口 |
| `internal/router/classify.go` | 6 类 EBM 分类 |
| `internal/router/dispatch.go` | 4 源并发 |
| `internal/router/merge.go` | 去重 + 4-tier 排序 |
| `internal/source/{pubmed,openalex,semanticscholar,antalc}.go` | 4 源 |
| `internal/enrich/{openalex,semanticscholar,pubmed}.go` | 3 enricher |
| `internal/foundation/{embedder,vectorstore,llm,config,log}.go` | 5 基础 |
| `configs/default.yaml` | 默认配置 |
| `docs/ARCHITECTURE.md` | 5 层 + 21 章节 (真值源) |
| `docs/ROADMAP.md` | 路线图 |
| `AGENTS.md` | 跨 AI 工具协作规约 (CLAUDE.md 等价) |

---

## 13. AGPL-3.0 + MIT 双许可

- **源码** (cmd/, internal/, pkg/, rust/) → **AGPL-3.0** (强制 share-alike)
- **模板 / 配置 / 文档** (templates/, configs/, docs/) → **MIT** (自由用)
- **完整 LICENSE** 在仓库根目录 (32KB AGPL-3.0 文本)

---

## Related Skills

- **via54feishu** — Feishu/Lark bot 跨 OS + AI agent 集成
- **via54design** — Design template + narrative + media pipeline
- **via54goport** — Go porting best practices
- **via54prompt-generation** — 中文需求 → 英文 + 中文拆解 (B 流程)

## References

- [GitHub: veawho/via54Medit](https://github.com/veawho/via54Medit) (private)
- [ARCHITECTURE.md](https://github.com/veawho/via54Medit/blob/main/docs/ARCHITECTURE.md)
- [AGENTS.md](https://github.com/veawho/via54Medit/blob/main/AGENTS.md)
- [CHANGELOG.md](https://github.com/veawho/via54Medit/blob/main/CHANGELOG.md)
- [integrations/README.md](https://github.com/veawho/via54Medit/blob/main/integrations/README.md)
- [REFERENCES.md](https://github.com/veawho/via54Medit/blob/main/REFERENCES.md)

## Owner & Contact

- **Owner**: veawho (巫师叔叔)
- **GitHub**: https://github.com/veawho
- **Hermes Agent**: https://github.com/veawho/Hermes-Agent
- **Created**: 2026-06-09
- **Current Version**: v4.5.0 (2026-06-29)
