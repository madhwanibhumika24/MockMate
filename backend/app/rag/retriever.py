"""Retriever that pulls relevant reference material for question generation and feedback."""

from typing import Dict, List, Optional

from app.rag.embeddings import embed_query
from app.rag.vector_store import get_vector_store


def retrieve(query: str, k: int = 4, sources: Optional[List[str]] = None) -> List[Dict[str, str]]:
    """Returns up to `k` reference chunks most relevant to `query`.

    `sources`, if given, restricts the search to chunks from those knowledge
    -base filenames only (see app/rag/build_index.py's `source` metadata) --
    e.g. a feature grounded in one specific corner of the knowledge base
    shouldn't ever surface a chunk from an unrelated file just because it
    scored higher by coincidence. Leave it None to search everything, same
    as before this parameter existed.

    Each result is {"text": ..., "topic": ..., "source": ...}. Returns an
    empty list if the knowledge base hasn't been built yet (see
    app/rag/build_index.py) -- callers should treat an empty result as "no
    grounding available" and fall back to plain generation rather than
    erroring.
    """
    store = get_vector_store()
    if store.is_empty:
        return []
    query_embedding = embed_query(query)
    filter_fn = (lambda chunk: chunk.metadata.get("source") in sources) if sources else None
    results = store.similarity_search(query_embedding, k=k, filter_fn=filter_fn)
    return [
        {
            "text": chunk.text,
            "topic": chunk.metadata.get("topic", ""),
            "source": chunk.metadata.get("source", ""),
        }
        for chunk, _score in results
    ]
