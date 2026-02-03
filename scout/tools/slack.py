"""Slack tools as an Agno Toolkit."""

from agno.tools import Toolkit, tool

from scout.connectors.slack import SlackConnector


class SlackTools(Toolkit):
    """Toolkit for interacting with Slack."""

    def __init__(self):
        super().__init__(name="slack_tools")
        self.connector = SlackConnector()
        self.connector.authenticate()

        # Register tools
        self.register(self.list_channels)
        self.register(self.search_messages)
        self.register(self.read_message)
        self.register(self.get_channel_history)
        self.register(self.get_user_info)
        self.register(self.post_message)

    @tool
    def list_channels(
        self,
        channel_type: str | None = None,
        limit: int = 20,
    ) -> str:
        """List Slack channels.

        Args:
            channel_type: Filter by type (public, private).
            limit: Maximum number of channels to return.
        """
        channels = self.connector.list_items(
            item_type=channel_type,
            limit=limit,
        )

        if not channels:
            return "No channels found."

        lines = ["## Slack Channels", ""]
        for channel in channels:
            icon = "🔒" if channel.get("type") == "private" else "📢"
            members = channel.get("members", 0)
            topic = channel.get("topic", "")
            lines.append(f"{icon} **#{channel['name']}** ({members} members)")
            if topic:
                lines.append(f"   _{topic}_")
            lines.append(f"   ID: `{channel['id']}`")

        return "\n".join(lines)

    @tool
    def search_messages(
        self,
        query: str,
        channel: str | None = None,
        user: str | None = None,
        limit: int = 10,
    ) -> str:
        """Search for messages across Slack.

        Args:
            query: Search query.
            channel: Filter to specific channel name.
            user: Filter to messages from specific user.
            limit: Maximum number of results.
        """
        filters = {}
        if channel:
            filters["channel"] = channel
        if user:
            filters["user"] = user

        results = self.connector.search(
            query=query,
            filters=filters if filters else None,
            limit=limit,
        )

        if not results:
            return f"No messages found matching '{query}'."

        lines = [f"## Search Results for '{query}'", ""]
        for result in results:
            lines.append(f"**#{result['channel']}** - {result['user']}")
            lines.append(f"> {result['text']}")
            lines.append(f"_({result['timestamp']})_")
            if result.get("thread_replies", 0) > 0:
                lines.append(f"📎 {result['thread_replies']} replies in thread")
            lines.append(f"Message ID: `{result['id']}`")
            lines.append("")

        return "\n".join(lines)

    @tool
    def read_message(
        self,
        message_id: str,
        include_thread: bool = True,
    ) -> str:
        """Read a specific message and optionally its thread.

        Args:
            message_id: The message ID to read.
            include_thread: Include thread replies if this is a thread parent.
        """
        result = self.connector.read(message_id)

        if "error" in result:
            return f"Error: {result['error']}"

        lines = [f"## Message from {result.get('user', 'Unknown')}", ""]
        lines.append(f"> {result['text']}")
        lines.append(f"_({result['timestamp']})_")

        if result.get("reactions"):
            reactions = " ".join(f":{r['name']}: {r['count']}" for r in result["reactions"])
            lines.append(f"Reactions: {reactions}")

        # Show thread context
        if "parent" in result:
            lines.append("")
            lines.append("### Thread Parent")
            parent = result["parent"]
            lines.append(f"**{parent.get('user_name', 'Unknown')}**: {parent['text']}")

        if include_thread and "replies" in result:
            lines.append("")
            lines.append("### Thread Replies")
            for reply in result["replies"]:
                lines.append(f"**{reply.get('user_name', 'Unknown')}**: {reply['text']}")
                lines.append(f"_({reply['timestamp']})_")
                lines.append("")

        return "\n".join(lines)

    @tool
    def get_channel_history(
        self,
        channel_id: str,
        limit: int = 10,
    ) -> str:
        """Get recent messages from a channel.

        Args:
            channel_id: The channel ID.
            limit: Maximum number of messages to return.
        """
        messages = self.connector.list_items(
            parent_id=channel_id,
            limit=limit,
        )

        if not messages:
            return "No messages found in this channel."

        lines = ["## Channel History", ""]
        for msg in messages:
            # Skip thread replies in main view
            if "thread_parent" in msg:
                continue

            lines.append(f"**{msg.get('user_name', 'Unknown')}** ({msg['timestamp']})")
            lines.append(f"> {msg['text']}")

            if msg.get("reactions"):
                reactions = " ".join(f":{r['name']}: {r['count']}" for r in msg["reactions"])
                lines.append(f"Reactions: {reactions}")

            if msg.get("thread_replies", 0) > 0:
                lines.append(f"📎 {msg['thread_replies']} replies")

            lines.append(f"ID: `{msg['id']}`")
            lines.append("")

        return "\n".join(lines)

    @tool
    def get_user_info(
        self,
        user_id: str,
    ) -> str:
        """Get information about a Slack user.

        Args:
            user_id: The user ID to look up.
        """
        user = self.connector.get_user(user_id)

        if "error" in user:
            return f"Error: {user['error']}"

        lines = [f"## {user.get('name', 'Unknown User')}", ""]
        lines.append(f"**Title**: {user.get('title', 'N/A')}")
        lines.append(f"**Email**: {user.get('email', 'N/A')}")
        lines.append(f"**User ID**: `{user.get('id')}`")

        return "\n".join(lines)

    @tool
    def post_message(
        self,
        channel_id: str,
        message: str,
    ) -> str:
        """Post a message to a Slack channel.

        Args:
            channel_id: The channel ID to post to.
            message: The message text.
        """
        result = self.connector.write(
            parent_id=channel_id,
            title="",  # Not used for Slack
            content=message,
        )

        if "error" in result:
            return f"Error: {result['error']}"

        return f"Posted message to channel `{channel_id}`"
