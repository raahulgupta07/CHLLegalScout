"""Google Drive connector (stub implementation with mock data)."""

from typing import Any

from scout.connectors.base import BaseConnector

# Mock data simulating a typical company's Google Drive
MOCK_FOLDERS: dict[str, list[dict[str, Any]]] = {
    "root": [
        {"id": "hr_folder", "name": "HR & People Ops", "type": "folder"},
        {"id": "eng_folder", "name": "Engineering", "type": "folder"},
        {"id": "planning_folder", "name": "Planning & Strategy", "type": "folder"},
        {"id": "product_folder", "name": "Product", "type": "folder"},
        {"id": "shared_folder", "name": "Shared Documents", "type": "folder"},
    ],
    "hr_folder": [
        {"id": "doc_handbook", "name": "Employee Handbook", "type": "document", "modified": "2024-01-15"},
        {"id": "doc_benefits", "name": "Benefits Guide 2024", "type": "document", "modified": "2024-02-01"},
        {"id": "doc_onboarding", "name": "Onboarding Checklist", "type": "document", "modified": "2024-03-10"},
        {"id": "sheet_directory", "name": "Team Directory", "type": "spreadsheet", "modified": "2024-06-01"},
    ],
    "eng_folder": [
        {"id": "doc_arch", "name": "System Architecture Overview", "type": "document", "modified": "2024-04-20"},
        {"id": "doc_api", "name": "API Documentation", "type": "document", "modified": "2024-05-15"},
        {"id": "doc_runbook", "name": "Incident Runbook", "type": "document", "modified": "2024-03-01"},
        {"id": "sheet_oncall", "name": "On-Call Schedule", "type": "spreadsheet", "modified": "2024-06-01"},
    ],
    "planning_folder": [
        {"id": "doc_okr_q4", "name": "Q4 2024 OKRs", "type": "document", "modified": "2024-10-01"},
        {"id": "doc_okr_q3", "name": "Q3 2024 OKRs", "type": "document", "modified": "2024-07-01"},
        {"id": "doc_strategy", "name": "2024 Company Strategy", "type": "document", "modified": "2024-01-05"},
        {"id": "slides_board", "name": "Board Presentation Q3", "type": "presentation", "modified": "2024-09-15"},
    ],
    "product_folder": [
        {"id": "doc_roadmap", "name": "Product Roadmap 2024", "type": "document", "modified": "2024-05-01"},
        {"id": "doc_prd_search", "name": "PRD: Enhanced Search", "type": "document", "modified": "2024-04-10"},
        {"id": "doc_user_research", "name": "User Research Findings", "type": "document", "modified": "2024-03-20"},
    ],
}

MOCK_DOCUMENTS: dict[str, dict[str, Any]] = {
    "doc_handbook": {
        "title": "Employee Handbook",
        "content": """# Employee Handbook

## Welcome to Acme Corp

This handbook outlines our company policies, benefits, and expectations.

## Core Values
1. Customer First
2. Move Fast
3. Be Transparent
4. Own Your Work

## Time Off Policy
- Unlimited PTO with manager approval
- Minimum 2 weeks recommended per year
- Company holidays: see Benefits Guide

## Remote Work
- Hybrid policy: 2 days in office minimum
- Core hours: 10am-4pm local time
- All-hands meetings: Tuesdays and Thursdays

## Code of Conduct
We are committed to a respectful, inclusive workplace...
""",
        "metadata": {
            "owner": "hr@acme.com",
            "created": "2023-01-01",
            "modified": "2024-01-15",
            "word_count": 1250,
        },
    },
    "doc_okr_q4": {
        "title": "Q4 2024 OKRs",
        "content": """# Q4 2024 Company OKRs

## Objective 1: Accelerate Revenue Growth
- KR1: Achieve $10M ARR by end of Q4
- KR2: Increase enterprise deals by 30%
- KR3: Reduce churn to below 5%

## Objective 2: Improve Product Quality
- KR1: Reduce P0 bugs to zero
- KR2: Achieve 99.9% uptime
- KR3: Decrease average response time by 20%

## Objective 3: Scale the Team
- KR1: Hire 10 engineers
- KR2: Improve eNPS to 70+
- KR3: Complete leadership training for all managers

## Team OKRs
See individual team pages for detailed breakdowns.
""",
        "metadata": {
            "owner": "ceo@acme.com",
            "created": "2024-10-01",
            "modified": "2024-10-01",
            "word_count": 450,
        },
    },
    "doc_arch": {
        "title": "System Architecture Overview",
        "content": """# System Architecture

## Overview
Our system follows a microservices architecture with the following components:

## Core Services
- **API Gateway**: Kong-based gateway handling auth and routing
- **User Service**: Handles authentication, profiles, permissions
- **Data Service**: Core business logic and data processing
- **Search Service**: Elasticsearch-powered search functionality

## Infrastructure
- Cloud: AWS (us-east-1, eu-west-1)
- Orchestration: Kubernetes (EKS)
- Database: PostgreSQL (RDS), Redis (ElastiCache)
- Message Queue: SQS/SNS

## Key Design Decisions
1. Event-driven architecture for loose coupling
2. CQRS pattern for read-heavy workloads
3. Circuit breakers for resilience

See Engineering Wiki in Notion for detailed service documentation.
""",
        "metadata": {
            "owner": "cto@acme.com",
            "created": "2023-06-15",
            "modified": "2024-04-20",
            "word_count": 890,
        },
    },
    "doc_runbook": {
        "title": "Incident Runbook",
        "content": """# Incident Response Runbook

## Severity Levels
- **P0**: Complete outage, all customers affected
- **P1**: Major feature down, many customers affected
- **P2**: Minor feature issues, some customers affected
- **P3**: Cosmetic issues, minimal impact

## Response Times
- P0: 15 minutes
- P1: 30 minutes
- P2: 4 hours
- P3: Next business day

## On-Call Rotation
See On-Call Schedule spreadsheet for current rotation.

## Common Issues

### Database Connection Failures
1. Check RDS status in AWS Console
2. Verify security group rules
3. Check connection pool settings
4. Restart affected services if needed

### High Latency
1. Check CloudWatch metrics
2. Look for slow queries in logs
3. Check for unusual traffic patterns
4. Scale up if needed

## Escalation
- Page on-call engineer via PagerDuty
- Notify #incidents Slack channel
- For P0: Notify engineering leadership
""",
        "metadata": {
            "owner": "sre-team@acme.com",
            "created": "2023-09-01",
            "modified": "2024-03-01",
            "word_count": 520,
        },
    },
}


