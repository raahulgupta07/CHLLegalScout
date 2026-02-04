# Scout

Scout is an **enterprise knowledge agent** with Claude Code-like capabilities. It finds information across S3, Google Drive, Notion, and Slack — and learns from every interaction.

## The Problem

Enterprise knowledge is scattered. Policies in S3, wikis in Notion, context in Slack threads. The Knowledge Agent 1.0 approach — dump everything into a vector database — doesn't work. Chunks lose context, embeddings miss nuance, and the system never learns where things actually live.

## The Solution

Scout takes a different approach, inspired by how Claude Code navigates codebases:

- **Awareness** — Knows what sources exist and what they contain
- **Search** — Grep-like search across file contents, not just names
- **Read** — Full documents with context, never chunks
- **Write** — Create and update documents
- **Learn** — Builds knowledge over time

Every interaction teaches Scout where information lives. "PTO policy isn't in the HR folder, it's in the Employee Handbook." This knowledge compounds.

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

Verify at [http://localhost:8000/docs](http://localhost:8000/docs).

## Try It

```
What's our PTO policy?
→ Your PTO policy is in the Employee Handbook. You get unlimited PTO with
  manager approval, minimum 2 weeks recommended per year. Full policy in
  s3://company-docs/policies/employee-handbook.md Section 4.

How do I deploy to production?
→ Here's the deployment process from the runbook...

What was decided about the API redesign?
→ The pricing decision was made on May 28 in #product-decisions — they
  went with Option B for simplicity. Tom approved it for Q3 launch.
```

## Source Priority

S3 is the primary source. Use it for:
- Policies and handbooks → `s3://company-docs/policies/`
- OKRs and planning → `s3://company-docs/planning/`
- Runbooks → `s3://engineering-docs/runbooks/`
- Architecture docs → `s3://engineering-docs/architecture/`

Use other sources when:
- **Slack**: Recent discussions, decisions, who knows what
- **Notion**: Project tracking, meeting notes, living wikis
- **Google Drive**: Collaborative docs, spreadsheets, legacy docs

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

Scout improves without retraining:
- **Knowledge** is curated — source metadata, intent routing, known patterns
- **Learnings** is discovered — decision traces, what worked, what didn't

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

### Source Metadata (`knowledge/sources/`)
```json
{
  "source_name": "S3",
  "source_type": "s3",
  "buckets": [
    {"name": "company-docs", "description": "Policies, HR, planning"},
    {"name": "engineering-docs", "description": "Runbooks, architecture, RFCs"}
  ],
  "common_locations": {
    "policies": "company-docs/policies/",
    "runbooks": "engineering-docs/runbooks/"
  }
}
```

### Intent Routing (`knowledge/routing/`)
```json
{
  "intent_mappings": [
    {
      "intent": "Find PTO policy",
      "primary_source": "s3",
      "known_locations": ["s3://company-docs/policies/employee-handbook.md"]
    }
  ]
}
```

### Load Knowledge
```sh
python -m scout.scripts.load_knowledge            # Upsert
python -m scout.scripts.load_knowledge --recreate # Fresh start
```

## Connecting Real Sources

Scout ships with stub connectors returning mock data. To connect real sources:

### S3
```sh
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1
```

### Google Drive
1. Create a Google Cloud project and enable Drive API
2. Create service account credentials
3. Set `GOOGLE_CREDENTIALS` to the JSON path

### Notion
1. Create a Notion integration at notion.so/my-integrations
2. Share relevant pages/databases with the integration
3. Set `NOTION_API_KEY` to the integration token

### Slack
1. Create a Slack app at api.slack.com
2. Add required scopes (search:read, channels:read, etc.)
3. Set `SLACK_BOT_TOKEN` to the bot token

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
| `EXA_API_KEY` | No | Web search for external knowledge |

## Further Reading

- [Agno Docs](https://docs.agno.com)
- [Discord](https://agno.com/discord)
