"""
Clarification Helper Tools
==========================

Helps agent understand what templates and companies are available
for better clarifying questions.
"""

from pathlib import Path
from typing import Any



def list_available_templates(documents_dir: str = "/documents") -> dict[str, Any]:
    """
    List all available document templates.

    Returns:
        Dictionary with list of templates and their purposes
    """
    templates_dir = Path(documents_dir) / "legal" / "templates"

    if not templates_dir.exists():
        return {
            "available": False,
            "error": "Templates directory not found",
            "templates": [],
        }

    templates = []
    for f in templates_dir.glob("*.docx"):
        name = f.stem
        templates.append(
            {
                "name": f.name,
                "display_name": name.replace("_", " ").title(),
                "path": str(f),
            }
        )

    return {
        "available": True,
        "templates": templates,
        "count": len(templates),
    }


def find_matching_templates(search_term: str, documents_dir: str = "/documents") -> dict[str, Any]:
    """
    Find templates matching a search term (fuzzy match).
    Returns multiple matches if found, or exact/near match if only one.

    Handles:
    - "AGM" -> "Annual General Meeting Minutes.docx"
    - "director consent" -> matches multiple director consent templates
    - Exact file names

    Returns:
        Dictionary with matched templates, count, and whether clarification needed
    """
    # Read templates from DB (single source of truth)
    try:
        from scout.tools.template_analyzer import get_all_templates_from_db
        db_templates = get_all_templates_from_db()
        all_template_names = [t["name"] for t in db_templates]
    except Exception as e:
        import logging
        logging.getLogger("legalscout").warning(f"Template DB read failed: {e}")
        all_template_names = []

    if not all_template_names:
        return {
            "found": False,
            "matches": [],
            "clarification_needed": False,
            "error": "No templates in database. Upload templates from the Dashboard first.",
        }

    search_lower = search_term.lower().strip()
    search_normalized = search_lower.replace(" ", "_")

    matches = []

    for template_name in all_template_names:
        name_lower = template_name.replace(".docx", "").lower()
        name_normalized = name_lower.replace("_", " ")

        if (
            search_lower in name_lower
            or search_normalized in name_normalized
            or name_lower in search_lower
            or any(word in name_lower for word in search_lower.split() if len(word) > 2)
        ):
            stem = template_name.replace(".docx", "")
            matches.append(
                {
                    "name": template_name,
                    "display_name": stem.replace("_", " ").title(),
                    "path": f"/documents/legal/templates/{template_name}",
                    "match_score": _calculate_match_score(search_lower, name_lower),
                }
            )

    matches.sort(key=lambda x: x["match_score"], reverse=True)

    if len(matches) == 0:
        return {
            "found": False,
            "matches": [],
            "clarification_needed": True,
            "suggestion": f"No templates found matching '{search_term}'. Available: "
            + ", ".join([n.replace(".docx", "").replace("_", " ").title() for n in all_template_names[:10]]),
        }
    elif len(matches) == 1:
        return {
            "found": True,
            "matches": matches,
            "clarification_needed": False,
            "selected_template": matches[0]["name"],
        }
    else:
        # Use letter format for button-friendly selection (a, b, c, d, e)
        letters = ['a', 'b', 'c', 'd', 'e']
        options_text = []
        for i, m in enumerate(matches[:5]):
            options_text.append(f"{letters[i]}) {m['display_name']}")

        # Format message with options for button display
        message_lines = [f"Found {len(matches)} templates matching '{search_term}'. Which one?", ""]
        message_lines.extend(options_text)
        message_lines.append("")
        message_lines.append("What would you like to do?")

        return {
            "found": True,
            "matches": matches,
            "clarification_needed": True,
            "message": "\n".join(message_lines),
            "options": options_text,
        }


def _calculate_match_score(search: str, template_name: str) -> int:
    """Calculate how well a template matches the search term."""
    score = 0

    if search == template_name:
        return 100

    if template_name.startswith(search):
        score += 50

    if search in template_name:
        score += 30

    for word in search.split():
        if word in template_name and len(word) > 2:
            score += 10

    if template_name.startswith(search.split()[0] if search.split() else ""):
        score += 20

    return score


def list_available_companies(documents_dir: str = "/documents") -> dict[str, Any]:
    """
    List all companies from the companies DB table.

    Returns:
        Dictionary with list of companies and their details
    """
    try:
        from scout.tools.companies_db import get_all_companies
        db_companies = get_all_companies(limit=200)
        if db_companies:
            companies = []
            for c in db_companies:
                companies.append({
                    "company_name": c.get("name", ""),
                    "company_registration_number": c.get("registration_number", ""),
                    "registered_office": c.get("address", ""),
                    "directors": c.get("directors", ""),
                })
            return {
                "available": True,
                "companies": companies,
                "total": len(companies),
            }
    except Exception as e:
        print(f"DB company lookup failed: {e}")

    return {
        "available": False,
        "error": "No companies found in database. Add companies from the admin panel.",
        "companies": [],
    }


