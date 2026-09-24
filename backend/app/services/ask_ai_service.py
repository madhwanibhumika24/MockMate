"""Ask-AI: turns a free-text practice request ("give me 5 hard Python OOP
questions") into a structured, tailored set of practice questions.

Unlike a full mock interview session, this is stateless and one-shot: no
session is created, no answers are collected, and no feedback/score is
produced -- it's a quick way to get a tailored question set to look over or
practice against on your own.
"""

import json
from functools import lru_cache
from typing import Optional

from google import genai

from app.core.config import get_settings

DIFFICULTY_LEVELS = ("easy", "medium", "hard")
QUESTION_TYPES = ("conceptual", "coding", "scenario", "behavioral", "mixed")
MIN_COUNT = 3
MAX_COUNT = 10
DEFAULT_COUNT = 5

ASK_AI_SYSTEM_PROMPT = f"""\
You turn a candidate's free-text interview-practice request into a \
structured practice question set.

The candidate describes, in their own words, what they want to practice -- \
a topic, a role, a difficulty, a type of question, how many they want. \
Infer reasonable defaults for anything they didn't specify:
- "difficulty": one of {list(DIFFICULTY_LEVELS)} (default "medium")
- "question_type": one of {list(QUESTION_TYPES)} -- pick whichever best \
  matches the request (default "mixed")
- "count": an integer between {MIN_COUNT} and {MAX_COUNT} (default \
  {DEFAULT_COUNT}) -- use their stated number if given and in range, \
  otherwise clamp to that range
- "topic": the specific language/technology/subject mentioned, or null if \
  genuinely not specified
- "role": the job role/field mentioned, or null if genuinely not specified

Then generate exactly "count" distinct, high-quality practice questions \
matching what you inferred. Do not repeat or closely rephrase any question. \
These are AI-generated practice questions -- never present them as real \
questions from a specific company's actual past interview.

If the request is too vague to work with at all (e.g. empty, gibberish, or \
entirely unrelated to interview practice), still do your best to produce a \
reasonable general practice set rather than refusing.

Respond with ONLY a JSON object (no markdown fences, no commentary) with \
exactly these keys:
- "interpreted": an object with "topic", "role", "difficulty", \
  "question_type", "count", and "summary" (a short one-sentence \
  plain-language paraphrase of what you understood, e.g. "5 medium-difficulty \
  conceptual Python questions")
- "questions": a list of exactly "count" strings, each one practice question
"""


@lru_cache
def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to use Ask AI."
        )
    return genai.Client(api_key=settings.google_api_key)


def _clamp_count(value) -> int:
    try:
        value = int(value)
    except (TypeError, ValueError):
        return DEFAULT_COUNT
    return max(MIN_COUNT, min(MAX_COUNT, value))


def generate_practice_set(prompt: str) -> dict:
    """Generates a tailored practice question set from a free-text request.

    Returns a dict shaped like app.models.schemas.AskAIResponse:
    {"interpreted": {...}, "questions": [...]}.

    Raises RuntimeError if generation fails (missing API key, model/network
    error, or an unparseable response) -- unlike resume analysis, this is the
    entire point of the endpoint, so failures surface to the caller instead
    of silently degrading.
    """
    client = _get_client()
    settings = get_settings()

    try:
        interaction = client.interactions.create(
            model=settings.gemini_model,
            system_instruction=ASK_AI_SYSTEM_PROMPT,
            input=prompt,
            generation_config={"temperature": 0.6},
            response_format={"mime_type": "application/json"},
        )
        data = json.loads(interaction.output_text.strip())
    except json.JSONDecodeError as exc:
        raise RuntimeError("Couldn't generate practice questions right now. Please try again.") from exc
    except Exception as exc:
        raise RuntimeError("Couldn't generate practice questions right now. Please try again.") from exc

    raw_interpreted = data.get("interpreted") or {}
    questions = [q for q in (data.get("questions") or []) if isinstance(q, str) and q.strip()]

    difficulty = raw_interpreted.get("difficulty")
    difficulty = difficulty if difficulty in DIFFICULTY_LEVELS else "medium"

    question_type = raw_interpreted.get("question_type")
    question_type = question_type if question_type in QUESTION_TYPES else "mixed"

    interpreted = {
        "topic": raw_interpreted.get("topic") or None,
        "role": raw_interpreted.get("role") or None,
        "difficulty": difficulty,
        "question_type": question_type,
        "count": len(questions) or _clamp_count(raw_interpreted.get("count")),
        "summary": raw_interpreted.get("summary") or "Practice questions based on your request.",
    }

    if not questions:
        raise RuntimeError("Couldn't generate practice questions right now. Please try again.")

    return {"interpreted": interpreted, "questions": questions}
