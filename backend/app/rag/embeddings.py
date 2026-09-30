"""Embedding model setup for the RAG pipeline.

Uses Gemini's embedding model directly through the same google-genai SDK
that already powers interview question generation and feedback (see
app/services/interview_service.py) -- no new dependency to install, and no
separate API key (reuses GOOGLE_API_KEY).
"""

from functools import lru_cache
from typing import List

from google import genai
from google.genai import types

from app.core.config import get_settings

EMBEDDING_MODEL = "gemini-embedding-001"

# Gemini's embedding model is trained to produce different vectors depending
# on what the text will be used for. A reference chunk that will be
# *searched* is embedded with RETRIEVAL_DOCUMENT; the *search query* itself
# is embedded with RETRIEVAL_QUERY. Using the matching task type meaningfully
# improves how well the right chunk gets found.
_TASK_TYPE_DOCUMENT = "RETRIEVAL_DOCUMENT"
_TASK_TYPE_QUERY = "RETRIEVAL_QUERY"

# Gemini's embed_content endpoint caps how many texts it takes in a single
# call, so build_index.py's batch of knowledge-base chunks is embedded in
# slices rather than all at once.
_BATCH_SIZE = 50


@lru_cache
def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add it to backend/.env to use the RAG pipeline."
        )
    return genai.Client(api_key=settings.google_api_key)


def _embed(texts: List[str], task_type: str) -> List[List[float]]:
    if not texts:
        return []
    client = _get_client()
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(task_type=task_type),
    )
    return [embedding.values for embedding in response.embeddings]


def embed_documents(texts: List[str]) -> List[List[float]]:
    """Embeds a batch of reference chunks for storing in the vector store."""
    results: List[List[float]] = []
    for start in range(0, len(texts), _BATCH_SIZE):
        results.extend(_embed(texts[start:start + _BATCH_SIZE], _TASK_TYPE_DOCUMENT))
    return results


def embed_query(text: str) -> List[float]:
    """Embeds a single search query for looking chunks up in the vector store."""
    return _embed([text], _TASK_TYPE_QUERY)[0]
