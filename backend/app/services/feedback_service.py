"""Feedback generation grounded in the interview transcript."""

import json
from functools import lru_cache
from typing import List, Optional, Tuple

from google import genai

from app.core.config import get_settings

FEEDBACK_SYSTEM_PROMPT = """\
You are an expert interview coach reviewing a completed mock interview for \
the role of {role}. You will be given the full list of questions and answers.

Respond with ONLY a JSON object (no markdown fences, no commentary) with \
exactly these keys:
- "summary": a short (2-4 sentence) overall assessment
- "strengths": a list of specific strings, each citing something concrete \
  the candidate did well (quote or reference their actual answers)
- "improvements": a list of specific, actionable strings on what to improve
- "score": an overall score from 0-100 (integer)

Job description:
{job_description}
"""


@lru_cache
def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to generate feedback."
        )
    return genai.Client(api_key=settings.google_api_key)


def generate_feedback(role: str, job_description: Optional[str], qa_pairs: List[Tuple[str, str]]) -> dict:
    """Generates structured feedback for a completed interview session.

    `qa_pairs` is the full [(question, answer), ...] transcript. Returns a
    dict shaped like app.models.schemas.FeedbackResponse's fields
    (summary/strengths/improvements/score), ready to save into the
    `feedback` table.

    TODO once the vector store is set up (currently deferred, see
    requirements.txt): ground critiques in retrieved reference material via
    app.rag.retriever instead of relying on the model alone.
    """
    if not qa_pairs:
        raise ValueError("Cannot generate feedback for a session with no answered questions")

    client = _get_client()
    settings = get_settings()

    system_prompt = FEEDBACK_SYSTEM_PROMPT.format(
        role=role,
        job_description=job_description or "(not provided)",
    )
    transcript = "\n\n".join(f"Q: {q}\nA: {a}" for q, a in qa_pairs)

    interaction = client.interactions.create(
        model=settings.gemini_model,
        system_instruction=system_prompt,
        input=transcript,
        generation_config={"temperature": 0.3},
        response_format={"mime_type": "application/json"},
    )
    content = interaction.output_text.strip()

    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"LLM did not return valid JSON feedback:\n{content}") from exc

    return {
        "summary": data.get("summary", ""),
        "strengths": data.get("strengths", []) or [],
        "improvements": data.get("improvements", []) or [],
        "score": data.get("score"),
    }
