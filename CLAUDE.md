# CLAUDE.md

## Project Overview

Scout is an **enterprise knowledge agent** with Claude Code-like capabilities. It finds information across S3, Google Drive, Notion, and Slack — and learns from every interaction.

The Knowledge Agent 1.0 approach (dump everything into a vector database) doesn't work. Chunks lose context, embeddings miss nuance, and the system never learns. Scout takes a different approach:

- **Awareness** — Knows what sources exist and what they contain
- **Search** — Grep-like search across file contents, not just names
- **Read** — Full documents with context, never chunks
- **Write** — Create and update documents
- **Learn** — Builds knowledge over time

## Structure

```
scout/
├── __init__.py
├── __main__.py
├── agents.py             # Scout agents (scout, reasoning_scout)
├── paths.py              # Path constants
├── knowledge/
│   ├── sources/          # Source metadata (s3.json, google_drive.json, etc.)
│   ├── routing/          # Intent routing rules (intents.json)
│   └── patterns/         # Search patterns (common_patterns.md)
├── context/
│   ├── source_registry.py # Source metadata for prompt
│   └── intent_routing.py  # Intent-to-source routing
├── tools/
│   ├── awareness.py      # list_sources, get_metadata
│   ├── save_discovery.py # Save successful discoveries
│   ├── s3.py             # S3Tools (primary)
│   ├── google_drive.py   # GoogleDriveTools
│   ├── notion.py         # NotionTools
│   └── slack.py          # SlackTools
├── connectors/
│   ├── base.py           # BaseConnector interface
│   ├── s3.py             # S3Connector (primary)
│   ├── google_drive.py   # GoogleDriveConnector
│   ├── notion.py         # NotionConnector
│   └── slack.py          # SlackConnector
├── scripts/
│   └── load_knowledge.py # Load knowledge files
└── evals/
    ├── test_cases.py     # Test cases with expected sources/paths
    ├── grader.py         # LLM-based grader
    └── run_evals.py      # Run evaluations

app/
├── main.py               # API entry point (AgentOS)
└── config.yaml           # Agent configuration

db/
├── session.py            # PostgreSQL session factory
└── url.py                # Database URL builder
```

## Commands

```bash
./scripts/venv_setup.sh && source .venv/bin/activate
./scripts/format.sh      # Format code
./scripts/validate.sh    # Lint + type check
python -m scout          # CLI mode
python -m scout.agents   # Test mode (runs sample query)

# Knowledge
python -m scout.scripts.load_knowledge  # Load knowledge into vector DB

# Evaluations
python -m scout.evals.run_evals              # Run all evals
python -m scout.evals.run_evals -c routing   # Run specific category
python -m scout.evals.run_evals -v           # Verbose mode
python -m scout.evals.run_evals -g           # Use LLM grader
```

## Source Priority

S3 is the primary connector. Use it for:
- Policies and handbooks → `s3://company-docs/policies/`
- OKRs and planning → `s3://company-docs/planning/`
- Runbooks → `s3://engineering-docs/runbooks/`
- Architecture docs → `s3://engineering-docs/architecture/`

Use other sources when:
- **Slack**: Recent discussions, decisions, who knows what
- **Notion**: Project tracking, meeting notes, living wikis
- **Google Drive**: Collaborative docs, spreadsheets, legacy docs

## Two Knowledge Systems

| System | What It Stores | How It Evolves |
|--------|---------------|----------------|
| **Knowledge** | Source registry, intent routing, known patterns | Curated by you + Scout |
| **Learnings** | Decision traces: what worked, what didn't, why | Managed by Learning Machine |

## The Learning Loop

```
User Question
     ↓
Search Knowledge + Learnings (Do I already know where this is?)
     ↓
Navigate: list_sources → get_metadata → search → read
     ↓
Found? → Return answer, save discovery if surprising
Not found? → Try fallback sources, save negative knowledge
```

## Evaluation Categories

| Category | Tests |
|----------|-------|
| `routing` | Does Scout find info in the expected source? |
| `content` | Does the response contain expected information? |
| `cross_source` | Can Scout synthesize from multiple sources? |
| `negative` | Does Scout handle "not found" gracefully? |
| `learning` | Does Scout improve on repeated similar queries? |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `AWS_ACCESS_KEY_ID` | For S3 | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | For S3 | AWS secret key |
| `AWS_REGION` | For S3 | AWS region (default: us-east-1) |
| `GOOGLE_CREDENTIALS` | For Drive | Google service account JSON |
| `NOTION_API_KEY` | For Notion | Notion integration token |
| `SLACK_BOT_TOKEN` | For Slack | Slack bot token |
| `EXA_API_KEY` | No | Exa for web research |

## Key Files to Reference

- `scout/agents.py` - Agent configuration and instructions
- `scout/connectors/s3.py` - Primary connector implementation
- `scout/tools/s3.py` - S3Tools toolkit
- `scout/context/source_registry.py` - Context loading pattern
- `scout/connectors/base.py` - Connector interface
- `scout/evals/test_cases.py` - Test case format
