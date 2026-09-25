"""Vector store setup (Chroma, embedded/local -- no separate server to run)."""

import os
from functools import lru_cache

from langchain_chroma import Chroma

from app.core.config import get_settings
from app.rag.embeddings import get_embeddings


@lru_cache
def get_vector_store() -> Chroma:
    """Returns the Chroma vector store, persisted under settings.vector_store_path.

    Chroma runs in-process and writes straight to that folder on disk --
    nothing to install or start separately. Swappable later via
    VECTOR_STORE_BACKEND if a different backend (e.g. a hosted vector DB)
    is ever needed; callers should only depend on this function returning a
    LangChain VectorStore, not on Chroma specifically.
    """
    settings = get_settings()
    os.makedirs(settings.vector_store_path, exist_ok=True)
    return Chroma(
        collection_name="mockmate_reference",
        embedding_function=get_embeddings(),
        persist_directory=settings.vector_store_path,
    )
