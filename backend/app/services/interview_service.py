"""Interview question generation and session flow logic."""

from typing import Optional


def generate_question(role: str, job_description: Optional[str], resume_text: Optional[str]) -> str:
    """Generates the next interview question using the LLM + RAG context.

    TODO: implement using app.rag.retriever and an LLM chain.
    """
    raise NotImplementedError
