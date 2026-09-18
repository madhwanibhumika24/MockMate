"""Interview question generation and session flow logic."""

from functools import lru_cache
from typing import List, Optional, Tuple

from google import genai

from app.core.config import get_settings

# Fixed stage structure every session follows, one stage per question slot.
# Index 0 is always the first question asked (previous_qa is empty), index 1
# is the second, and so on -- see generate_question()'s stage_index below.
# Kept in sync with MAX_QUESTIONS_PER_SESSION in app/api/routes/interview.py:
# if that changes, extend/trim this list (the last stage repeats for any
# extra questions beyond what's listed here).
SESSION_STAGES = ["introduction", "resume_walkthrough", "fundamentals", "oop_concepts", "problem_solving"]

STAGE_GUIDANCE = {
    "introduction": (
        "This is the opening icebreaker question. Ask the candidate to introduce "
        "themselves and briefly walk through their background and how they got "
        "to where they are now."
    ),
    "resume_walkthrough": (
        "Ask a specific question about one concrete thing from the candidate's "
        "resume (a project, role, or achievement) and have them elaborate on "
        "it in more depth. If no resume was provided, instead ask them to walk "
        "through the experience or project they're most proud of for this role."
    ),
    "fundamentals": (
        "Ask a core language/technology fundamentals question relevant to the "
        "role -- something a solid practitioner in this field should know cold."
    ),
    "oop_concepts": (
        "Ask an object-oriented programming concepts question (e.g. "
        "inheritance, polymorphism, encapsulation, abstraction, or a SOLID "
        "principle) as it applies to the candidate's stated skills. If the "
        "role clearly isn't a programming role, ask a core theoretical or "
        "conceptual question central to that field instead."
    ),
    "problem_solving": (
        "Ask a practical problem-solving or scenario-based question relevant "
        "to the role, calibrated to the difficulty level below."
    ),
}

DIFFICULTY_GUIDANCE = {
    "easy": (
        "Keep this question approachable -- foundational concepts, clear "
        "wording, suitable for someone early in their learning."
    ),
    "medium": "Keep this question at a solid mid-level bar -- the kind a working practitioner should handle.",
    "hard": (
        "Make this question genuinely challenging -- edge cases, deeper "
        "trade-offs, or multi-part reasoning, suitable for a senior candidate."
    ),
}

QUESTION_SYSTEM_PROMPT = """\
You are an experienced interviewer conducting a mock interview for the role \
of {role}. Ask exactly ONE interview question at a time -- no preamble, no \
numbering, no "Question 1:" labels, just the question itself.

Tailor the question to the role, the job description (if provided), and the \
candidate's resume (if provided). Do not repeat or closely rephrase a \
question that's already been asked in this session (see the transcript \
below).

For this question specifically: {stage_guidance}

Difficulty level -- {difficulty}: {difficulty_guidance}

Job description:
{job_description}

Candidate resume:
{resume_text}
"""


@lru_cache
def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to generate interview questions."
        )
    return genai.Client(api_key=settings.google_api_key)


def generate_question(
    role: str,
    job_description: Optional[str],
    resume_text: Optional[str],
    previous_qa: Optional[List[Tuple[str, str]]] = None,
    difficulty: str = "medium",
) -> str:
    """Generates the next interview question.

    `previous_qa` is the session's [(question, answer), ...] history so far --
    its length also doubles as the stage index (0 for the first question, 1
    for the second, ...), so the session always follows the fixed
    introduction -> resume walkthrough -> fundamentals -> OOP -> problem
    solving structure regardless of role.

    TODO once the vector store is set up (currently deferred, see
    requirements.txt): ground this in retrieved reference material via
    app.rag.retriever instead of relying on the model alone.
    """
    client = _get_client()
    settings = get_settings()

    stage_index = len(previous_qa) if previous_qa else 0
    stage = SESSION_STAGES[min(stage_index, len(SESSION_STAGES) - 1)]
    difficulty = difficulty if difficulty in DIFFICULTY_GUIDANCE else "medium"

    system_prompt = QUESTION_SYSTEM_PROMPT.format(
        role=role,
        stage_guidance=STAGE_GUIDANCE[stage],
        difficulty=difficulty,
        difficulty_guidance=DIFFICULTY_GUIDANCE[difficulty],
        job_description=job_description or "(not provided)",
        resume_text=resume_text or "(not provided)",
    )

    transcript = "(none yet -- this is the first question)"
    if previous_qa:
        transcript = "\n\n".join(f"Q: {q}\nA: {a}" for q, a in previous_qa)

    interaction = client.interactions.create(
        model=settings.gemini_model,
        system_instruction=system_prompt,
        input=f"Questions and answers so far:\n{transcript}\n\nAsk the next question.",
        generation_config={"temperature": 0.7},
    )
    return interaction.output_text.strip()
