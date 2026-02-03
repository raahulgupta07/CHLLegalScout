"""
Scout Evaluation Suite.

Usage:
    python -m scout.evals.run_evals              # String matching (default)
    python -m scout.evals.run_evals --llm-grader # LLM-based grading
    python -m scout.evals.run_evals -c routing   # Run specific category
    python -m scout.evals.run_evals -v           # Verbose (show failed responses)
"""

from scout.evals.grader import GradeResult, check_path_in_response, check_source_in_response, grade_response
from scout.evals.test_cases import CATEGORIES, TEST_CASES, TestCase, get_test_cases_by_category

__all__ = [
    "TEST_CASES",
    "CATEGORIES",
    "TestCase",
    "get_test_cases_by_category",
    "grade_response",
    "GradeResult",
    "check_source_in_response",
    "check_path_in_response",
]
