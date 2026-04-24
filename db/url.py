"""
Database URL
============

Build database connection URL from environment variables.
"""

from os import getenv
from urllib.parse import quote


def build_db_url() -> str:
    """Build database URL from environment variables."""
    driver = getenv("DB_DRIVER", "postgresql+psycopg")
    user = getenv("DB_USER", "scout")
    password_raw = getenv("DB_PASS")
    if not password_raw:
        raise ValueError("DB_PASS environment variable is required")
    password = quote(password_raw, safe="")
    host = getenv("DB_HOST", "localhost")
    port = getenv("DB_PORT", "5432")
    database = getenv("DB_DATABASE", "legalscout")

    return f"{driver}://{user}:{password}@{host}:{port}/{database}"


db_url = build_db_url()
