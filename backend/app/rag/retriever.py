"""Retriever that pulls relevant reference material for question generation and feedback."""

from langchain_core.vectorstores import VectorStoreRetriever

from app.rag.vector_store import get_vector_store


def get_retriever(k: int = 4) -> VectorStoreRetriever:
    """Returns a retriever built on top of the vector store.

    `k` is the number of reference chunks pulled per query -- 4 is a
    reasonable default for grounding a single question/feedback generation
    call without flooding the LLM prompt; tune per call site if needed.
    """
    return get_vector_store().as_retriever(search_kwargs={"k": k})
