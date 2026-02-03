"""Notion connector (stub implementation with mock data)."""

from typing import Any

from scout.connectors.base import BaseConnector

# Mock data simulating a typical company's Notion workspace
MOCK_PAGES = {
    "root": [
        {"id": "wiki_eng", "name": "Engineering Wiki", "type": "page", "icon": "🔧"},
        {"id": "wiki_product", "name": "Product Wiki", "type": "page", "icon": "📦"},
        {"id": "wiki_ops", "name": "Operations", "type": "page", "icon": "⚙️"},
        {"id": "db_projects", "name": "Project Tracker", "type": "database", "icon": "📊"},
        {"id": "db_meetings", "name": "Meeting Notes", "type": "database", "icon": "📝"},
        {"id": "db_team", "name": "Team Directory", "type": "database", "icon": "👥"},
    ],
    "wiki_eng": [
        {"id": "page_arch", "name": "Architecture", "type": "page"},
        {"id": "page_services", "name": "Services", "type": "page"},
        {"id": "page_runbooks", "name": "Runbooks", "type": "page"},
        {"id": "page_onboarding_eng", "name": "Engineering Onboarding", "type": "page"},
    ],
    "page_runbooks": [
        {"id": "runbook_deploy", "name": "Deployment Runbook", "type": "page"},
        {"id": "runbook_incident", "name": "Incident Response", "type": "page"},
        {"id": "runbook_oncall", "name": "On-Call Guide", "type": "page"},
    ],
}

MOCK_PAGE_CONTENT = {
    "page_arch": {
        "title": "Architecture",
        "content": """# Architecture Overview

Our system is built on a microservices architecture designed for scalability and resilience.

## Core Principles
- **Service Independence**: Each service owns its data and logic
- **Event-Driven**: Services communicate via events where possible
- **Resilience**: Circuit breakers and graceful degradation
- **Observability**: Comprehensive logging, metrics, and tracing

## Service Map

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web App   │────▶│ API Gateway │────▶│   Services  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
             ┌───────────┐ ┌───────────┐
             │  Auth     │ │  Search   │
             │  Service  │ │  Service  │
             └───────────┘ └───────────┘
```

## Key Services

### User Service
- Authentication and authorization
- User profiles and preferences
- Permission management

### Data Service
- Core business logic
- Data validation and processing
- CRUD operations

### Search Service
- Full-text search
- Faceted filtering
- Real-time indexing

## Tech Stack
- Language: Python, TypeScript
- Framework: FastAPI, Next.js
- Database: PostgreSQL, Redis
- Search: Elasticsearch
- Queue: SQS/SNS
- Infrastructure: AWS, Kubernetes

See individual service pages for detailed documentation.
""",
        "metadata": {
            "created_by": "Sarah Chen",
            "created_at": "2023-05-15",
            "last_edited_by": "Mike Johnson",
            "last_edited_at": "2024-04-20",
        },
    },
    "runbook_incident": {
        "title": "Incident Response",
        "content": """# Incident Response Runbook

## Overview
This runbook describes our incident response process. Follow these steps when an incident is detected.

## Severity Classification

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| SEV-1 | Complete outage | 15 min | Site down for all users |
| SEV-2 | Major degradation | 30 min | Core feature broken |
| SEV-3 | Minor issues | 4 hours | Non-critical bug |
| SEV-4 | Low impact | Next day | Cosmetic issue |

## Response Steps

### 1. Acknowledge
- Respond to the page within SLA
- Join #incidents Slack channel
- Claim the incident in PagerDuty

### 2. Assess
- Determine severity level
- Identify affected systems
- Estimate impact scope

### 3. Communicate
- Post initial update to #incidents
- For SEV-1/2: Notify leadership
- Set up bridge call if needed

### 4. Mitigate
- Focus on restoring service first
- Document actions taken
- Rollback if recent deployment

### 5. Resolve
- Verify service restored
- Update status page
- Send all-clear notification

### 6. Follow-up
- Schedule post-mortem (within 48h for SEV-1/2)
- Create follow-up tickets
- Update runbooks if needed

## Escalation Contacts

- On-call Engineer: See PagerDuty schedule
- Engineering Manager: @eng-managers in Slack
- VP Engineering: Direct page for SEV-1 only

## Useful Links
- [Status Page](https://status.acme.com)
- [PagerDuty Dashboard](https://acme.pagerduty.com)
- [Grafana Dashboards](https://grafana.acme.com)
""",
        "metadata": {
            "created_by": "DevOps Team",
            "created_at": "2023-09-01",
            "last_edited_by": "Alex Kim",
            "last_edited_at": "2024-03-15",
        },
    },
    "page_onboarding_eng": {
        "title": "Engineering Onboarding",
        "content": """# Engineering Onboarding

Welcome to the engineering team! This guide will help you get started.

## Week 1: Setup & Orientation

### Day 1
- [ ] Complete HR onboarding
- [ ] Set up laptop and accounts
- [ ] Join Slack channels: #engineering, #dev-help, #random
- [ ] Meet your buddy

### Day 2-3
- [ ] Clone main repositories
- [ ] Set up development environment (see Setup Guide)
- [ ] Complete security training
- [ ] Get access to AWS, GitHub, PagerDuty

### Day 4-5
- [ ] Read Architecture Overview
- [ ] Attend team standup
- [ ] Pick up your first ticket (labeled "good-first-issue")

## Week 2: Deep Dive

- Shadow on-call engineer for one day
- Complete code review training
- Submit your first PR
- 1:1 with engineering manager

## Key Resources

- **Code**: github.com/acme
- **Docs**: This Notion wiki
- **Design**: Figma workspace
- **Comms**: Slack, Google Meet

## Who to Ask

| Topic | Person | Slack |
|-------|--------|-------|
| Backend | Sarah Chen | @sarah |
| Frontend | Mike Johnson | @mike |
| DevOps | Alex Kim | @alex |
| General | Your buddy | - |

## FAQ

**Q: How do I get access to X?**
A: File an IT ticket or ask in #it-help

**Q: Where are the design specs?**
A: Check the Figma workspace or ask in #design

**Q: How do I deploy?**
A: See the Deployment Runbook in this wiki
""",
        "metadata": {
            "created_by": "HR Team",
            "created_at": "2023-02-01",
            "last_edited_by": "Sarah Chen",
            "last_edited_at": "2024-05-01",
        },
    },
}

