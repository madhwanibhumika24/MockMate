"""Vector store setup (Chroma by default) for reference-material embeddings."""

from app.core.config import get_settings


def get_vector_store():
    """Returns a LangChain-compatible vector store client.

    TODO: implement Chroma (or configured backend) initialization using settings.vector_store_path.
    """
    settings = get_settings()
    raise NotImplementedError("Initialize the vector store here.")
