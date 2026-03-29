"""
AI Model Configuration
======================

Loads model settings from app_settings table.
Falls back to defaults if not configured.

Usage:
    from app.model_config import get_model
    model = get_model("chat")  # → "gpt-5.4-mini"
"""

import os
import json

# Defaults — used when DB has no config
DEFAULTS = {
    "chat": "openai/gpt-5.4-mini",
    "training": "anthropic/claude-3.5-haiku",
    "classification": "anthropic/claude-3.5-haiku",
    "embedding": "openai/text-embedding-3-small",
}

_cache = {}


def _load_from_db():
    """Load model config from app_settings table."""
    global _cache
    try:
        from psycopg import connect
        conn = connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            dbname=os.getenv("DB_DATABASE", "legalscout"),
            user=os.getenv("DB_USER", "scout"),
            password=os.getenv("DB_PASS", ""),
        )
        cur = conn.cursor()
        cur.execute("SELECT value FROM app_settings WHERE key = 'ai_models'")
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row and row[0]:
            _cache = json.loads(row[0]) if isinstance(row[0], str) else row[0]
    except Exception:
        pass


def get_model(purpose: str) -> str:
    """Get model ID for a purpose (chat, training, classification, embedding)."""
    if not _cache:
        _load_from_db()
    return _cache.get(purpose, DEFAULTS.get(purpose, ""))


def get_all_models() -> dict:
    """Get all model configs with defaults filled in."""
    if not _cache:
        _load_from_db()
    result = {}
    for key, default in DEFAULTS.items():
        result[key] = _cache.get(key, default)
    return result


def save_models(config: dict):
    """Save model config to app_settings table."""
    global _cache
    try:
        from psycopg import connect
        conn = connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            dbname=os.getenv("DB_DATABASE", "legalscout"),
            user=os.getenv("DB_USER", "scout"),
            password=os.getenv("DB_PASS", ""),
        )
        cur = conn.cursor()
        value = json.dumps(config)
        cur.execute(
            "INSERT INTO app_settings (key, value) VALUES ('ai_models', %s) "
            "ON CONFLICT (key) DO UPDATE SET value = %s, updated_at = CURRENT_TIMESTAMP",
            (value, value)
        )
        conn.commit()
        cur.close()
        conn.close()
        _cache.update(config)
        # Also set env vars for modules that can't import model_config
        if "classification" in config:
            os.environ["CLASSIFICATION_MODEL"] = config["classification"]
        if "embedding" in config:
            os.environ["EMBEDDING_MODEL"] = config["embedding"]
    except Exception as e:
        raise e


_tz_cache = {"value": None, "expires": 0}


def get_timezone() -> str:
    """Get configured timezone from app_settings. Cached for 60 seconds."""
    import time
    now = time.time()
    if _tz_cache["value"] and now < _tz_cache["expires"]:
        return _tz_cache["value"]

    try:
        from db.connection import get_db_conn
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT value FROM app_settings WHERE key = 'timezone'")
        row = cur.fetchone()
        cur.close(); conn.close()
        if row and row[0]:
            _tz_cache["value"] = row[0]
            _tz_cache["expires"] = now + 60
            return row[0]
    except Exception:
        pass
    return _tz_cache["value"] or "Asia/Yangon"


def save_timezone(tz: str):
    """Save timezone to app_settings."""
    try:
        from psycopg import connect
        conn = connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            dbname=os.getenv("DB_DATABASE", "legalscout"),
            user=os.getenv("DB_USER", "scout"),
            password=os.getenv("DB_PASS", ""),
        )
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO app_settings (key, value) VALUES ('timezone', %s) "
            "ON CONFLICT (key) DO UPDATE SET value = %s, updated_at = CURRENT_TIMESTAMP",
            (tz, tz))
        conn.commit(); cur.close(); conn.close()
    except Exception as e:
        raise e


def get_current_datetime() -> str:
    """Get current date/time in configured timezone."""
    from datetime import datetime, timezone as tz
    try:
        import zoneinfo
        zone = zoneinfo.ZoneInfo(get_timezone())
        now = datetime.now(zone)
    except Exception:
        now = datetime.now()
    return now.strftime("%A, %d %B %Y, %I:%M %p")


def get_current_date() -> str:
    """Get current date only in configured timezone."""
    from datetime import datetime
    try:
        import zoneinfo
        zone = zoneinfo.ZoneInfo(get_timezone())
        now = datetime.now(zone)
    except Exception:
        now = datetime.now()
    return now.strftime("%Y-%m-%d")








def clear_cache():
    """Clear cached config — forces reload from DB on next get_model() call."""
    global _cache
    _cache = {}
