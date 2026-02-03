"""
Run evaluations against Scout.

Usage:
    python -m scout.evals.run_evals
    python -m scout.evals.run_evals --category routing
    python -m scout.evals.run_evals --verbose
    python -m scout.evals.run_evals --llm-grader
"""

import argparse
import time
from typing import TypedDict

from rich.console import Console
from rich.panel import Panel
from rich.progress import BarColumn, Progress, SpinnerColumn, TaskProgressColumn, TextColumn
from rich.table import Table
from rich.text import Text

from scout.evals.grader import check_path_in_response, check_source_in_response
from scout.evals.test_cases import CATEGORIES, TEST_CASES, TestCase


class EvalResult(TypedDict, total=False):
    status: str
    question: str
    category: str
    missing: list[str] | None
    missing_any: bool
    duration: float
    response: str | None
    error: str
    # LLM grading fields
    llm_grade: float | None
    llm_reasoning: str | None
    # Source verification fields
    source_match: bool | None
    path_match: bool | None


console = Console()


def check_strings_in_response(response: str, expected: list[str]) -> list[str]:
    """Check which expected strings are missing from the response (ALL must match)."""
    response_normalized = normalize_text(response)
    return [v for v in expected if normalize_text(v) not in response_normalized]


def normalize_text(text: str) -> str:
    """Normalize text for comparison - handles different apostrophe styles, etc."""
    # Replace curly apostrophes with straight ones
    text = text.replace("'", "'").replace("'", "'").replace("`", "'")
    # Replace curly quotes
    text = text.replace(""", '"').replace(""", '"')
    return text.lower()


def check_any_string_in_response(response: str, expected_any: list[str]) -> bool:
    """Check if AT LEAST ONE expected string is in the response."""
    if not expected_any:
        return True  # No requirement means pass
    response_normalized = normalize_text(response)
    return any(normalize_text(v) in response_normalized for v in expected_any)


def run_evals(
    category: str | None = None,
    verbose: bool = False,
    llm_grader: bool = False,
):
    """
    Run evaluation suite.

    Args:
        category: Filter tests by category
        verbose: Show full responses on failure
        llm_grader: Use LLM to grade responses
    """
    from scout.agents import scout

    # Filter tests
    tests = TEST_CASES
    if category:
        tests = [tc for tc in tests if tc.category == category]

    if not tests:
        console.print(f"[red]No tests found for category: {category}[/red]")
        return

    # Show evaluation mode
    mode_info = []
    if llm_grader:
        mode_info.append("LLM grading")
    if not mode_info:
        mode_info.append("String matching + source verification")

    console.print(
        Panel(
            f"[bold]Running {len(tests)} tests[/bold]\nMode: {', '.join(mode_info)}",
            style="blue",
        )
    )

    results: list[EvalResult] = []
    start = time.time()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Evaluating...", total=len(tests))

        for test_case in tests:
            progress.update(task, description=f"[cyan]{test_case.question[:40]}...[/cyan]")
            test_start = time.time()

            try:
                result = scout.run(test_case.question)
                response = result.content or ""
                duration = time.time() - test_start

                # Evaluate the response
                eval_result = evaluate_response(
                    test_case=test_case,
                    response=response,
                    llm_grader=llm_grader,
                )

                results.append(
                    {
                        "status": eval_result["status"],
                        "question": test_case.question,
                        "category": test_case.category,
                        "missing": eval_result.get("missing"),
                        "missing_any": eval_result.get("missing_any", False),
                        "duration": duration,
                        "response": response if verbose else None,
                        "llm_grade": eval_result.get("llm_grade"),
                        "llm_reasoning": eval_result.get("llm_reasoning"),
                        "source_match": eval_result.get("source_match"),
                        "path_match": eval_result.get("path_match"),
                    }
                )

            except Exception as e:
                duration = time.time() - test_start
                results.append(
                    {
                        "status": "ERROR",
                        "question": test_case.question,
                        "category": test_case.category,
                        "missing": None,
                        "duration": duration,
                        "error": str(e),
                        "response": None,
                    }
                )

            progress.advance(task)

    total_duration = time.time() - start

    # Results table
    display_results(results, verbose, llm_grader)

    # Summary
    display_summary(results, total_duration, category)


