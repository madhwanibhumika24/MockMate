"""Embedding model setup for the RAG pipeline."""

from functools import lru_cache

from langchain_openai import OpenAIEmbeddings

from app.core.config import get_settings


@lru_cache
def get_embeddings() -> OpenAIEmbeddings:
    """Returns a LangChain-compatible embeddings client.

    OpenAI is the only provider wired up for now (matches OPENAI_API_KEY in
    .env). Swap this out if a different embeddings provider is needed later --
    everything downstream (vector_store, retriever) only depends on this
    function's return type (a LangChain Embeddings instance), not on OpenAI
    specifically.
    """
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Add it to backend/.env before using the RAG pipeline."
        )
    return OpenAIEmbeddings(api_key=settings.openai_api_key)
