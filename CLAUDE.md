# CLAUDE.md — Legal Scout

## Project Overview

**Legal Scout** is a legal document automation system for **Myanmar corporate law**. It generates legal documents (AGM minutes, director consents, shareholder resolutions, etc.) from Word templates using company data stored in PostgreSQL. An AI agent (Agno framework) powers a chat interface for natural language document requests.

**All data is managed from the admin panel** — no pre-loaded templates or companies ship with the project.

---

## Quick Start

```bash
cp .env.example .env    # Fill in OPENROUTER_API_KEY + generate secrets
docker compose up -d --build
# Open http://localhost (or http://localhost:PORT)
# Login: ADMIN_EMAIL / ADMIN_PASSWORD from .env
```

### Setup Flow
1. Upload templates → `/admin/templates`
2. Add companies → `/admin/companies` (DICA PDF or manual)
3. Train agent → click "Train Agent" + "Start Training"
4. Chat → generate documents

---

## Architecture

```
Port 80 (configurable via PORT in .env)
  │
  └── scout-api (FastAPI + Next.js static frontend)
        ├── /api/*        → 50+ REST endpoints
        ├── /agents/*     → AI chat (streaming)
        ├── /documents/*  → file downloads
        ├── /*            → frontend (Next.js static)
        │
        └── scout-db (PostgreSQL 18 + pgvector, internal)
              └── 13+ tables
```

**2 containers. 1 port. Production only.**

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, TypeScript, Tailwind, Zustand, Radix UI |
| Backend | FastAPI, Agno 2.5, python-docx, psycopg, SQLAlchemy |
| AI | Configurable via Settings: GPT-5.4 Mini (chat), Claude 3.5 Haiku (training), text-embedding-3-small — all via OpenRouter |
| Database | PostgreSQL 18 + pgvector |
| Auth | JWT + bcrypt |
| Storage | Local filesystem + optional S3 (AWS, MinIO, R2, B2) |
| Deploy | Docker Compose, single-port, production-only |

---

## .env Configuration

Only infrastructure secrets. Everything else configured from admin UI.

```bash
OPENROUTER_API_KEY=...    # Required — AI chat/training
ADMIN_EMAIL=...           # Required — admin login
ADMIN_PASSWORD=...        # Required — 10+ chars
JWT_SECRET_KEY=...        # Required — openssl rand -hex 32
DB_USER=scout             # Database user
DB_PASS=...               # Required — openssl rand -base64 24
DB_DATABASE=legalscout    # Database name
PORT=80                   # Change if port 80 is taken
```

**Configured from Admin UI (not .env):**
- AI models (chat, training, embeddings)
- Email/SMTP
- S3 storage
- Timezone

---

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app, 50+ endpoints, auth, admin, training |
| `scout/agent.py` | AI agent definition, 27+ tools, system prompt |
| `scout/tools/smart_doc.py` | Document generation, placeholder fill |
| `scout/tools/clarification.py` | Template/company matching |
| `scout/tools/companies_db.py` | Company DB queries |
| `scout/tools/knowledge_base.py` | Knowledge storage/search |
| `scout/tools/template_analyzer.py` | Template analysis, field classification |
| `app/s3_storage.py` | Optional S3 cloud storage |
| `app/model_config.py` | AI model configuration (DB-backed) |
| `db/init.sql` | Database schema |
| `db/migration_*.sql` | Database migrations |

### Frontend
| File | Purpose |
|------|---------|
| `agent-ui/src/app/page.tsx` | Chat interface |
| `agent-ui/src/app/admin/templates/page.tsx` | Template upload, training, preview |
| `agent-ui/src/app/admin/companies/page.tsx` | Company management (PDF/manual) |
| `agent-ui/src/app/admin/dashboard/page.tsx` | Dashboard KPIs |
| `agent-ui/src/app/admin/documents/page.tsx` | Generated documents |
| `agent-ui/src/lib/api-client.ts` | API endpoint URLs |
| `agent-ui/src/store.ts` | Zustand state |

### Config
| File | Purpose |
|------|---------|
| `compose.yaml` | Docker Compose (2 containers) |
| `Dockerfile` | Multi-stage build (Node + Python) |
| `scripts/entrypoint.sh` | Container startup (DB wait + migrations) |
| `.env.example` | Environment template |
| `DEPLOY.md` | Deployment guide |

---

## Data Flow

