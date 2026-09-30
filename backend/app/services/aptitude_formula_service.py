"""Quick-reference formula sheets for aptitude topics.

Feature 2 of the Assessments module. For the 15 curated topics (see
aptitude_service.py), this is grounded by real retrieval: get_formula_sheet
pulls a hand-written reference chunk -- key formulas/rules plus one worked
example -- out of the aptitude knowledge base (see
app/rag/knowledge_base/aptitude_*.md) via the RAG pipeline built earlier in
this app (Gemini embeddings + a small JSON vector store), which until now
nothing actually used. No LLM call in that path -- retrieval only, so
there's nothing to hallucinate, and the retrieval is restricted to just the
aptitude knowledge-base files (see APTITUDE_SOURCES) so it can never
surface an unrelated chunk from the DSA/system-design/behavioral knowledge
base that also lives in that directory.

A candidate can also ask for a formula sheet on any topic they type into
"Ask AI" -- something outside the curated 15 with no matching knowledge-base
entry. There's no reference content to retrieve for that, so
generate_ai_formula_sheet falls back to asking Gemini to write one directly,
the same way the "Ask AI" quiz already does. That path is explicitly marked
"ai_generated" in the response (see AptitudeFormulaSheetResponse.source) so
the frontend can label it as unverified, distinct from the curated,
retrieval-grounded sheets.
"""

import json
from functools import lru_cache
from typing import Optional

from google import genai

from app.core.config import get_settings
from app.rag.retriever import retrieve

APTITUDE_SOURCES = [
    "aptitude_quantitative.md",
    "aptitude_logical_reasoning.md",
    "aptitude_verbal_ability.md",
]

MIN_FORMULAS = 3
MAX_FORMULAS = 8

AI_FORMULA_SHEET_SYSTEM_PROMPT = f"""\
You write a short "quick reference" formula sheet for a candidate about to \
practice an aptitude topic (the kind of topic used in placement tests: \
quantitative aptitude, logical reasoning, or verbal ability).

Respond with ONLY a JSON object (no markdown fences, no commentary) with \
exactly these keys:
- "formulas": a list of {MIN_FORMULAS}-{MAX_FORMULAS} short, accurate \
  formulas, rules, or techniques for this exact topic. Each item is one \
  self-contained line of plain text (no markdown, no LaTeX).
- "example": one short worked example applying the topic, with the \
  reasoning and final answer shown, as plain text.

If the given text is not a genuine aptitude/reasoning/verbal topic, do your \
best to still produce a short, honest, accurate reference for it rather \
than refusing.
"""


@lru_cache
def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to generate a formula sheet."
        )
    return genai.Client(api_key=settings.google_api_key)


def get_formula_sheet(topic_title: str) -> Optional[dict]:
    """Looks up the curated, retrieval-grounded formula sheet for one of
    the 15 curated aptitude topics.

    Returns {"topic_title", "formulas": [...], "example": "...",
    "source": "verified"}, or None if the knowledge base hasn't been built
    yet (see app/rag/build_index.py) or has no matching content for this
    topic -- callers should treat None as "not available" rather than an
    error.
    """
    results = retrieve(topic_title, k=1, sources=APTITUDE_SOURCES)
    if not results:
        return None

    text = results[0]["text"]
    # build_index.py prefixes every chunk with a "{file title} -- {heading}"
    # line for embedding context; drop it here since the caller already
    # knows the topic.
    body = text.split("\n", 1)[1] if "\n" in text else text

    if "Worked example:" in body:
        formulas_text, example_text = body.split("Worked example:", 1)
    else:
        formulas_text, example_text = body, ""

    formulas = [line.strip() for line in formulas_text.strip().splitlines() if line.strip()]
    example = example_text.strip()

    if not formulas:
        return None

    return {"topic_title": topic_title, "formulas": formulas, "example": example, "source": "verified"}


def generate_ai_formula_sheet(topic_title: str) -> dict:
    """Generates a formula sheet with Gemini for a topic outside the
    curated 15 -- used for "Ask AI" custom topics, which have no matching
    knowledge-base entry to retrieve. Unlike get_formula_sheet above, this
    is a real generation call and can occasionally get a detail wrong, so
    the result is marked "source": "ai_generated" rather than "verified".
    Raises RuntimeError on failure (missing API key, model/network error,
    an unparseable response, or too few formulas to be useful)."""
    client = _get_client()
    settings = get_settings()

    try:
        interaction = client.interactions.create(
            model=settings.gemini_model,
            system_instruction=AI_FORMULA_SHEET_SYSTEM_PROMPT,
            input=f"Topic: {topic_title}",
            generation_config={"temperature": 0.4},
            response_format={"mime_type": "application/json"},
        )
        data = json.loads(interaction.output_text.strip())
    except Exception as exc:
        raise RuntimeError("Couldn't generate a formula sheet right now. Please try again.") from exc

    formulas = [str(item).strip() for item in (data.get("formulas") or []) if str(item or "").strip()]
    example = str(data.get("example") or "").strip()

    if len(formulas) < MIN_FORMULAS:
        raise RuntimeError("Couldn't generate a formula sheet right now. Please try again.")

    return {"topic_title": topic_title, "formulas": formulas[:MAX_FORMULAS], "example": example, "source": "ai_generated"}
