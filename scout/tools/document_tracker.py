"""
Document Tracker - Database Version
===================================

Tracks generated documents in PostgreSQL database.
"""

import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from pathlib import Path

from scout.tools.template_analyzer import get_db_connection


def record_document(
    template_name: str,
    company_name: str,
    file_name: str,
    file_path: str,
    download_url: str,
    preview_url: str,
    validation_result: Optional[Dict] = None,
    custom_data: Optional[Dict] = None,
) -> bool:
    """Record a generated document to database."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO documents 
            (template_name, company_name, file_name, file_path, download_url, preview_url, validation_result, custom_data, version, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1, %s)
        """,
            (
                template_name,
                company_name,
                file_name,
                file_path,
                download_url,
                preview_url,
                json.dumps(validation_result) if validation_result else None,
                json.dumps(custom_data) if custom_data else None,
                datetime.now(),
            ),
        )

        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error recording document: {e}")
        return False


def get_all_documents(limit: int = 100) -> List[Dict]:
    """Get all documents from database."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, template_name, company_name, file_name, download_url, preview_url, version, created_at
            FROM documents 
            ORDER BY created_at DESC 
            LIMIT %s
        """,
            (limit,),
        )

        rows = cur.fetchall()
        cur.close()
        conn.close()

        return [
            {
                "id": str(row[0]),
                "template_name": row[1],
                "company_name": row[2],
                "file_name": row[3],
                "download_url": row[4],
                "preview_url": row[5],
                "version": row[6],
                "created_at": row[7].isoformat() if row[7] else None,
            }
            for row in rows
        ]
    except Exception as e:
        print(f"Error getting documents: {e}")
        return []


def get_documents_by_company(company_name: str) -> List[Dict]:
    """Get documents for a specific company."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, template_name, company_name, file_name, download_url, preview_url, version, created_at
            FROM documents 
            WHERE company_name = %s
            ORDER BY created_at DESC
        """,
            (company_name,),
        )

        rows = cur.fetchall()
        cur.close()
        conn.close()

        return [
            {
                "id": str(row[0]),
                "template_name": row[1],
                "company_name": row[2],
                "file_name": row[3],
                "download_url": row[4],
                "preview_url": row[5],
                "version": row[6],
                "created_at": row[7].isoformat() if row[7] else None,
            }
            for row in rows
        ]
    except Exception as e:
        print(f"Error getting documents by company: {e}")
        return []


def get_document_stats() -> Dict[str, Any]:
    """Get document statistics from database."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM documents")
        total = cur.fetchone()[0]

        cur.execute("""
            SELECT company_name, COUNT(*) as count 
            FROM documents 
            GROUP BY company_name 
            ORDER BY count DESC
        """)
        by_company = {row[0]: row[1] for row in cur.fetchall()}

        cur.execute("""
            SELECT template_name, COUNT(*) as count 
            FROM documents 
            GROUP BY template_name 
            ORDER BY count DESC
        """)
        by_template = {row[0]: row[1] for row in cur.fetchall()}

        cur.execute("""
            SELECT id, template_name, company_name, file_name, download_url, preview_url, version, created_at
            FROM documents 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        recent = [
            {
                "id": str(row[0]),
                "template_name": row[1],
                "company_name": row[2],
                "file_name": row[3],
                "download_url": row[4],
                "preview_url": row[5],
                "version": row[6],
                "created_at": row[7].isoformat() if row[7] else None,
            }
            for row in cur.fetchall()
        ]

        cur.close()
        conn.close()

        return {
            "total_documents": total,
            "by_company": by_company,
            "by_template": by_template,
            "recent_documents": recent,
        }
    except Exception as e:
        print(f"Error getting document stats: {e}")
        return {
            "total_documents": 0,
            "by_company": {},
            "by_template": {},
            "recent_documents": [],
        }


def create_document_tracker_tool(host: str = ""):
    """Create the document tracker tool."""

    def list_documents(limit: int = 50):
        """List all tracked documents."""
        return {"documents": get_all_documents(limit)}

    def get_document(doc_id: str):
        """Get a specific document."""
        docs = get_all_documents(100)
        for doc in docs:
            if doc["id"] == doc_id:
                return {"document": doc}
        return {"error": "Document not found"}

    def get_stats():
        """Get document statistics."""
        return get_document_stats()

    return {
        "list_documents": list_documents,
        "get_document": get_document,
        "get_stats": get_stats,
    }