### Document Generation
```
User: "Create AGM for City Holdings"
  → Agent identifies template + company
  → Reads company from DB
  → Fills {{placeholders}} in .docx
  → Saves to /documents/legal/output/
  → Returns download link
```

### Company Data Sources (all via admin UI)
- **DICA PDF upload** → AI extracts fields → saves to companies table
- **Manual form entry** → saves to companies table
- **No Excel files** — everything is DB-only

### Template Training (15 steps)
```
1.  Extract {{placeholders}}
2.  Read document content
3.  AI analysis (category, purpose, when_to_use)
4.  Save metadata to DB
5.  Classify fields (DB auto-fill vs user-input)
5.5 Field → DB column mapping
6.  Knowledge base storage
7.  Vector embedding
8.  PDF preview (with yellow-highlighted placeholders)
9.  Field deep analysis (type, format, validation per field)
10. Legal reference extraction (Myanmar Companies Law 2017)
11. Sample filled document generation
12. Document workflow mapping (before/after)
13. Q&A pairs for agent knowledge base
14. Cross-template relationship mapping
15. Confidence scoring (0-100%)
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `templates` | Template metadata (37 columns, deep training data) |
| `companies` | Company data (DICA format, directors/members JSONB) |
| `documents` | Generated document records |
| `knowledge_lookup` | Fast key-value search |
| `knowledge_vec` | Semantic search (pgvector embeddings) |
| `knowledge_raw` | Raw KB data |
| `knowledge_sources` | Synced KB file tracking |
| `users` | Authentication (email, hashed password, role) |
| `activity_logs` | Audit trail |
| `training_status` | AI training state |
| `app_settings` | Runtime configuration (models, S3, SMTP) |
| `document_versions` | Version tracking |
| `template_versions` | Template versioning |

---

## Security

- JWT authentication with bcrypt password hashing
- Strong secrets enforced on startup (blocks weak JWT/admin password)
- CORS: same-origin default (no wildcard)
- File upload path traversal protection
- SQL injection protection (whitelisted table names)
- Security headers (HSTS, X-Frame-Options, etc.)
- Activity audit logging
- Log rotation (10MB x 3 files per container)
- Non-root Docker user

---

## API Endpoints (key ones)

```
POST /api/auth/login                          # JWT login
GET  /api/dashboard/data                      # Companies, templates, documents
GET  /api/dashboard/stats                     # KPIs
POST /api/dashboard/upload/template           # Upload .docx
POST /api/dashboard/add/company               # Add company
DELETE /api/dashboard/company/{name}          # Delete company
DELETE /api/dashboard/document/{id}           # Delete document
GET  /api/knowledge/train-stream/{template}   # SSE training stream (15 steps)
GET  /api/knowledge/train-companies-stream    # SSE company training stream
POST /api/knowledge/deep-train                # Batch train all templates
GET  /api/templates/preview-pdf/{name}        # PDF preview (highlighted placeholders)
POST /api/company/extract-pdf                 # AI extract from DICA PDF
POST /agents/scout/runs                       # AI chat (streaming)
GET  /health                                  # Health check
```

---

## Commands

```bash
# Deploy
docker compose up -d --build

# Check status
docker compose ps
curl http://localhost/health

# View logs
docker compose logs -f scout-api

# Update
git pull && docker compose up -d --build

# Stop
docker compose down

# Reset DB (WARNING: deletes all data)
docker compose down -v && docker compose up -d --build
```

---

## File Storage

| Directory | Purpose | S3 Sync |
|-----------|---------|---------|
| `/documents/legal/templates/` | Uploaded .docx templates | Yes |
| `/documents/legal/output/` | Generated documents | Yes |
| `/documents/legal/uploads/` | DICA PDF uploads | Yes |
| `/documents/legal/previews/` | PDF previews (cached) | No |

S3 is optional — configure from Admin → Settings. Local filesystem is default.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 80 taken | Set `PORT=8080` in `.env` |
| "SECURITY FATAL" on startup | Set strong `JWT_SECRET_KEY` and `ADMIN_PASSWORD` in `.env` |
| Health returns 503 | Check DB: `docker compose logs scout-db` |
| Templates not showing | Upload via `/admin/templates` |
| Companies not showing | Add via `/admin/companies` |
| Agent gives generic answers | Click "Train Agent" + "Start Training" |
| Download links broken | Restart: `docker compose restart scout-api` |
