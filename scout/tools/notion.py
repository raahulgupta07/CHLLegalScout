"""Notion tools as an Agno Toolkit."""

from agno.tools import Toolkit, tool

from scout.connectors.notion import NotionConnector


class NotionTools(Toolkit):
    """Toolkit for interacting with Notion."""

    def __init__(self):
        super().__init__(name="notion_tools")
        self.connector = NotionConnector()
        self.connector.authenticate()

        # Register tools
        self.register(self.list_pages)
        self.register(self.search_notion)
        self.register(self.read_page)
        self.register(self.query_database)
        self.register(self.create_page)
        self.register(self.update_page)

    @tool
    def list_pages(
        self,
        parent_id: str | None = None,
        page_type: str | None = None,
        limit: int = 20,
    ) -> str:
        """List pages and databases in Notion.

        Args:
            parent_id: Parent page ID to list children of. If None, lists root.
            page_type: Filter by type (page, database).
            limit: Maximum number of items to return.
        """
        items = self.connector.list_items(
            parent_id=parent_id,
            item_type=page_type,
            limit=limit,
        )

        if not items:
            return "No pages found."

        lines = ["## Notion Pages", ""]
        for item in items:
            icon = item.get("icon", _get_icon(item.get("type", "")))
            lines.append(f"{icon} **{item['name']}**")
            lines.append(f"   ID: `{item['id']}` | Type: {item['type']}")

        return "\n".join(lines)

    @tool
    def search_notion(
        self,
        query: str,
        limit: int = 10,
    ) -> str:
        """Search across all Notion pages and databases.

        Args:
            query: Search query (searches page titles and content).
            limit: Maximum number of results.
        """
        results = self.connector.search(
            query=query,
            limit=limit,
        )

        if not results:
            return f"No pages found matching '{query}'."

        lines = [f"## Search Results for '{query}'", ""]
        for result in results:
            icon = _get_icon(result.get("type", ""))
            lines.append(f"{icon} **{result['name']}**")
            if result.get("snippet"):
                lines.append(f"   _{result['snippet']}_")
            if result.get("database"):
                lines.append(f"   Database: {result['database']}")
            lines.append(f"   ID: `{result['id']}`")
            lines.append("")

        return "\n".join(lines)

    @tool
    def read_page(
        self,
        page_id: str,
        include_metadata: bool = True,
    ) -> str:
        """Read the contents of a Notion page.

        Args:
            page_id: The ID of the page to read.
            include_metadata: Include page metadata (author, dates, etc.).
        """
        result = self.connector.read(page_id)

        if "error" in result:
            return f"Error: {result['error']}"

        # Handle database entries differently
        if result.get("type") == "database_entry":
            lines = [f"## Database Entry: {result.get('properties', {}).get('name', page_id)}", ""]
            lines.append(f"Database: {result.get('database')}")
            lines.append("")
            lines.append("### Properties")
            for key, value in result.get("properties", {}).items():
                if key != "id":
                    lines.append(f"- **{key}**: {value}")
            return "\n".join(lines)

        # Handle regular pages
        lines = [f"# {result.get('title', 'Untitled')}", ""]

        if include_metadata and "metadata" in result:
            meta = result["metadata"]
            lines.append("---")
            if meta.get("created_by"):
                lines.append(f"Created by: {meta['created_by']}")
            if meta.get("last_edited_by"):
                lines.append(f"Last edited by: {meta['last_edited_by']}")
            if meta.get("last_edited_at"):
                lines.append(f"Last edited: {meta['last_edited_at']}")
            lines.append("---")
            lines.append("")

        lines.append(result.get("content", ""))

        return "\n".join(lines)

    @tool
    def query_database(
        self,
        database_id: str,
        status: str | None = None,
        owner: str | None = None,
        limit: int = 20,
    ) -> str:
        """Query a Notion database with filters.

        Args:
            database_id: The database ID to query.
            status: Filter by status property.
            owner: Filter by owner property.
            limit: Maximum number of entries to return.
        """
        filters = {}
        if status:
            filters["status"] = status
        if owner:
            filters["owner"] = owner

        entries = self.connector.query_database(
            database_id=database_id,
            filters=filters if filters else None,
            limit=limit,
        )

        if not entries:
            return "No entries found."

        lines = [f"## Database Query Results", ""]
        for entry in entries:
            lines.append(f"### {entry.get('name', entry.get('id'))}")
            for key, value in entry.items():
                if key not in ["id", "name"]:
                    lines.append(f"- **{key}**: {value}")
            lines.append("")

        return "\n".join(lines)

    @tool
    def create_page(
        self,
        parent_id: str,
        title: str,
        content: str,
    ) -> str:
        """Create a new page in Notion.

        Args:
            parent_id: The parent page or database ID.
            title: The page title.
            content: The page content (markdown).
        """
        result = self.connector.write(
            parent_id=parent_id,
            title=title,
            content=content,
        )

        if "error" in result:
            return f"Error: {result['error']}"

        return f"Created page '{result.get('title', title)}' with ID: `{result.get('id')}`"

    @tool
    def update_page(
        self,
        page_id: str,
        content: str,
    ) -> str:
        """Update an existing Notion page.

        Args:
            page_id: The ID of the page to update.
            content: The new content for the page.
        """
        result = self.connector.update(
            item_id=page_id,
            content=content,
        )

        if "error" in result:
            return f"Error: {result['error']}"

        return f"Updated page `{page_id}`"


def _get_icon(item_type: str) -> str:
    """Get an icon for the item type."""
    icons = {
        "page": "📝",
        "database": "🗃️",
        "database_entry": "📋",
    }
    return icons.get(item_type, "📎")
