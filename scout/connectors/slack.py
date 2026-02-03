"""Slack connector (stub implementation with mock data)."""

from typing import Any

from scout.connectors.base import BaseConnector

# Mock data simulating a typical company's Slack workspace
MOCK_CHANNELS = [
    {"id": "ch_general", "name": "general", "type": "public", "members": 150, "topic": "Company-wide announcements"},
    {"id": "ch_engineering", "name": "engineering", "type": "public", "members": 45, "topic": "Engineering discussions"},
    {
        "id": "ch_product",
        "name": "product-decisions",
        "type": "public",
        "members": 30,
        "topic": "Product decisions and discussions",
    },
    {"id": "ch_incidents", "name": "incidents", "type": "public", "members": 50, "topic": "Incident coordination"},
    {"id": "ch_random", "name": "random", "type": "public", "members": 140, "topic": "Non-work banter"},
    {"id": "ch_help_eng", "name": "help-engineering", "type": "public", "members": 60, "topic": "Ask engineering questions"},
    {"id": "ch_announcements", "name": "announcements", "type": "public", "members": 150, "topic": "Official announcements"},
]

MOCK_MESSAGES = {
    "ch_engineering": [
        {
            "id": "msg_1",
            "user": "sarah_chen",
            "user_name": "Sarah Chen",
            "text": "Heads up: we're rolling out the new search indexing today. Expect some latency spikes during the migration.",
            "timestamp": "2024-06-01T10:30:00Z",
            "reactions": [{"name": "eyes", "count": 5}, {"name": "thumbsup", "count": 3}],
            "thread_replies": 8,
        },
        {
            "id": "msg_2",
            "user": "alex_kim",
            "user_name": "Alex Kim",
            "text": "Migration complete! All systems nominal. Latency is actually better than before 🎉",
            "timestamp": "2024-06-01T14:45:00Z",
            "thread_parent": "msg_1",
            "reactions": [{"name": "tada", "count": 12}],
        },
        {
            "id": "msg_3",
            "user": "mike_johnson",
            "user_name": "Mike Johnson",
            "text": "Quick question: what's the preferred way to handle API errors in the new frontend? Should we use the ErrorBoundary or handle them inline?",
            "timestamp": "2024-06-02T09:15:00Z",
            "thread_replies": 5,
        },
        {
            "id": "msg_4",
            "user": "sarah_chen",
            "user_name": "Sarah Chen",
            "text": "We decided to use ErrorBoundary for unexpected errors and inline handling for expected ones (like validation errors). This was discussed in the last architecture review.",
            "timestamp": "2024-06-02T09:30:00Z",
            "thread_parent": "msg_3",
        },
    ],
    "ch_product": [
        {
            "id": "msg_5",
            "user": "pm_lead",
            "user_name": "Jessica Wong",
            "text": "Decision: We're going with Option B for the new pricing tiers. The user research clearly showed preference for simplicity. Full write-up in the product wiki.",
            "timestamp": "2024-05-28T16:00:00Z",
            "reactions": [{"name": "white_check_mark", "count": 8}],
            "thread_replies": 12,
        },
        {
            "id": "msg_6",
            "user": "ceo",
            "user_name": "Tom Harris",
            "text": "Approved ✅ Let's move forward with implementation. Target launch is Q3.",
            "timestamp": "2024-05-28T16:30:00Z",
            "thread_parent": "msg_5",
        },
    ],
    "ch_incidents": [
        {
            "id": "msg_7",
            "user": "pagerduty_bot",
            "user_name": "PagerDuty",
            "text": "🚨 INCIDENT: High error rate detected in User Service. On-call: @alex_kim",
            "timestamp": "2024-05-25T03:15:00Z",
            "thread_replies": 25,
        },
        {
            "id": "msg_8",
            "user": "alex_kim",
            "user_name": "Alex Kim",
            "text": "Investigating. Looks like a database connection pool exhaustion. Rolling restart in progress.",
            "timestamp": "2024-05-25T03:22:00Z",
            "thread_parent": "msg_7",
        },
        {
            "id": "msg_9",
            "user": "alex_kim",
            "user_name": "Alex Kim",
            "text": "✅ RESOLVED: Root cause was a query without proper timeout. Fix deployed, connection pool config updated. Post-mortem scheduled for Monday.",
            "timestamp": "2024-05-25T04:10:00Z",
            "thread_parent": "msg_7",
        },
    ],
    "ch_announcements": [
        {
            "id": "msg_10",
            "user": "hr_team",
            "user_name": "HR Team",
            "text": "📢 Reminder: Performance review cycle begins next Monday. Please complete your self-assessments by Friday.",
            "timestamp": "2024-06-03T09:00:00Z",
            "reactions": [{"name": "eyes", "count": 45}],
        },
        {
            "id": "msg_11",
            "user": "ceo",
            "user_name": "Tom Harris",
            "text": "Excited to announce: We've closed our Series B! 🎉 More details in the all-hands tomorrow.",
            "timestamp": "2024-05-15T14:00:00Z",
            "reactions": [{"name": "tada", "count": 120}, {"name": "rocket", "count": 85}],
            "thread_replies": 50,
        },
    ],
    "ch_general": [
        {
            "id": "msg_12",
            "user": "office_manager",
            "user_name": "Office Manager",
            "text": "Kitchen update: new coffee machine installed! It's the fancy one with oat milk option.",
            "timestamp": "2024-06-04T08:30:00Z",
            "reactions": [{"name": "coffee", "count": 30}, {"name": "heart", "count": 15}],
        },
    ],
}

