"""Embedding model setup for the RAG pipeline."""

from app.core.config import get_settings


def get_embeddings():
    """Returns a LangChain-compatible embeddings client.

    TODO: implement provider selection (e.g. OpenAIEmbeddings) based on settings.
    """
    settings = get_settings()
    raise NotImplementedError("Configure an embeddings provider here.")
