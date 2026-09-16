"""Interview question generation and session flow logic."""

from functools import lru_cache
from typing import List, Optional, Tuple

from langchain_openai import ChatOpenAI

from app.core.config import get_settings

QUESTION_SYSTEM_PROMPT = """\
You are an experienced interviewer conducting a mock interview for the role \
of {role}. Ask exactly ONE interview question at a time -- no preamble, no \
numbering, no "Question 1:" labels, just the question itself.

Tailor the question to the role, the job description (if provided), and the \
candidate's resume (if provided). Mix behavioral and role-specific technical \
questions. Do not repeat or closely rephrase a question that's already been \
asked in this session (see the transcript below).

Job description:
{job_description}

Candidate resume:
{resume_text}
"""


@lru_cache
def _get_llm(temperature: float = 0.7) -> ChatOpenAI:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Add it to backend/.env to generate interview questions."
        )
    return ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=temperature)


def generate_question(
    role: str,
    job_description: Optional[str],
    resume_text: Optional[str],
    previous_qa: Optional[List[Tuple[str, str]]] = None,
) -> str:
    """Generates the next interview question.

    `previous_qa` is the session's [(question, answer), ...] history so far,
    used only to avoid repeating questions -- for the first question, pass
    None/empty.

    TODO once the vector store is set up (currently deferred, see
    requirements.txt): ground this in retrieved reference material via
    app.rag.retriever instead of relying on the model alone.
    """
    llm = _get_llm()

    system_prompt = QUESTION_SYSTEM_PROMPT.format(
        role=role,
        job_description=job_description or "(not provided)",
        resume_text=resume_text or "(not provided)",
    )

    transcript = "(none yet -- this is the first question)"
    if previous_qa:
        transcript = "\n\n".join(f"Q: {q}\nA: {a}" for q, a in previous_qa)

    messages = [
        ("system", system_prompt),
        ("human", f"Questions and answers so far:\n{transcript}\n\nAsk the next question."),
    ]

    response = llm.invoke(messages)
    return response.content.strip()
