"""
Test cases for evaluating Scout.

Each test case includes:
- question: The natural language question to ask
- expected_strings: Strings that should appear in the response (ALL must match)
- expected_any: Strings where AT LEAST ONE must match (optional)
- category: Test category for filtering
- expected_source: Expected primary source used
- expected_path: Expected path where answer should be found
"""

from dataclasses import dataclass, field


@dataclass
class TestCase:
    """A test case for evaluating Scout."""

    question: str
    expected_strings: list[str]
    category: str
    expected_source: str | None = None
    expected_path: str | None = None
    # At least one of these must match (for flexible matching)
    expected_any: list[str] = field(default_factory=list)


# Test cases organized by category
TEST_CASES: list[TestCase] = [
    # =========================================================================
    # ROUTING - Does Scout find info in the expected source?
    # =========================================================================
    TestCase(
        question="What's our PTO policy?",
        expected_strings=["unlimited"],
        expected_any=["PTO", "time off", "vacation", "paid time off"],
        category="routing",
        expected_source="s3",
        expected_path="s3://company-docs/policies/employee-handbook.md",
    ),
    TestCase(
        question="How do I deploy to production?",
        expected_strings=["deploy", "production"],
        expected_any=["staging", "release", "rollout", "canary"],
        category="routing",
        expected_source="s3",
        expected_path="s3://engineering-docs/runbooks/deployment.md",
    ),
    TestCase(
        question="What are our Q4 OKRs?",
        expected_strings=["Q4"],
        expected_any=["OKR", "objective", "key result", "goal", "target"],
        category="routing",
        expected_source="s3",
        expected_path="s3://company-docs/planning/q4-2024-okrs.md",
    ),
    TestCase(
        question="What is our system architecture?",
        expected_strings=["architecture"],
        expected_any=["service", "microservice", "microservices", "API", "infrastructure"],
        category="routing",
        expected_source="s3",
        expected_path="s3://engineering-docs/architecture/system-overview.md",
    ),
    TestCase(
        question="What are the data retention requirements?",
        expected_strings=["retention"],
        expected_any=["days", "years", "policy", "GDPR", "compliance", "delete"],
        category="routing",
        expected_source="s3",
        expected_path="s3://company-docs/policies/data-retention.md",
    ),
    TestCase(
        question="How do I handle incidents?",
        expected_strings=["incident"],
        expected_any=["SEV", "severity", "response", "on-call", "page", "escalat"],
        category="routing",
        expected_source="s3",
        expected_path="s3://engineering-docs/runbooks/incident-response.md",
    ),
    # =========================================================================
    # CONTENT - Does Scout return correct content?
    # =========================================================================
    TestCase(
        question="What's the RPO and RTO for disaster recovery?",
        expected_strings=["RPO", "RTO"],
        expected_any=["hour", "1 hour", "4 hour", "recovery"],
        category="content",
        expected_source="s3",
        expected_path="s3://engineering-docs/architecture/system-overview.md",
    ),
    TestCase(
        question="What are our core values?",
        expected_strings=["Customer First"],
        expected_any=["Move Fast", "Transparent", "Own", "value"],
        category="content",
        expected_source="s3",
        expected_path="s3://company-docs/policies/employee-handbook.md",
    ),
    TestCase(
        question="How many years do we retain customer data?",
        expected_strings=["7"],
        expected_any=["years", "year", "customer", "retention"],
        category="content",
        expected_source="s3",
        expected_path="s3://company-docs/policies/data-retention.md",
    ),
    TestCase(
        question="What's the target ARR for Q4?",
        expected_strings=["$10M", "ARR"],
        expected_any=["revenue", "target", "Q4", "goal"],
        category="content",
        expected_source="s3",
        expected_path="s3://company-docs/planning/q4-2024-okrs.md",
    ),
    TestCase(
        question="How do I rollback a deployment?",
        expected_strings=["rollback"],
        expected_any=["production", "version", "deploy", "revert", "script"],
        category="content",
        expected_source="s3",
        expected_path="s3://engineering-docs/runbooks/deployment.md",
    ),
    # =========================================================================
    # CROSS-SOURCE - Can Scout synthesize from multiple sources?
    # =========================================================================
    TestCase(
        question="What was decided about the pricing tiers?",
        expected_strings=["pricing"],
        expected_any=["Option B", "decision", "decided", "approved", "simplicity"],
        category="cross_source",
        expected_source="slack",
        expected_path=None,
    ),
    TestCase(
        question="Who is the expert on backend systems?",
        expected_strings=[],
        expected_any=["Sarah", "Chen", "backend", "engineer", "@sarah"],
        category="cross_source",
        expected_source="slack",
    ),
    TestCase(
        question="What are the recent company announcements?",
        expected_strings=[],
        expected_any=["announcement", "Series B", "performance review", "closed", "raised"],
        category="cross_source",
        expected_source="slack",
    ),
    # =========================================================================
    # NEGATIVE - Does Scout handle "not found" gracefully?
    # =========================================================================
    TestCase(
        question="What's our policy on bringing pets to work?",
        expected_strings=[],
        expected_any=[
            "couldn't find",
            "could not find",
            "not found",
            "no policy",
            "no information",
            "don't have",
            "unable to find",
            "no results",
            "doesn't appear",
            "does not appear",
            "not mentioned",
            "no mention",
            "does not mention",
            "not documented",
            "may not be documented",
            "not be documented",
        ],
        category="negative",
        expected_source=None,
    ),
    TestCase(
        question="Where is the documentation for Project XYZ123?",
        expected_strings=[],
        expected_any=[
            "couldn't find",
            "could not find",
            "not found",
            "no documentation",
            "no results",
            "unable to find",
            "don't have",
            "doesn't exist",
            "does not exist",
            "no information",
            "not aware",
            "no matches",
            "not documented",
            "may not exist",
        ],
        category="negative",
        expected_source=None,
    ),
    # =========================================================================
    # LEARNING - Does Scout improve on repeated similar queries?
    # =========================================================================
    TestCase(
        question="Where can I find information about time off?",
        expected_strings=["handbook"],
        expected_any=["PTO", "time off", "vacation", "employee-handbook"],
        category="learning",
        expected_source="s3",
        expected_path="s3://company-docs/policies/employee-handbook.md",
    ),
    TestCase(
        question="What's the vacation policy?",
        expected_strings=["unlimited"],
        expected_any=["PTO", "vacation", "time off", "manager approval"],
        category="learning",
        expected_source="s3",
        expected_path="s3://company-docs/policies/employee-handbook.md",
    ),
    # =========================================================================
    # PRECISION - Does Scout provide accurate specific details?
    # =========================================================================
    TestCase(
        question="What is the minimum recommended PTO per year?",
        expected_strings=["2 weeks", "minimum"],
        expected_any=["PTO", "recommended", "vacation"],
        category="content",
        expected_source="s3",
        expected_path="s3://company-docs/policies/employee-handbook.md",
    ),
    TestCase(
        question="What database do we use for the primary data store?",
        expected_strings=["PostgreSQL"],
        expected_any=["RDS", "database", "primary", "data store"],
        category="content",
        expected_source="s3",
        expected_path="s3://engineering-docs/architecture/system-overview.md",
    ),
    TestCase(
        question="What is the response time SLA for SEV-1 incidents?",
        expected_strings=["15"],
        expected_any=["minutes", "minute", "SEV-1", "response"],
        category="content",
        expected_source="s3",
        expected_path="s3://engineering-docs/runbooks/incident-response.md",
    ),
]

# Categories for filtering
CATEGORIES = ["routing", "content", "cross_source", "negative", "learning"]


def get_test_cases_by_category(category: str) -> list[TestCase]:
    """Get test cases filtered by category."""
    return [tc for tc in TEST_CASES if tc.category == category]
