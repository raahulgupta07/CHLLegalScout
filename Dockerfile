# ============================================================================
# Legal Scout — Single-Image Production Dockerfile
# ============================================================================
# Stage 1: Build Next.js frontend → static HTML/JS/CSS
# Stage 2: Python API + frontend static files in one container
# ============================================================================

# --- Stage 1: Build Frontend ---
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# Install pnpm
RUN npm install -g pnpm

# Install deps (cached layer)
COPY agent-ui/package.json agent-ui/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY agent-ui/ ./

# Build arg: empty = same-origin (single port)
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm build
# Output: /frontend/out/ (static HTML/JS/CSS)

# --- Stage 2: Python API + Frontend ---
FROM agnohq/python:3.12

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# ---------------------------------------------------------------------------
# Install system dependencies
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer libreoffice-common fonts-noto-core fonts-noto-cjk \
    curl tini \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# ---------------------------------------------------------------------------
# Create non-root user
# ---------------------------------------------------------------------------
RUN groupadd -g 61000 app \
    && useradd -g 61000 -u 61000 -ms /bin/bash app

# ---------------------------------------------------------------------------
# Python dependencies (cached layer)
# ---------------------------------------------------------------------------
WORKDIR /app

COPY requirements.txt ./
RUN uv pip sync requirements.txt --system \
    && uv pip install pdfplumber bcrypt --system \
    && rm -rf /root/.cache /tmp/*

# ---------------------------------------------------------------------------
# Application code
# ---------------------------------------------------------------------------
COPY --chown=app:app . .

# ---------------------------------------------------------------------------
# Copy frontend build output
# ---------------------------------------------------------------------------
COPY --from=frontend-builder --chown=app:app /frontend/out /app/static-frontend

# ---------------------------------------------------------------------------
# Ensure document directories exist
# ---------------------------------------------------------------------------
RUN mkdir -p /documents/legal/templates /documents/legal/data /documents/legal/output \
    /documents/legal/uploads /documents/legal/previews /documents/legal/knowledge \
    && chown -R app:app /documents

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
RUN chmod +x /app/scripts/entrypoint.sh

USER app

EXPOSE 8000

ENTRYPOINT ["tini", "--", "/app/scripts/entrypoint.sh"]
CMD ["chill"]
