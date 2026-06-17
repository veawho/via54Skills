# 飞书会话 - 引用回复的父消息 完整指南 (用户硬要求 + GitHub 核实)

> 老实说 — 之前我代码用 `inbound.raw.get("upper_message_id")` 错! 飞书 v2 官方 EventMessage 真字段是 `parent_id` (直接父消息) + `root_id` (根消息)。Channel SDK normalize/pipeline.py L222-225 真把 `parent_id` 转成 `ReplyRef(message_id=parent_id)`。
> 这次按 GitHub oapi-sdk-python 真核实, 老实修 m12 bot 代码用 `inbound.reply_to_message_id` (真取 parent_id) + `inbound.raw.get("parent_id")` (fallback) + `inbound.raw.get("root_id")` (真取根消息)。

## 1. 飞书官方文档核实 (open.feishu.cn)

参考: https://open.feishu.cn/document/server-docs/im-v1/message/events/receive

**飞书 v2 接收消息事件 P2ImMessageReceiveV1** 字段:

| 字段 | 类型 | 描述 |
|------|------|------|
| `message_id` | string | 消息 ID |
| `root_id` | string | **根消息 ID**, 仅在回复消息场景会有返回值 |
| `parent_id` | string | **父消息 ID**, 仅在回复消息场景会有返回值 |
| `chat_id` | string | 群 ID |
| `chat_type` | string | 单聊/群聊 |
| `message_type` | string | text/post/image 等 |
| `content` | string | 消息内容 (JSON) |
| `mentions` | list | @ 提及 |
| `sender` | object | 发送者信息 (user/bot) |

**关键**: 飞书官方 v2 事件**只有 `parent_id` + `root_id` 字段**, **没有 `upper_message_id` 字段**!

## 2. GitHub larksuite/oapi-sdk-python 核实 (commit 历史)

参考: https://github.com/larksuite/oapi-sdk-python/blob/v2_main/lark_oapi/api/im/v1/model/event_message.py

`EventMessage` 模型真字段:

```python
class EventMessage(object):
    _types = {
        "message_id": str,
        "root_id": str,        # ✅ 根消息 ID
        "parent_id": str,      # ✅ 父消息 ID
        "create_time": int,
        "chat_id": str,
        "thread_id": str,
        "chat_type": str,
        "message_type": str,
        "content": str,
        "mentions": List[MentionEvent],
        "user_agent": str,
    }
```

## 3. Channel SDK normalize/pipeline.py L85-130 真读 parent_id

参考: `/Users/david/.hermes/hermes-agent/venv/lib/python3.11/site-packages/lark_oapi/channel/normalize/pipeline.py`

```python
def _message_to_dict(msg: Any) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for field_name in (
            "message_id", "root_id", "parent_id",  # ✅ 真读 parent_id + root_id
            "create_time", "update_time", "chat_id",
            "thread_id", "chat_type", "message_type",
            "content", "mentions", "user_agent",
    ):
        out[field_name] = getattr(msg, field_name, None)
    return out

# L222-225: 真建 ReplyRef
parent_id = msg.get("parent_id") or ""
root_id = msg.get("root_id") or ""
if parent_id and parent_id != root_id:
    reply = ReplyRef(message_id=parent_id)  # ✅ 真建 ReplyRef
```

## 4. Channel SDK types.py InboundMessage 真 expose

```python
@dataclass
class ReplyRef:
    message_id: str      # ✅ 真等于 parent_id
    text: Optional[str] = None
    sender_id: Optional[str] = None

@dataclass
class InboundMessage:
    reply: Optional[ReplyRef] = None        # ✅ Channel SDK 真存
    content: MessageContent = ...
    raw: Dict[str, Any] = ...               # ✅ Channel SDK 存 raw dict

    @property
    def reply_to_message_id(self) -> Optional[str]:
        return self.reply.message_id if self.reply else None  # ✅ 真取 parent_id
```

## 5. m12 bot 之前错误 (我之前真误判)

之前 (commit 38a18b9 之前) m12 bot 代码:

