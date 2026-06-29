#!/usr/bin/env python3
"""
via54medit skill - 测试脚本

模拟 AI agent 调用 via54Medit 的 4 个 MCP tools.

Usage:
    python example_usage.py
"""
import json
from datetime import datetime


def simulate_ask(question):
    """模拟 ask tool - 主入口"""
    return {
        "tool": "ask",
        "question": question,
        "pico": {
            "population": "心衰患者",
            "intervention": "SGLT2 抑制剂",
            "comparison": "安慰剂",
            "outcome": "心血管死亡率"
        },
        "evidence": [
            {
                "pmid": "12345678",
                "title": "SGLT2 inhibitors and cardiovascular outcomes in heart failure",
                "year": 2024,
                "fwci": 3.2,
                "tldr": "SGLT2 抑制剂显著降低心衰患者心血管死亡率 (HR 0.74, 95% CI 0.65-0.85)",
                "cited_by": 234
            }
        ],
        "timestamp": datetime.now().isoformat()
    }


def simulate_search(query, source="all"):
    """模拟 search tool - 纯搜索"""
    return {
        "tool": "search",
        "query": query,
        "source": source,
        "results": [
            {"pmid": "111", "title": f"Paper about {query} from {source}", "year": 2024}
        ]
    }


def simulate_list(filters=None):
    """模拟 list tool - 列出已缓存"""
    return {
        "tool": "list",
        "filters": filters or {},
        "cached": [
            {"pmid": "12345678", "cached_at": "2026-06-29T10:00:00"}
        ]
    }


def simulate_persist_qa(qa):
    """模拟 persist_qa tool - 持久化 Q&A"""
    return {
        "tool": "persist_qa",
        "status": "saved",
        "qa": qa
    }


if __name__ == "__main__":
    print("=" * 60)
    print("via54medit skill - 测试 (4 个 MCP tools)")
    print("=" * 60)
    print()

    # 1. ask
    print("[1] ask: SGLT2 抑制剂对心衰预后")
    result = simulate_ask("SGLT2 抑制剂对心衰预后")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()

    # 2. search
    print("[2] search: SGLT2 抑制剂 (source=pubmed)")
    result = simulate_search("SGLT2 抑制剂", source="pubmed")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()

    # 3. list
    print("[3] list: filters={year: 2024}")
    result = simulate_list(filters={"year": 2024})
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()

    # 4. persist_qa
    print("[4] persist_qa")
    result = simulate_persist_qa({"q": "test", "a": "answer"})
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()

    print("=" * 60)
    print("OK - 4 MCP tools 都成功模拟")
    print("=" * 60)