def evaluate_response(
    test_case: TestCase,
    response: str,
    llm_grader: bool = False,
) -> dict:
    """
    Evaluate an agent response using configured methods.

    Returns a dict with:
        - status: "PASS" or "FAIL"
        - missing: list of missing expected strings (ALL must match)
        - missing_any: bool if expected_any check failed
        - source_match: bool if expected source was used
        - path_match: bool if expected path was referenced
        - llm_grade: float score from LLM grader
        - llm_reasoning: string explanation from LLM
    """
    result: dict = {}

    # 1. String matching - ALL expected_strings must match
    missing = check_strings_in_response(response, test_case.expected_strings)
    result["missing"] = missing if missing else None
    string_pass = len(missing) == 0

    # 2. Any string matching - AT LEAST ONE expected_any must match
    any_pass = check_any_string_in_response(response, test_case.expected_any)
    result["missing_any"] = not any_pass

    # 3. Source verification (if expected_source specified)
    source_pass: bool | None = None
    if test_case.expected_source:
        source_pass = check_source_in_response(response, test_case.expected_source)
        result["source_match"] = source_pass

    # 4. Path verification (if expected_path specified)
    path_pass: bool | None = None
    if test_case.expected_path:
        path_pass = check_path_in_response(response, test_case.expected_path)
        result["path_match"] = path_pass

    # 5. LLM grading (if enabled)
    llm_pass: bool | None = None
    if llm_grader:
        try:
            from scout.evals.grader import grade_response

            grade = grade_response(
                question=test_case.question,
                response=response,
                expected_values=test_case.expected_strings,
                expected_any=test_case.expected_any,
                expected_source=test_case.expected_source,
                expected_path=test_case.expected_path,
            )
            result["llm_grade"] = grade.score
            result["llm_reasoning"] = grade.reasoning
            llm_pass = grade.passed
        except Exception as e:
            result["llm_grade"] = None
            result["llm_reasoning"] = f"Error: {e}"

    # Determine final status
    # Priority: LLM grader > combined checks > string checks
    if llm_grader and llm_pass is not None:
        result["status"] = "PASS" if llm_pass else "FAIL"
    else:
        # Combined check: string_pass AND any_pass must both be true
        all_pass = string_pass and any_pass
        # If source check exists and failed, it's a fail
        if source_pass is False:
            all_pass = False
        result["status"] = "PASS" if all_pass else "FAIL"

    return result


def display_results(
    results: list[EvalResult],
    verbose: bool,
    llm_grader: bool,
):
    """Display results table."""
    table = Table(title="Results", show_lines=True)
    table.add_column("Status", style="bold", width=6)
    table.add_column("Category", style="dim", width=12)
    table.add_column("Question", width=40)
    table.add_column("Time", justify="right", width=6)
    table.add_column("Source", width=8)
    table.add_column("Notes", width=30)

    for r in results:
        if r["status"] == "PASS":
            status = Text("PASS", style="green")
            notes = ""
            if llm_grader and r.get("llm_grade") is not None:
                notes = f"LLM: {r['llm_grade']:.1f}"
        elif r["status"] == "FAIL":
            status = Text("FAIL", style="red")
            llm_reasoning = r.get("llm_reasoning")
            missing = r.get("missing")
            missing_any = r.get("missing_any", False)
            if llm_grader and llm_reasoning:
                notes = llm_reasoning[:30]
            elif missing:
                notes = f"Missing: {', '.join(missing[:2])}"
            elif missing_any:
                notes = "Missing: expected_any"
            else:
                notes = ""
        else:
            status = Text("ERR", style="yellow")
            notes = (r.get("error") or "")[:30]

        # Source match indicator
        source_match = r.get("source_match")
        if source_match is True:
            source_text = Text("✓", style="green")
        elif source_match is False:
            source_text = Text("✗", style="red")
        else:
            source_text = Text("-", style="dim")

        table.add_row(
            status,
            r["category"],
            r["question"][:38] + "..." if len(r["question"]) > 38 else r["question"],
            f"{r['duration']:.1f}s",
            source_text,
            notes,
        )

    console.print(table)

    # Verbose output for failures
    if verbose:
        failures = [r for r in results if r["status"] == "FAIL" and r.get("response")]
        if failures:
            console.print("\n[bold red]Failed Responses:[/bold red]")
            for r in failures:
                resp = r["response"] or ""
                panel_content = resp[:500] + "..." if len(resp) > 500 else resp

                if r.get("llm_reasoning"):
                    panel_content += f"\n\n[dim]LLM Reasoning: {r['llm_reasoning']}[/dim]"
                if r.get("source_match") is False:
                    panel_content += "\n[dim]Source: Did not match expected[/dim]"
                if r.get("path_match") is False:
                    panel_content += "\n[dim]Path: Did not match expected[/dim]"
                if r.get("missing"):
                    panel_content += f"\n[dim]Missing strings: {r['missing']}[/dim]"
                if r.get("missing_any"):
                    panel_content += "\n[dim]Missing: none of expected_any matched[/dim]"

                console.print(
                    Panel(
                        panel_content,
                        title=f"[red]{r['question'][:60]}[/red]",
                        border_style="red",
                    )
                )