def find_company_suggestions(partial_name: str, documents_dir: str = "/documents") -> dict[str, Any]:
    """
    Find companies that match a partial name (for clarification).

    Args:
        partial_name: Partial company name to search for

    Returns:
        Dictionary with matching company suggestions
    """
    data = list_available_companies(documents_dir)

    if not data.get("available"):
        return data

    partial_lower = partial_name.lower().strip()

    matches = []
    for company in data["companies"]:
        company_name = str(company.get("company_name", "")).lower()
        if partial_lower in company_name or company_name in partial_lower:
            matches.append(company)

    # Format with buttons if 2-5 matches
    if 2 <= len(matches) <= 5:
        letters = ['a', 'b', 'c', 'd', 'e']
        options_text = []
        message_lines = [f"Found {len(matches)} companies matching '{partial_name}'. Which one?", ""]

        for i, company in enumerate(matches[:5]):
            comp_name = company.get("company_name", "Unknown")
            options_text.append(f"{letters[i]}) {comp_name}")
            message_lines.append(f"{letters[i]}) {comp_name}")

        message_lines.append("")
        message_lines.append("What would you like to do?")

        return {
            "search_term": partial_name,
            "matches": matches,
            "count": len(matches),
            "suggestion": "\n".join(message_lines),
            "options": options_text,
            "show_buttons": True,
        }

    return {
        "search_term": partial_name,
        "matches": matches,
        "count": len(matches),
        "suggestion": f"Found {len(matches)} company(ies)" if matches else "No matches found",
    }


def create_clarification_tool(documents_dir: str = "/documents"):
    """Create the clarification helper tool for the agent."""

    def get_clarification_info() -> dict[str, Any]:
        """
        Get information to help clarify user requests.

        Returns:
            Available templates and companies for clarification
        """
        templates = list_available_templates(documents_dir)
        companies = list_available_companies(documents_dir)

        return {
            "templates": templates.get("templates", []),
            "companies": companies.get("companies", []),
            "message": "Use this information to ask clarifying questions when needed.",
        }

    def check_company(company_name: str) -> dict[str, Any]:
        """
        Check if a company exists and get details.

        Args:
            company_name: Name of the company to check (can be number like "1", "2", or "first", "second")

        Returns:
            Company details or suggestions for clarification
        """
        # Handle number selection (e.g., "1", "2", "3")
        if company_name.strip().isdigit():
            company_num = int(company_name.strip())
            all_companies = list_available_companies(documents_dir)
            companies = all_companies.get("companies", [])
            if 0 < company_num <= len(companies):
                company = companies[company_num - 1]
                return {
                    "found": True,
                    "company": company.get("company_name"),
                    "registration_no": company.get("registration_number"),
                    "data": company,
                }
            return {
                "found": False,
                "error": f"Invalid selection. Please choose 1-{len(companies)}",
                "available_companies": [c.get("company_name") for c in companies[:20]],  # Show more companies
                "total_count": len(companies),
            }

        # Handle "first", "second", etc.
        selection_map = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5}
        if company_name.lower().strip() in selection_map:
            company_num = selection_map[company_name.lower().strip()]
            all_companies = list_available_companies(documents_dir)
            companies = all_companies.get("companies", [])
            if 0 < company_num <= len(companies):
                company = companies[company_num - 1]
                return {
                    "found": True,
                    "company": company.get("company_name"),
                    "registration_no": company.get("registration_number"),
                    "data": company,
                }

        suggestions = find_company_suggestions(company_name, documents_dir)

        if suggestions["count"] == 0:
            all_companies = list_available_companies(documents_dir)
            return {
                "found": False,
                "message": f"Company '{company_name}' not found",
                "suggestions": "Did you mean one of these? "
                + ", ".join([c.get("company_name", "") for c in all_companies.get("companies", [])[:5]]),
            }
        elif suggestions["count"] == 1:
            return {
                "found": True,
                "company": suggestions["matches"][0],
            }
        else:
            # Format with buttons if 2-5 matches
            if 2 <= suggestions["count"] <= 5:
                letters = ['a', 'b', 'c', 'd', 'e']
                options_text = []
                message_lines = [f"Found {suggestions['count']} companies matching '{company_name}'. Which one?", ""]

                for i, company in enumerate(suggestions["matches"][:5]):
                    comp_name = company.get("company_name", "Unknown")
                    options_text.append(f"{letters[i]}) {comp_name}")
                    message_lines.append(f"{letters[i]}) {comp_name}")

                message_lines.append("")
                message_lines.append("What would you like to do?")

                return {
                    "found": False,
                    "multiple_matches": True,
                    "message": "\n".join(message_lines),
                    "matches": suggestions["matches"],
                    "options": options_text,
                    "show_buttons": True,
                }

            return {
                "found": False,
                "multiple_matches": True,
                "message": f"Found {suggestions['count']} companies matching '{company_name}'",
                "matches": suggestions["matches"],
                "suggestion": "Please clarify which company you mean: "
                + ", ".join([c.get("company_name", "") for c in suggestions["matches"]]),
            }

    return {
        "get_clarification_info": get_clarification_info,
        "check_company": check_company,
        "list_templates": lambda: list_available_templates(documents_dir),
        "list_companies": lambda: list_available_companies(documents_dir),
        "find_matching_templates": find_matching_templates,
    }
