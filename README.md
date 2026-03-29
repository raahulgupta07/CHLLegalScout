# Legal Scout

AI-powered legal document automation for Myanmar corporate law. Generate AGM minutes, director consents, shareholder resolutions and more through a natural language chat interface.

## Install

```bash
git clone https://github.com/raahulgupta07/CHLLegalScout.git
cd CHLLegalScout
cp .env.example .env
```

Edit `.env` — fill in these values:

```bash
# Get from https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-key

# Generate these (run in terminal):
JWT_SECRET_KEY=$(openssl rand -hex 32)
DB_PASS=$(openssl rand -base64 24)

# Set your admin password (10+ chars)
ADMIN_PASSWORD=YourStrongPassword123
```

Then run:

```bash
docker compose up -d --build
```

Wait ~5 minutes for first build. Done.

## Access

| What | URL |
|------|-----|
| App | http://your-server-ip |
| Login | your `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` |

> If port 80 is taken, set `PORT=8080` in `.env`

## Setup (after first login)

1. Go to `/admin/templates` — upload `.docx` Word templates
2. Go to `/admin/companies` — add companies (DICA PDF or manual entry)
3. Click **Train Agent** on companies page
4. Click **Start Training** on templates page
5. Go to chat — ask "Create AGM for [company name]"

## Requirements

- Docker 20+ with Docker Compose v2
- 2 CPU, 4GB RAM, 20GB disk
- One available port (default 80)

## Update

```bash
git pull
docker compose up -d --build
```

## Architecture

```
Port 80
  └── scout-api (FastAPI + Next.js frontend)
        └── scout-db (PostgreSQL, internal only)
```

2 containers. Single port. All configuration from admin UI.

## Features

- Chat with AI to generate legal documents
- Upload Word templates with {{placeholders}}
- Add companies via DICA PDF (AI extracts all fields) or manual form
- 15-step deep template training (field analysis, legal references, Q&A generation)
- PDF preview with highlighted placeholders
- Document download and email
- S3 cloud storage (optional, configure from Settings)
- JWT authentication with role-based access
- Activity audit logging

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12, Agno AI Framework |
| Database | PostgreSQL 18 + pgvector |
| AI Models | GPT-5.4 Mini (chat), Claude 3.5 Haiku (training) via OpenRouter |
| Deploy | Docker Compose |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 80 taken | `PORT=8080` in `.env` |
| Security error on startup | Set strong `JWT_SECRET_KEY` and `ADMIN_PASSWORD` |
| Health check fails | `docker compose logs scout-db` — check DB credentials |
| Agent gives generic answers | Train templates and companies first |
| Blank page | `docker compose up -d --build` |
