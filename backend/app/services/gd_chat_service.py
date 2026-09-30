""""Discuss with AI" -- free-form follow-up chat about a Group Discussion topic.

Feature 4 of the Group Discussion module: once a candidate has read a
topic's research brief (see gd_content_service.py), they can keep exploring
it in a back-and-forth chat -- asking for a stronger counterpoint, a real
example, clarification on a point, etc. Like the brief itself, this is
stateless on the backend: nothing is persisted in the database, and the
frontend is responsible for holding and resending the conversation history
with each new message (the same way a full interview session's transcript
is replayed into each question-generation call -- see interview_service.py
-- just not saved to a table here, since this is a lighter-weight,
throwaway-after-the-page-closes conversation).
"""

from functools import lru_cache
from typing import List

from google import genai

from app.core.config import get_settings

# Caps how much prior conversation gets replayed into the prompt each turn --
# keeps the request small and the model focused on the recent exchange
# rather than the whole history verbatim.
MAX_HISTORY_TURNS = 12
MAX_MESSAGE_LENGTH = 800

GD_CHAT_SYSTEM_PROMPT = """\
You are helping a candidate go deeper on a Group Discussion (GD) topic they \
are preparing for, through a natural back-and-forth chat. They have already \
been shown an introduction, points for and against, and a conclusion for \
this topic -- this conversation is for follow-up questions, digging into a \
specific point, asking for a stronger counterpoint or a real example, or \
challenging an argument.

Topic: {topic_title}
{framing_line}

Answer clearly and concisely, in plain spoken language the candidate could \
actually use out loud in a discussion -- a few sentences at most unless they \
clearly ask for more detail. Stay focused on this topic and their GD \
preparation; if they ask something unrelated, briefly redirect back to the \
topic. Never fabricate specific statistics, studies, or named sources -- \
keep any facts general, honest, and well-known.
"""


@lru_cache
def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to discuss a topic."
        )
    return genai.Client(api_key=settings.google_api_key)


def discuss_topic(topic_title: str, topic_prompt: str, message: str, history: List[dict]) -> str:
    """Generates the AI's next reply in a topic-discussion chat.

    `history` is a list of {"role": "user" | "ai", "content": str} turns, in
    order, from earliest to most recent (not including `message` itself).
    Raises RuntimeError on any failure (missing API key, model/network error,
    or an empty reply) -- there's no fallback reply to degrade to.
    """
    client = _get_client()
    settings = get_settings()

    framing_line = f"Framing: {topic_prompt}" if topic_prompt else ""
    system_prompt = GD_CHAT_SYSTEM_PROMPT.format(topic_title=topic_title, framing_line=framing_line)

    convo_lines = []
    for turn in history[-MAX_HISTORY_TURNS:]:
        speaker = "Candidate" if turn.get("role") == "user" else "You"
        content = str(turn.get("content") or "").strip()
        if content:
            convo_lines.append(f"{speaker}: {content}")
    convo_lines.append(f"Candidate: {message.strip()}")
    convo_text = "\n".join(convo_lines)

    try:
        interaction = client.interactions.create(
            model=settings.gemini_model,
            system_instruction=system_prompt,
            input=convo_text,
            generation_config={"temperature": 0.6},
        )
        reply = (interaction.output_text or "").strip()
    except Exception as exc:
        raise RuntimeError("Couldn't get a response right now. Please try again.") from exc

    if not reply:
        raise RuntimeError("Couldn't get a response right now. Please try again.")

    return reply
