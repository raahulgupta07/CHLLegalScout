"""
Scout Evaluation Suite.

Usage:
    python -m scout.evals.run_evals                    # String matching (default)
    python -m scout.evals.run_evals --llm-grader       # LLM-based grading
    python -m scout.evals.run_evals --check-sources    # Source citation verification
    python -m scout.evals.run_evals -g -s -v           # All modes combined
"""

from scout.evals.grader import GradeResult, grade_response
from scout.evals.test_cases import CATEGORIES, TEST_CASES, TestCase

__all__ = [
    "TEST_CASES",
    "CATEGORIES",
    "TestCase",
    "grade_response",
    "GradeResult",
]