MOCK_USERS = {
    "sarah_chen": {"id": "sarah_chen", "name": "Sarah Chen", "title": "Senior Engineer", "email": "sarah@acme.com"},
    "mike_johnson": {"id": "mike_johnson", "name": "Mike Johnson", "title": "Senior Engineer", "email": "mike@acme.com"},
    "alex_kim": {"id": "alex_kim", "name": "Alex Kim", "title": "DevOps Engineer", "email": "alex@acme.com"},
    "pm_lead": {"id": "pm_lead", "name": "Jessica Wong", "title": "Product Lead", "email": "jessica@acme.com"},
    "ceo": {"id": "ceo", "name": "Tom Harris", "title": "CEO", "email": "tom@acme.com"},
}


class SlackConnector(BaseConnector):
    """Slack connector with mock data for development/testing."""

    def __init__(self):
        self._authenticated = False

    @property
    def source_type(self) -> str:
        return "slack"

    @property
    def source_name(self) -> str:
        return "Slack"

    def authenticate(self) -> bool:
        """Simulate authentication (always succeeds in mock mode)."""
        self._authenticated = True
        return True

    def list_items(
        self,
        parent_id: str | None = None,
        item_type: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """List channels or messages in a channel."""
        if parent_id is None:
            # List channels
            channels = MOCK_CHANNELS
            if item_type:
                channels = [c for c in channels if c["type"] == item_type]
            return channels[:limit]

        # List messages in a channel
        messages = MOCK_MESSAGES.get(parent_id, [])
        return messages[:limit]

    def search(
        self,
        query: str,
        filters: dict[str, Any] | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Search messages across channels."""
        query_lower = query.lower()
        results: list[dict[str, Any]] = []

        for channel_id, messages in MOCK_MESSAGES.items():
            channel_name = next((c["name"] for c in MOCK_CHANNELS if c["id"] == channel_id), channel_id)

            for msg in messages:
                if query_lower in msg["text"].lower():
                    results.append(
                        {
                            "id": msg["id"],
                            "channel": channel_name,
                            "channel_id": channel_id,
                            "user": msg["user_name"],
                            "text": msg["text"],
                            "timestamp": msg["timestamp"],
                            "thread_replies": msg.get("thread_replies", 0),
                            "is_thread_reply": "thread_parent" in msg,
                        }
                    )

        # Apply filters
        if filters:
            if "channel" in filters:
                results = [r for r in results if r["channel"] == filters["channel"]]
            if "user" in filters:
                results = [r for r in results if filters["user"].lower() in r["user"].lower()]

        return results[:limit]

    def read(
        self,
        item_id: str,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Read a message or thread."""
        # Find the message
        for channel_id, messages in MOCK_MESSAGES.items():
            for msg in messages:
                if msg["id"] == item_id:
                    result: dict[str, Any] = {
                        "id": msg["id"],
                        "channel_id": channel_id,
                        "user": msg["user_name"],
                        "text": msg["text"],
                        "timestamp": msg["timestamp"],
                        "reactions": msg.get("reactions", []),
                    }

                    # If this is a thread parent, get replies
                    if msg.get("thread_replies", 0) > 0:
                        replies = [m for m in messages if m.get("thread_parent") == item_id]
                        result["replies"] = replies

                    # If this is a thread reply, get parent
                    if "thread_parent" in msg:
                        parent = next((m for m in messages if m["id"] == msg["thread_parent"]), None)
                        if parent:
                            result["parent"] = parent

                    return result

        return {"error": f"Message '{item_id}' not found"}

    def write(
        self,
        parent_id: str,
        title: str,  # Not used for Slack, but required by interface
        content: str,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Post a message to a channel (mock - doesn't persist)."""
        return {
            "id": "new_msg",
            "channel_id": parent_id,
            "text": content,
            "message": "Message posted (mock mode - not persisted)",
        }

    def update(
        self,
        item_id: str,
        content: str | None = None,
        properties: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Update a message (mock - doesn't persist)."""
        return {
            "id": item_id,
            "message": "Message updated (mock mode - not persisted)",
        }

    def get_user(self, user_id: str) -> dict[str, Any]:
        """Get user information."""
        user = MOCK_USERS.get(user_id)
        if user:
            return user
        return {"error": f"User '{user_id}' not found"}

    def get_thread(self, channel_id: str, thread_ts: str) -> list[dict[str, Any]]:
        """Get all messages in a thread."""
        messages = MOCK_MESSAGES.get(channel_id, [])

        # Find thread parent and replies
        thread_messages = []
        for msg in messages:
            if msg["id"] == thread_ts or msg.get("thread_parent") == thread_ts:
                thread_messages.append(msg)

        return thread_messages
