"""
LLM-based grader for evaluating Scout responses.

Uses a small, fast model to evaluate if the agent's response correctly
answers the user's question given the expected results.
"""

from dataclasses import dataclass

from openai import OpenAI


@dataclass
class GradeResult:
    """Result of LLM grading."""

    passed: bool
    reasoning: str
    score: float  # 0.0 to 1.0


GRADER_SYSTEM_PROMPT = """\
You are an evaluation grader for an enterprise knowledge agent. Your job is to determine if the agent's
response correctly answers the user's question about finding information.

You will be given:
1. The user's question
2. The agent's response
3. Expected strings that MUST appear in the response (all required)
4. Expected strings where AT LEAST ONE must appear (any of these)
5. Expected source (s3, google_drive, notion, slack) if specified
6. Expected path where the answer should be found if specified

Evaluate based on:
- Relevance: Does the response address the question?
- Correctness: Does it contain the expected information?
- Source accuracy: Did it mention or use the expected source?
- Path accuracy: Did it reference the expected path (if specified)?
- Helpfulness: Is the response actionable and useful?
- Negative handling: If info wasn't found, did agent clearly communicate this?

Be lenient about:
- Extra information (the agent may provide more context)
- Different phrasing or formatting
- Minor variations in paths or terminology
- Synonyms (e.g., "PTO" vs "vacation" vs "time off")

Be strict about:
- Factual accuracy - wrong information is worse than no information
- Missing critical details when they were expected
- Hallucinating information that doesn't exist

Respond in this exact format:
SCORE: [0.0-1.0]
PASSED: [true/false]
REASONING: [brief explanation]
"""


def grade_response(
    question: str,
    response: str,
    expected_values: list[str],
    expected_any: list[str] | None = None,
    expected_source: str | None = None,
    expected_path: str | None = None,
    model: str = "gpt-4.1-mini",
) -> GradeResult:
    """
    Use an LLM to grade the agent's response.

    Args:
        question: The original question asked
        response: The agent's response text
        expected_values: List of strings that MUST appear in the response
        expected_any: List where AT LEAST ONE must appear
        expected_source: Optional expected source that should be used
        expected_path: Optional expected path where answer should be found
        model: The model to use for grading

    Returns:
        GradeResult with pass/fail, score, and reasoning
    """
    client = OpenAI()

    expected_context = ""
    if expected_values:
        expected_context += f"Required strings (ALL must match): {', '.join(expected_values)}\n"
    if expected_any:
        expected_context += f"Flexible strings (AT LEAST ONE must match): {', '.join(expected_any)}\n"
    if expected_source:
        expected_context += f"Expected source: {expected_source}\n"
    if expected_path:
        expected_context += f"Expected path: {expected_path}\n"

    if not expected_context:
        expected_context = "No specific expectations provided - evaluate based on helpfulness."

    user_message = f"""\
Question: {question}

Agent Response:
{response}

Expected:
{expected_context}

Grade this response."""

    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": GRADER_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0,
        max_tokens=500,
    )

    grader_response = completion.choices[0].message.content or ""
    return _parse_grade_response(grader_response)


def _parse_grade_response(response: str) -> GradeResult:
    """Parse the grader's response into a GradeResult."""
    lines = response.strip().split("\n")

    score = 0.5
    passed = False
    reasoning = "Could not parse grader response"

    for line in lines:
        line = line.strip()
        if line.startswith("SCORE:"):
            try:
                score = float(line.split(":", 1)[1].strip())
            except ValueError:
                pass
        elif line.startswith("PASSED:"):
            passed_str = line.split(":", 1)[1].strip().lower()
            passed = passed_str == "true"
        elif line.startswith("REASONING:"):
            reasoning = line.split(":", 1)[1].strip()

    return GradeResult(passed=passed, reasoning=reasoning, score=score)


def check_source_in_response(response: str, expected_source: str) -> bool:
    """Check if the response mentions the expected source."""
    response_lower = response.lower()

    # Map source types to terms that might appear in responses
    source_terms = {
        "s3": ["s3://", "s3", "bucket", "company-docs", "engineering-docs"],
        "google_drive": ["google drive", "drive", "docs.google"],
        "notion": ["notion", "wiki", "page"],
        "slack": ["slack", "#", "channel", "thread"],
    }

    terms = source_terms.get(expected_source, [expected_source])
    return any(term.lower() in response_lower for term in terms)


def check_path_in_response(response: str, expected_path: str) -> bool:
    """Check if the response mentions the expected path."""
    if not expected_path:
        return True

    response_lower = response.lower()
    path_lower = expected_path.lower()

    # Check for exact path
    if path_lower in response_lower:
        return True

    # Check for path without s3:// prefix
    if path_lower.startswith("s3://"):
        path_no_prefix = path_lower[5:]
        if path_no_prefix in response_lower:
            return True

    # Check for filename
    filename = expected_path.split("/")[-1].lower()
    if filename in response_lower:
        return True

    # Check for filename without extension
    filename_no_ext = filename.rsplit(".", 1)[0]
    if filename_no_ext in response_lower:
        return True

    return False