def display_summary(results: list[EvalResult], total_duration: float, category: str | None):
    """Display summary statistics."""
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    total = len(results)
    rate = (passed / total * 100) if total else 0

    # Source match stats
    source_matches = sum(1 for r in results if r.get("source_match") is True)
    source_total = sum(1 for r in results if r.get("source_match") is not None)

    summary = Table.grid(padding=(0, 2))
    summary.add_column(style="bold")
    summary.add_column()

    summary.add_row("Total:", f"{total} tests in {total_duration:.1f}s")
    summary.add_row("Passed:", Text(f"{passed} ({rate:.0f}%)", style="green" if rate >= 80 else "yellow"))
    summary.add_row("Failed:", Text(str(failed), style="red" if failed else "dim"))
    summary.add_row("Errors:", Text(str(errors), style="yellow" if errors else "dim"))
    summary.add_row("Avg time:", f"{total_duration / total:.1f}s per test" if total else "N/A")

    if source_total > 0:
        source_rate = (source_matches / source_total * 100)
        summary.add_row("Source match:", f"{source_matches}/{source_total} ({source_rate:.0f}%)")

    # Add LLM grading average if available
    llm_grades: list[float] = [
        r["llm_grade"] for r in results if r.get("llm_grade") is not None and isinstance(r["llm_grade"], (int, float))
    ]
    if llm_grades:
        avg_grade = sum(llm_grades) / len(llm_grades)
        summary.add_row("Avg LLM Score:", f"{avg_grade:.2f}")

    console.print(
        Panel(
            summary,
            title="[bold]Summary[/bold]",
            border_style="green" if rate >= 90 else "yellow" if rate >= 70 else "red",
        )
    )

    # Category breakdown
    if not category and len(CATEGORIES) > 1:
        cat_table = Table(title="By Category", show_header=True)
        cat_table.add_column("Category")
        cat_table.add_column("Passed", justify="right")
        cat_table.add_column("Total", justify="right")
        cat_table.add_column("Rate", justify="right")

        for cat in CATEGORIES:
            cat_results = [r for r in results if r["category"] == cat]
            cat_passed = sum(1 for r in cat_results if r["status"] == "PASS")
            cat_total = len(cat_results)
            cat_rate = (cat_passed / cat_total * 100) if cat_total else 0

            rate_style = "green" if cat_rate == 100 else "yellow" if cat_rate >= 50 else "red"
            cat_table.add_row(
                cat,
                str(cat_passed),
                str(cat_total),
                Text(f"{cat_rate:.0f}%", style=rate_style),
            )

        console.print(cat_table)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Scout evaluations")
    parser.add_argument("--category", "-c", choices=CATEGORIES, help="Filter by category")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show full responses on failure")
    parser.add_argument(
        "--llm-grader",
        "-g",
        action="store_true",
        help="Use LLM to grade responses (requires OPENAI_API_KEY)",
    )
    args = parser.parse_args()

    run_evals(
        category=args.category,
        verbose=args.verbose,
        llm_grader=args.llm_grader,
    )