```python
# ❌ 错: "upper_message_id" 不是飞书官方字段
parent_id = (
    inbound.reply_to_message_id  # Channel SDK 解析的 (真用 parent_id)
    or inbound.raw.get("upper_message_id", "")  # ❌ 不是飞书 v2 字段!
    or ""
)
```

## 6. m12 bot 现在真用 (commit 692194b 真治本)

```python
# ✅ 对: 老实按 GitHub oapi-sdk-python 真用 parent_id / root_id
# 飞书 v2 EventMessage 字段: parent_id (直接父消息), root_id (根消息)
# Channel SDK normalize/pipeline.py L222-225: msg.get("parent_id") 真建 ReplyRef(message_id=parent_id)
parent_id = (
    inbound.reply_to_message_id  # ✅ Channel SDK 解析的 (EventMessage.parent_id)
    or inbound.raw.get("parent_id", "")  # ✅ 飞书 v2 真字段 (EventMessage.parent_id, fallback)
    or ""
)
root_id = inbound.raw.get("root_id", "")  # ✅ 飞书 v2 真字段 (EventMessage.root_id, 根消息)
parent_text = None
if parent_id:
    parent_text = fetch_parent_message(parent_id)  # 拉父消息真值
```

m12 bot log 打印:
```python
print(f"[m12] recv msg_id={msg_id} ... parent_id={parent_id[:25] if parent_id else '(无)'} root_id={root_id[:25] if root_id else '(无)'} parent_text={parent_text[:80] if parent_text else '(无)'}", file=sys.stderr)
```

## 7. 飞书 app 怎么真发"引用回复" (用户硬要求)

**真发引用回复步骤** (你之前没真用过, 飞书 list 20 条全 upper_message_id=(无)):

1. **飞书 app 打开** 与 bot 的单聊 (或群聊)
2. **长按某条消息** (bot 的回复或自己的消息)
3. **菜单选"回复"** (不是普通回复, 是"引用回复")
4. **输入内容** (如 "确认, 完整提示词")
5. **发送** → 飞书 v2 事件**真带 parent_id + root_id 字段**
6. m12 bot 收到事件 → Channel SDK 真解析 → `inbound.reply_to_message_id` 真取 parent_id → 拉父消息真值

## 8. 真测验证 (你下一条真事件)

m12 bot 跑新代码 (commit 692194b), 你飞书 app 真发"引用回复"后:
- m12 bot log 打印 `parent_id=om_xxxxxxx (引用回复) root_id=om_xxxxxxx (根消息) parent_text=<父消息真值>`
- m12 bot 真知道引用的父消息真值
- m12 bot 4 步工作流真结合父消息上下文 (LLM 真用父消息 + 当前消息 综合分析)
- m12 bot 4 步工作流 phase 切真识别 (init/compositions/final/confirm_2points)
- 之前 mock 测试 (B58 引用回复) 没真触发, 因为 webhook mock 没真进飞书 list, m12 bot 48497 没真收到

## 9. 5 仓库同步

- via54Larkfix: commit 692194b 真 commit + push
- via54Larkbotgo: 42d1e51
- via54Skills: 521a658
- via54Hermes: efd46eb
- via54Design: 1e58179 (前 sync, force-push 后 origin 落后)

## 10. 备份

- `m12_full_channel_bot_v3_parent_id_root_id.py` (parent_id / root_id 真治本版本)
- 12 个备份文件
- SKILL.md v3.0.0 (331 行, 62% 简化)
- WORKFLOW.md 280 行
- CHANGELOG.md 14+ 真治本 commit 跟踪

## 11. 老实说

之前我代码用 `inbound.raw.get("upper_message_id")` 是误判 (实际是 Channel SDK 内部 merge_forward.py map 用, 不是 EventMessage 字段)。
按 GitHub oapi-sdk-python + 飞书官方文档 + Channel SDK 源码 老实核实, 飞书 v2 EventMessage 真字段是 `parent_id` (直接父消息) + `root_id` (根消息), **没有 `upper_message_id` 字段**。
现在 m12 bot 真用 `inbound.reply_to_message_id` (Channel SDK 真解析) + `inbound.raw.get("parent_id")` (fallback) + `inbound.raw.get("root_id")` (真取根消息), **真治本**。