class GoogleDriveConnector(BaseConnector):
    """Google Drive connector with mock data for development/testing."""

    def __init__(self):
        self._authenticated = False

    @property
    def source_type(self) -> str:
        return "google_drive"

    @property
    def source_name(self) -> str:
        return "Google Drive"

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
        """List items in a folder."""
        folder_id = parent_id or "root"
        items = MOCK_FOLDERS.get(folder_id, [])

        if item_type:
            items = [i for i in items if i["type"] == item_type]

        return items[:limit]

    def search(
        self,
        query: str,
        filters: dict[str, Any] | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Search for files matching the query."""
        query_lower = query.lower()
        results: list[dict[str, Any]] = []

        # Search through all folders
        for items in MOCK_FOLDERS.values():
            for item in items:
                if item["type"] == "folder":
                    continue
                name_lower = item["name"].lower()
                if query_lower in name_lower:
                    results.append(
                        {
                            "id": item["id"],
                            "name": item["name"],
                            "type": item["type"],
                            "modified": item.get("modified", ""),
                            "snippet": f"Found in: {item['name']}",
                        }
                    )

        # Also search document content
        for doc_id, doc in MOCK_DOCUMENTS.items():
            if doc_id in [r["id"] for r in results]:
                continue
            if query_lower in doc["content"].lower() or query_lower in doc["title"].lower():
                results.append(
                    {
                        "id": doc_id,
                        "name": doc["title"],
                        "type": "document",
                        "modified": doc["metadata"].get("modified", ""),
                        "snippet": _extract_snippet(doc["content"], query),
                    }
                )

        # Apply filters
        if filters:
            if "type" in filters:
                results = [r for r in results if r["type"] == filters["type"]]

        return results[:limit]

    def read(
        self,
        item_id: str,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Read document content."""
        if item_id not in MOCK_DOCUMENTS:
            return {"error": f"Document '{item_id}' not found"}

        doc = MOCK_DOCUMENTS[item_id]
        return {
            "id": item_id,
            "title": doc["title"],
            "content": doc["content"],
            "metadata": doc["metadata"],
        }

    def write(
        self,
        parent_id: str,
        title: str,
        content: str,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Create a new document (mock - doesn't persist)."""
        new_id = f"doc_{title.lower().replace(' ', '_')}"
        return {
            "id": new_id,
            "title": title,
            "message": "Document created (mock mode - not persisted)",
        }

    def update(
        self,
        item_id: str,
        content: str | None = None,
        properties: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Update a document (mock - doesn't persist)."""
        if item_id not in MOCK_DOCUMENTS:
            return {"error": f"Document '{item_id}' not found"}

        return {
            "id": item_id,
            "message": "Document updated (mock mode - not persisted)",
        }


def _extract_snippet(content: str, query: str, context_chars: int = 100) -> str:
    """Extract a snippet around the query match."""
    query_lower = query.lower()
    content_lower = content.lower()

    idx = content_lower.find(query_lower)
    if idx == -1:
        return content[:context_chars] + "..."

    start = max(0, idx - context_chars // 2)
    end = min(len(content), idx + len(query) + context_chars // 2)

    snippet = content[start:end]
    if start > 0:
        snippet = "..." + snippet
    if end < len(content):
        snippet = snippet + "..."

    return snippet
