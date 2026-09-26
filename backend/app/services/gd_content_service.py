"""AI-generated preparation content for a Group Discussion topic.

Feature 2 of the Group Discussion module: once a candidate picks a topic
from the curated bank (see group_discussion_service.py), this generates a
research brief for it -- quick facts, an introduction, points in favor,
points against, and a closing line -- plus a fixed reference sheet of GD
speaking phrases, so the candidate has real, spoken-ready content to
prepare with. Stateless and one-shot, same pattern as Ask AI: no session is
created, nothing is persisted, and calling it again regenerates fresh
content rather than returning a cached copy.
"""

import json
from functools import lru_cache
from typing import List

from google import genai

from app.core.config import get_settings

MIN_POINTS = 4
MAX_POINTS = 5
MIN_FACTS = 2
MAX_FACTS = 3

GD_BRIEF_SYSTEM_PROMPT = f"""\
You help a candidate prepare to speak confidently in a Group Discussion (GD) \
round on a given topic. You will be given the topic's title and its framing \
prompt. Produce clear, well-organized preparation content, written the way \
someone would actually say it out loud -- short, plain, confident spoken \
sentences, no jargon.

Never fabricate specific statistics, studies, dates, or named sources -- \
quick facts and examples should be general, illustrative, and honest (a \
common real-world scenario or a widely-known general fact), not invented \
data or numbers.

Each point must stand on its own as a complete, natural spoken sentence --\
 never start a point with a sequencing word like "First," "Second," \
"Third," "Also," or "Finally," since these will already be shown as a \
numbered list. Vary the sentence openings across points instead of \
repeating a pattern.

Respond with ONLY a JSON object (no markdown fences, no commentary) with \
exactly these keys:
- "intro": a short 2-3 sentence spoken introduction that frames the topic \
  and why it matters -- the kind of opening line that starts the discussion.
- "quick_facts": a list of {MIN_FACTS}-{MAX_FACTS} short, general, \
  well-known context points worth mentioning early (no invented statistics).
- "points_for": a list of {MIN_POINTS}-{MAX_POINTS} objects, each with \
  "point" (one clear, confident spoken sentence arguing IN FAVOR) and \
  "example" (one brief, concrete, honest illustration backing that point).
- "points_against": a list of {MIN_POINTS}-{MAX_POINTS} objects, same shape \
  ("point", "example"), each a clear counterpoint / argument AGAINST.
- "conclusion": a short 1-2 sentence balanced closing statement the \
  candidate could use to wrap up their contribution.
"""

# A fixed reference sheet of GD speaking phrases -- useful for every topic
# equally, so this is static content rather than something regenerated (and
# possibly reworded inconsistently) by the model on every call.
KEY_PHRASES = [
    {
        "category": "To open",
        "phrases": [
            "I'd like to start by saying...",
            "Let's look at this from two sides.",
            "To kick things off, I think...",
        ],
    },
    {
        "category": "To agree and build on a point",
        "phrases": [
            "I agree with that, and I'd add that...",
            "Building on what was just said...",
            "That's a fair point -- it also connects to...",
        ],
    },
    {
        "category": "To disagree respectfully",
        "phrases": [
            "I see it a bit differently, because...",
            "That's true in some cases, but on the other hand...",
            "I'd push back slightly on that -- consider...",
        ],
    },
    {
        "category": "To conclude",
        "phrases": [
            "To bring this together...",
            "Weighing both sides, I'd say...",
            "So, in summary...",
        ],
    },
]


@lru_cache
def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to research a topic."
        )
    return genai.Client(api_key=settings.google_api_key)


def _clean_points(raw) -> List[dict]:
    points = []
    for item in raw or []:
        if not isinstance(item, dict):
            continue
        point = str(item.get("point") or "").strip()
        if not point:
            continue
        example = str(item.get("example") or "").strip()
        points.append({"point": point, "example": example})
    return points[:MAX_POINTS]


def _clean_facts(raw) -> List[str]:
    facts = [str(item).strip() for item in (raw or []) if str(item or "").strip()]
    return facts[:MAX_FACTS]


def generate_topic_brief(topic_title: str, topic_prompt: str) -> dict:
    """Generates a research brief for one GD topic.

    Returns {"intro", "quick_facts", "points_for", "points_against",
    "conclusion", "key_phrases"}. Raises RuntimeError on any failure (missing
    API key, model/network error, an unparseable response, or a response
    missing real content) -- there's no cached fallback to degrade to, so the
    caller should surface the error and let the candidate retry.
    """
    client = _get_client()
    settings = get_settings()

    user_input = f"GD Topic: {topic_title}\nFraming: {topic_prompt}"

    try:
        interaction = client.interactions.create(
            model=settings.gemini_model,
            system_instruction=GD_BRIEF_SYSTEM_PROMPT,
            input=user_input,
            generation_config={"temperature": 0.6},
            response_format={"mime_type": "application/json"},
        )
        data = json.loads(interaction.output_text.strip())
    except Exception as exc:
        raise RuntimeError("Couldn't research this topic right now. Please try again.") from exc

    intro = str(data.get("intro") or "").strip()
    quick_facts = _clean_facts(data.get("quick_facts"))
    points_for = _clean_points(data.get("points_for"))
    points_against = _clean_points(data.get("points_against"))
    conclusion = str(data.get("conclusion") or "").strip()

    if not intro or len(points_for) < MIN_POINTS or len(points_against) < MIN_POINTS:
        raise RuntimeError("Couldn't research this topic right now. Please try again.")

    return {
        "intro": intro,
        "quick_facts": quick_facts,
        "points_for": points_for,
        "points_against": points_against,
        "conclusion": conclusion,
        "key_phrases": KEY_PHRASES,
    }
