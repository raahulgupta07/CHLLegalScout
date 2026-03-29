"""
Fast Info Tool
============

Quick direct answers for common questions without deep searching.
Uses PostgreSQL database for ALL data.
"""

from pathlib import Path
from typing import Any

from scout.tools.template_analyzer import get_all_templates_from_db, get_db_connection
from scout.tools.document_tracker import get_all_documents, get_document_stats
from scout.tools.companies_db import get_companies_info

DOCUMENTS_DIR = Path("/documents")


def get_companies_from_knowledge_lookup() -> list[str]:
    """Get companies from knowledge_lookup table as fallback."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT DISTINCT key_value 
            FROM knowledge_lookup 
            WHERE key_name ILIKE %s AND key_value IS NOT NULL
            ORDER BY key_value
            """,
            ("company%",),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [row[0] for row in rows if row[0]]
    except Exception as e:
        print(f"Error getting companies from knowledge_lookup: {e}")
        return []


def get_templates_info() -> dict[str, Any]:
    """Get all templates info from database (single source of truth)."""
    templates_db = get_all_templates_from_db()
    template_names = [t["name"] for t in templates_db]

    return {
        "total": len(template_names),
        "analyzed": len(templates_db),
        "templates": template_names,
        "analyzed_details": templates_db,
    }


def format_templates_display(templates_info: dict) -> str:
    """Format templates into a nice display string."""
    lines = []
    lines.append("📋 **Available Templates**")
    lines.append("")

    all_templates = templates_info.get("templates", [])
    details = templates_info.get("analyzed_details", [])

    lines.append(f"Total: {len(all_templates)} templates")
    lines.append("")

    if not details:
        # No analyzed details - show simple list
        for i, t in enumerate(all_templates, 1):
            clean_name = t.replace(".docx", "").replace("_", " ")
            lines.append(f"{i}. {clean_name}")
    else:
        # Has details - show with purpose
        for i, t in enumerate(details, 1):
            name = t.get("name", "Unknown")
            purpose = t.get("purpose", "")
            fields = t.get("total_fields", 0)
            complexity = t.get("complexity", "Medium")

            clean_name = name.replace(".docx", "").replace("_", " ")

            lines.append(f"**{i}. {clean_name}**")
            if purpose:
                lines.append(f"   📝 {purpose}")
            lines.append(f"   📊 {fields} fields | {complexity}")
            lines.append("")

    lines.append("---")
    lines.append("💡 Say: 'Create [template name] for [company name]' to generate")

    return "\n".join(lines)


def format_companies_display(companies_info: dict) -> str:
    """Format companies into a nice display string."""
    lines = []
    lines.append("🏢 **Available Companies**")
    lines.append("")

    companies = companies_info.get("companies", [])
    total = companies_info.get("total", len(companies))

    lines.append(f"Total: {total} companies")
    lines.append("")

    # Show in columns
    for i, c in enumerate(companies[:30], 1):
        lines.append(f"{i}. {c}")

    if total > 30:
        lines.append("")
        lines.append(f"... and {total - 30} more")

    lines.append("")
    lines.append("---")
    lines.append("💡 Say: 'Create AGM for [company name]' to generate a document")

    return "\n".join(lines)


def get_documents_info() -> dict[str, Any]:
    """Get all documents info from database."""
    stats = get_document_stats()

    return {
        "total": stats.get("total_documents", 0),
        "documents": stats.get("recent_documents", [])[:10],
        "by_company": stats.get("by_company", {}),
        "by_template": stats.get("by_template", {}),
        "recent": stats.get("recent_documents", [])[:5],
    }


def get_companies_info_from_db() -> dict[str, Any]:
    """Get companies info from database - tries companies table first, then knowledge_lookup."""
    # Try companies table first
    companies = get_companies_info()

    if companies.get("total", 0) == 0:
        # Fallback: read from knowledge_lookup
        knowledge_companies = get_companies_from_knowledge_lookup()
        if knowledge_companies:
            return {
                "total": len(knowledge_companies),
                "companies": knowledge_companies[:50],
                "source": "knowledge_lookup",
            }

    return companies


def create_fast_info_tool(documents_dir: str = "/documents"):
    """Create the fast info tool for quick answers."""

    def quick_info(info_type: str = "all") -> dict[str, Any]:
        """
        Get quick info without deep searching.

        info_type can be: templates, documents, companies, all
        """
        templates = get_templates_info()
        docs = get_documents_info()
        companies = get_companies_info_from_db()

        if info_type == "templates":
            return {
                "templates": templates,
                "display": format_templates_display(templates),
            }
        elif info_type == "companies":
            return {
                "companies": companies,
                "display": format_companies_display(companies),
            }
        elif info_type == "documents":
            return docs
        else:
            return {
                "templates": templates,
                "display_templates": format_templates_display(templates),
                "companies": companies,
                "display_companies": format_companies_display(companies),
                "documents": docs,
            }

    return {"quick_info": quick_info}
