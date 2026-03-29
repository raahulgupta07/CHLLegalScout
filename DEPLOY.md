# Legal Scout — Deployment Guide

## Quick Start (One Server, One Command)

```bash
# 1. Clone
git clone <your-repo-url> legalscout
cd legalscout

# 2. Configure
cp .env.example .env
nano .env   # Fill in your API key and generate secrets (see below)

# 3. Deploy
docker compose up -d --build

# 4. Done — open http://your-server-ip
```

---

## Requirements

- Docker 20+ and Docker Compose v2+
- 2 CPU, 4GB RAM, 20GB disk (minimum)
- One available port (default: 80, configurable)

---

## .env Setup

```bash
# Generate secrets first:
openssl rand -hex 32       # → paste as JWT_SECRET_KEY
openssl rand -base64 24    # → paste as DB_PASS

# Then edit .env:
nano .env
```

**Required values:**
| Variable | What to set |
|----------|------------|
| `OPENROUTER_API_KEY` | Get from https://openrouter.ai/keys |
| `JWT_SECRET_KEY` | Output of `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | Strong password, 12+ chars |
| `DB_PASS` | Output of `openssl rand -base64 24` |

**If port 80 is taken** (other Docker services on same server):
```bash
# In .env, change:
PORT=8080
# Then access at http://your-server-ip:8080
```

---

## After Deploy

1. Open `http://your-server-ip` (or `:PORT` if changed)
2. Login: your `ADMIN_EMAIL` / `ADMIN_PASSWORD`
3. Upload templates: `/admin/templates`
4. Add companies: `/admin/companies`
5. Train agent: click "Train Agent" + "Start Training"
6. Chat: go to home page and start asking

---

## Verify

```bash
docker compose ps                    # Both containers should be "healthy"
curl http://localhost/health          # Should return {"status": "healthy"}
docker compose logs --tail 20        # Check for errors
```

---

## Update

```bash
cd /path/to/legalscout
git pull
docker compose up -d --build         # Rebuilds and restarts
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 80 taken | Set `PORT=8080` in `.env` |
| "SECURITY CHECK FAILED" | Set strong `JWT_SECRET_KEY` and `ADMIN_PASSWORD` |
| Health returns 503 | Check DB: `docker compose logs scout-db` |
| Blank page | Rebuild: `docker compose up -d --build` |
| Can't login | Check `ADMIN_PASSWORD` in `.env`, restart |

---

## Architecture

```
Port 80 (or $PORT)
  └── scout-api (FastAPI + Next.js frontend)
        └── scout-db (PostgreSQL + pgvector, internal only)
```

2 containers. Single port. All data managed from admin panel.
