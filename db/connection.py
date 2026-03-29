"""
Shared Database Connection
==========================

Single source of truth for DB connections. All code should use this
instead of inline psycopg.connect() with hardcoded defaults.

Usage:
    from db.connection import get_db_conn
    conn = get_db_conn()
    cur = conn.cursor()
    ...
    cur.close(); conn.close()
"""

import os
from psycopg import connect


def get_db_conn(autocommit: bool = False):
    """Get a database connection using environment variables."""
    conn = connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_DATABASE", "legalscout"),
        user=os.getenv("DB_USER", "scout"),
        password=os.getenv("DB_PASS", ""),
    )
    if autocommit:
        conn.autocommit = True
    return conn
