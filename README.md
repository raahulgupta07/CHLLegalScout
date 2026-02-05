# Scout

Scout is an **enterprise context agent** with Claude Code-like capabilities. It finds information across your company's S3 knowledge base — and learns from usage patterns.

## The Problem

Enterprise context is scattered. Policies in one folder, runbooks in another, decisions buried in docs nobody can find. The Knowledge Agent 1.0 approach — dump everything into a vector database — doesn't work. Chunks lose context, embeddings miss nuance, and the system never learns where things actually live.

## The Solution

Scout takes a different approach, inspired by how Claude Code navigates codebases:

- **Awareness** — Knows what sources exist and what they contain
- **Search** — Grep-like search across file contents
- **Read** — Full documents with context, never chunks
- **Write** — Create and update documents
- **Learn** — Builds knowledge over time

Every interaction teaches Scout where information lives. "PTO policy isn't in the HR folder, it's in the Employee Handbook." This learning compounds over time.

## Quick Start

```sh
# Clone and setup
git clone https://github.com/agno-agi/scout.git && cd scout
cp example.env .env  # Add your OPENAI_API_KEY

# Start the application
docker compose up -d --build

# Load knowledge (inside the container)
docker compose exec scout-api python -m scout.scripts.load_knowledge
```

Confirm Scout is running at [http://localhost:8001/docs](http://localhost:8001/docs).

## Connect to the Web UI

1. Open [os.agno.com](https://os.agno.com) and login
2. Add OS → Local → `http://localhost:8001`
3. Click "Connect"

## Try It

Scout ships with a realistic company knowledge base. Try these queries:
```
What's our PTO policy?
→ Your PTO policy is in the Employee Handbook. You get unlimited PTO with
  manager approval, minimum 2 weeks recommended per year. Full policy in
  s3://acme-corp/policies/employee-handbook.md Section 4.

How do I deploy to production?
→ Here's the deployment process from the runbook...

What's the SLA for P1 incidents?
→ P1 incidents require acknowledgment within 15 minutes and resolution
  within 4 hours. Full incident response process in the runbook...

Who approved the new pricing model?
→ The pricing decision was documented on May 28. Leadership approved
  Option B for simplicity, targeting Q3 launch.
```

## The Learning Loop

```
User Question
     ↓
Search Knowledge + Learnings (Do I already know where this is?)
     ↓
Navigate: list_sources → get_metadata → search → read
     ↓
Found? → Return answer, save discovery if surprising
Not found? → Try fallback paths, save negative knowledge
```

Scout improves without retraining through two complementary systems:

| System | Stores | How It Evolves |
|--------|--------|----------------|
| **Knowledge** (curated) | Source metadata, intent routing, known patterns | Curated by you + Scout |
| **Learnings** (discovered) | Decision traces: what worked, what didn't, why | Managed automatically |

## S3 Bucket Structure

The demo bucket (`acme-corp`) mirrors a real company's knowledge organization:

```
acme-corp/
├── policies/
│   ├── employee-handbook.md
│   ├── security-policy.md
│   ├── data-retention-policy.md
│   ├── expense-policy.md
│   └── remote-work-policy.md
├── engineering/
│   ├── runbooks/
│   │   ├── deployment.md
│   │   ├── incident-response.md
│   │   ├── database-maintenance.md
│   │   └── rollback-procedures.md
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── api-design.md
│   │   └── database-schema.md
│   ├── specs/
│   │   ├── spec-001-search-redesign.md
│   │   ├── spec-002-api-v2.md
│   │   └── spec-003-auth-overhaul.md
│   └── onboarding/
│       └── engineering-onboarding.md
├── product/
│   ├── roadmap-2026.md
│   ├── prd-search-enhancement.md
│   └── user-research-q1.md
├── planning/
│   ├── okrs-2024-q4.md
│   ├── okrs-2024-q3.md
│   ├── company-strategy-2024.md
│   └── budget-2024.md
├── decisions/
│   ├── 2024-05-pricing-model.md
│   ├── 2024-04-cloud-migration.md
│   └── 2024-03-remote-work.md
└── templates/
    ├── rfc-template.md
    ├── prd-template.md
    └── postmortem-template.md
```

## Why S3?

Scout starts with S3 as its primary (and currently only) connector for a few reasons:

1. **It's the simplest to get right.** No OAuth flows, no rate limits, no API quirks. Just files.
2. **Full control over the demo.** We provide a public S3 bucket with realistic company docs so you can try Scout immediately.
3. **Proves the core idea.** The learning loop, navigation pattern, and full-doc reads work the same regardless of source. S3 is enough to validate the approach.

Other connectors (Notion, Google Drive, Slack, Gmail) are on the roadmap — see [Future Work](#future-work).

## Connecting Your Own S3

To use Scout with your own S3 bucket:
```sh
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1
export SCOUT_S3_BUCKET=your-bucket-name
```

Then update `knowledge/sources/s3.json` with your bucket structure.

## Deploy to Railway

```sh
railway login
./scripts/railway_up.sh

# Load knowledge
railway run python -m scout.scripts.load_knowledge
```

## Local Development

```sh
./scripts/venv_setup.sh && source .venv/bin/activate
docker compose up -d scout-db
python -m scout  # CLI mode
```

## Adding Knowledge

Scout works best when it understands your organization's knowledge landscape.

### Source Metadata (`knowledge/sources/s3.json`)
```json
{
  "source_name": "S3",
  "source_type": "s3",
  "bucket": "acme-corp",
  "prefixes": [
    {"path": "policies/", "description": "Company policies and handbooks"},
    {"path": "engineering/", "description": "Technical docs, runbooks, RFCs"},
    {"path": "planning/", "description": "OKRs, strategy, budgets"},
    {"path": "decisions/", "description": "Documented decisions with context"}
  ],
  "common_locations": {
    "pto_policy": "policies/employee-handbook.md#section-4",
    "deployment": "engineering/runbooks/deployment.md",
    "incident_response": "engineering/runbooks/incident-response.md"
  }
}
```

### Intent Routing (`knowledge/routing/intents.json`)
```json
{
  "intent_mappings": [
    {
      "intent": "Find PTO or vacation policy",
      "keywords": ["pto", "vacation", "time off", "leave"],
      "known_location": "policies/employee-handbook.md",
      "section": "Section 4"
    },
    {
      "intent": "Find deployment process",
      "keywords": ["deploy", "release", "ship", "production"],
      "known_location": "engineering/runbooks/deployment.md"
    }
  ]
}
```

### Load Knowledge
```sh
python -m scout.scripts.load_knowledge            # Upsert
python -m scout.scripts.load_knowledge --recreate # Fresh start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `AWS_ACCESS_KEY_ID` | For S3 | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | For S3 | AWS secret key |
| `AWS_REGION` | For S3 | AWS region (default: us-east-1) |
| `SCOUT_S3_BUCKET` | No | Override default bucket |

## Future Work

Scout currently supports S3 only. Planned connectors:

- **Notion** — Wikis, project tracking, meeting notes
- **Google Drive** — Docs, spreadsheets, presentations
- **Slack** — Discussions, decisions, tribal knowledge
- **Gmail** — Email threads, approvals, context
- **Confluence** — Enterprise wikis
- **GitHub** — READMEs, docs, issues

The connector interface (`scout/connectors/base.py`) is designed for extension. Contributions welcome.

## Further Reading

- [Agno Docs](https://docs.agno.com)
- [Discord](https://agno.com/discord)