MOCK_DATABASE_ENTRIES = {
    "db_projects": [
        {
            "id": "proj_1",
            "name": "Search Enhancement",
            "status": "In Progress",
            "owner": "Sarah Chen",
            "priority": "High",
            "due_date": "2024-06-30",
        },
        {
            "id": "proj_2",
            "name": "Mobile App v2",
            "status": "Planning",
            "owner": "Mike Johnson",
            "priority": "Medium",
            "due_date": "2024-08-15",
        },
        {
            "id": "proj_3",
            "name": "API Performance",
            "status": "Completed",
            "owner": "Alex Kim",
            "priority": "High",
            "due_date": "2024-03-01",
        },
    ],
    "db_meetings": [
        {
            "id": "meeting_1",
            "name": "Engineering All-Hands - June",
            "date": "2024-06-15",
            "attendees": ["Engineering Team"],
            "summary": "Q2 review, Q3 planning, team updates",
        },
        {
            "id": "meeting_2",
            "name": "Architecture Review - Search",
            "date": "2024-05-20",
            "attendees": ["Sarah Chen", "Alex Kim", "CTO"],
            "summary": "Approved new search architecture, timeline set for Q3",
        },
    ],
    "db_team": [
        {"id": "person_1", "name": "Sarah Chen", "role": "Senior Engineer", "team": "Backend", "slack": "@sarah"},
        {"id": "person_2", "name": "Mike Johnson", "role": "Senior Engineer", "team": "Frontend", "slack": "@mike"},
        {"id": "person_3", "name": "Alex Kim", "role": "DevOps Engineer", "team": "Platform", "slack": "@alex"},
    ],
}


