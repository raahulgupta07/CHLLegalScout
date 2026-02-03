"""Google Drive tools as an Agno Toolkit."""

from agno.tools import Toolkit, tool

from scout.connectors.google_drive import GoogleDriveConnector


class GoogleDriveTools(Toolkit):
    """Toolkit for interacting with Google Drive."""

    def __init__(self):
        super().__init__(name="google_drive_tools")
        self.connector = GoogleDriveConnector()
        self.connector.authenticate()

        # Register tools
        self.register(self.list_files)
        self.register(self.search_files)
        self.register(self.read_document)
        self.register(self.create_document)
        self.register(self.update_document)

    @tool
    def list_files(
        self,
        folder_id: str | None = None,
        file_type: str | None = None,
        limit: int = 20,
    ) -> str:
        """List files and folders in Google Drive.

        Args:
            folder_id: Folder ID to list contents of. If None, lists root.
            file_type: Filter by type (folder, document, spreadsheet, presentation).
            limit: Maximum number of items to return.
        """
        items = self.connector.list_items(
            parent_id=folder_id,
            item_type=file_type,
            limit=limit,
        )

        if not items:
            return "No files found."

        lines = ["## Google Drive Files", ""]
        for item in items:
            icon = _get_icon(item.get("type", ""))
            modified = item.get("modified", "")
            mod_str = f" (modified: {modified})" if modified else ""
            lines.append(f"{icon} **{item['name']}**{mod_str}")
            lines.append(f"   ID: `{item['id']}` | Type: {item['type']}")

        return "\n".join(lines)

    @tool
    def search_files(
        self,
        query: str,
        file_type: str | None = None,
        limit: int = 10,
    ) -> str:
        """Search for files in Google Drive.

        Args:
            query: Search query (searches file names and contents).
            file_type: Filter by type (document, spreadsheet, presentation).
            limit: Maximum number of results.
        """
        filters = {}
        if file_type:
            filters["type"] = file_type

        results = self.connector.search(
            query=query,
            filters=filters if filters else None,
            limit=limit,
        )

        if not results:
            return f"No files found matching '{query}'."

        lines = [f"## Search Results for '{query}'", ""]
        for result in results:
            icon = _get_icon(result.get("type", ""))
            lines.append(f"{icon} **{result['name']}**")
            if result.get("snippet"):
                lines.append(f"   _{result['snippet']}_")
            lines.append(f"   ID: `{result['id']}`")
            lines.append("")

        return "\n".join(lines)

    @tool
    def read_document(
        self,
        document_id: str,
        include_metadata: bool = True,
    ) -> str:
        """Read the contents of a document from Google Drive.

        Args:
            document_id: The ID of the document to read.
            include_metadata: Include document metadata (owner, dates, etc.).
        """
        result = self.connector.read(document_id)

        if "error" in result:
            return f"Error: {result['error']}"

        lines = [f"# {result.get('title', 'Untitled')}", ""]

        if include_metadata and "metadata" in result:
            meta = result["metadata"]
            lines.append("---")
            if meta.get("owner"):
                lines.append(f"Owner: {meta['owner']}")
            if meta.get("modified"):
                lines.append(f"Last modified: {meta['modified']}")
            if meta.get("word_count"):
                lines.append(f"Word count: {meta['word_count']}")
            lines.append("---")
            lines.append("")

        lines.append(result.get("content", ""))

        return "\n".join(lines)

    @tool
    def create_document(
        self,
        folder_id: str,
        title: str,
        content: str,
    ) -> str:
        """Create a new document in Google Drive.

        Args:
            folder_id: The folder to create the document in.
            title: The document title.
            content: The document content.
        """
        result = self.connector.write(
            parent_id=folder_id,
            title=title,
            content=content,
        )

        if "error" in result:
            return f"Error: {result['error']}"

        return f"Created document '{result.get('title', title)}' with ID: `{result.get('id')}`"

    @tool
    def update_document(
        self,
        document_id: str,
        content: str,
    ) -> str:
        """Update an existing document in Google Drive.

        Args:
            document_id: The ID of the document to update.
            content: The new content for the document.
        """
        result = self.connector.update(
            item_id=document_id,
            content=content,
        )

        if "error" in result:
            return f"Error: {result['error']}"

        return f"Updated document `{document_id}`"


def _get_icon(item_type: str) -> str:
    """Get an icon for the item type."""
    icons = {
        "folder": "📁",
        "document": "📄",
        "spreadsheet": "📊",
        "presentation": "📽️",
    }
    return icons.get(item_type, "📎")