class NotionConnector(BaseConnector):
    """Notion connector with mock data for development/testing."""

    def __init__(self):
        self._authenticated = False

    @property
    def source_type(self) -> str:
        return "notion"

    @property
    def source_name(self) -> str:
        return "Notion"

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
        """List pages and databases."""
        page_id = parent_id or "root"
        items = MOCK_PAGES.get(page_id, [])

        if item_type:
            items = [i for i in items if i["type"] == item_type]

        return items[:limit]

    def search(
        self,
        query: str,
        filters: dict[str, Any] | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Search across pages and databases."""
        query_lower = query.lower()
        results: list[dict[str, Any]] = []

        # Search page titles and content
        for page_id, page in MOCK_PAGE_CONTENT.items():
            if query_lower in page["title"].lower() or query_lower in page["content"].lower():
                results.append(
                    {
                        "id": page_id,
                        "name": page["title"],
                        "type": "page",
                        "last_edited": page["metadata"].get("last_edited_at", ""),
                        "snippet": _extract_snippet(page["content"], query),
                    }
                )

        # Search page names in hierarchy
        for items in MOCK_PAGES.values():
            for item in items:
                if query_lower in item["name"].lower():
                    if item["id"] not in [r["id"] for r in results]:
                        results.append(
                            {
                                "id": item["id"],
                                "name": item["name"],
                                "type": item["type"],
                                "snippet": f"Page: {item['name']}",
                            }
                        )

        # Search database entries
        for db_id, entries in MOCK_DATABASE_ENTRIES.items():
            for entry in entries:
                entry_text = " ".join(str(v) for v in entry.values())
                if query_lower in entry_text.lower():
                    results.append(
                        {
                            "id": entry["id"],
                            "name": entry["name"],
                            "type": "database_entry",
                            "database": db_id,
                            "snippet": f"{entry.get('status', '')} - {entry.get('owner', '')}",
                        }
                    )

        return results[:limit]

    def read(
        self,
        item_id: str,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Read page or database entry content."""
        # Check pages
        if item_id in MOCK_PAGE_CONTENT:
            page = MOCK_PAGE_CONTENT[item_id]
            return {
                "id": item_id,
                "title": page["title"],
                "content": page["content"],
                "metadata": page["metadata"],
                "type": "page",
            }

        # Check database entries
        for db_id, entries in MOCK_DATABASE_ENTRIES.items():
            for entry in entries:
                if entry["id"] == item_id:
                    return {
                        "id": item_id,
                        "properties": entry,
                        "type": "database_entry",
                        "database": db_id,
                    }

        return {"error": f"Item '{item_id}' not found"}

    def write(
        self,
        parent_id: str,
        title: str,
        content: str,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Create a new page (mock - doesn't persist)."""
        new_id = f"page_{title.lower().replace(' ', '_')}"
        return {
            "id": new_id,
            "title": title,
            "message": "Page created (mock mode - not persisted)",
        }

    def update(
        self,
        item_id: str,
        content: str | None = None,
        properties: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Update a page (mock - doesn't persist)."""
        if item_id not in MOCK_PAGE_CONTENT:
            # Check if it's a database entry
            for entries in MOCK_DATABASE_ENTRIES.values():
                for entry in entries:
                    if entry["id"] == item_id:
                        return {
                            "id": item_id,
                            "message": "Entry updated (mock mode - not persisted)",
                        }
            return {"error": f"Item '{item_id}' not found"}

        return {
            "id": item_id,
            "message": "Page updated (mock mode - not persisted)",
        }

    def query_database(
        self,
        database_id: str,
        filters: dict[str, Any] | None = None,
        sorts: list[dict[str, str]] | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Query a database with optional filters and sorts."""
        entries = MOCK_DATABASE_ENTRIES.get(database_id, [])

        if filters:
            # Simple filter implementation
            if "status" in filters:
                entries = [e for e in entries if e.get("status") == filters["status"]]
            if "owner" in filters:
                entries = [e for e in entries if e.get("owner") == filters["owner"]]

        return entries[:limit]


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
