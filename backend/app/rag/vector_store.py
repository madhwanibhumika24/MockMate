"""A minimal, dependency-free vector store for the RAG pipeline.

The original plan (Chroma) needs a C++ compiler to build on this machine, so
this stands in for it: reference chunks and their embeddings are kept as
plain JSON on disk, and similarity search is one cosine-similarity pass over
plain Python lists (no numpy). The knowledge base behind this is a few dozen
short reference chunks -- this scales comfortably to a few thousand chunks
before a real vector DB would start to matter.
"""

import json
import math
import os
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Callable, Dict, List, Optional, Tuple

from app.core.config import get_settings

INDEX_FILENAME = "index.json"


@dataclass
class Chunk:
    id: str
    text: str
    embedding: List[float]
    metadata: Dict[str, str] = field(default_factory=dict)


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class SimpleVectorStore:
    """In-memory chunk store, persisted to a single JSON file on disk."""

    def __init__(self, path: str):
        self._path = path
        self._chunks: List[Chunk] = []

    @property
    def is_empty(self) -> bool:
        return len(self._chunks) == 0

    def load(self) -> "SimpleVectorStore":
        if os.path.exists(self._path):
            with open(self._path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self._chunks = [Chunk(**item) for item in raw]
        return self

    def save(self) -> None:
        os.makedirs(os.path.dirname(self._path), exist_ok=True)
        with open(self._path, "w", encoding="utf-8") as f:
            json.dump([chunk.__dict__ for chunk in self._chunks], f)

    def rebuild(self, chunks: List[Chunk]) -> None:
        """Replaces the store's entire contents (used by build_index.py)."""
        self._chunks = chunks
        self.save()

    def similarity_search(
        self,
        query_embedding: List[float],
        k: int = 4,
        filter_fn: Optional[Callable[[Chunk], bool]] = None,
    ) -> List[Tuple[Chunk, float]]:
        """Returns the top-k most similar chunks, optionally restricted to
        chunks matching `filter_fn` first (e.g. only chunks from a specific
        knowledge-base file) -- useful when a feature's reference material
        must never bleed in content from an unrelated part of the knowledge
        base. `filter_fn=None` (the default) searches every chunk, unchanged
        from before this was added."""
        candidates = self._chunks if filter_fn is None else [chunk for chunk in self._chunks if filter_fn(chunk)]
        scored = [(chunk, _cosine_similarity(query_embedding, chunk.embedding)) for chunk in candidates]
        scored.sort(key=lambda pair: pair[1], reverse=True)
        return scored[:k]


@lru_cache
def get_vector_store() -> SimpleVectorStore:
    """Returns the vector store, loaded once per process from disk.

    Cached for the life of the process -- if build_index.py rebuilds the
    index while the API server is running, restart the server to pick up
    the new content.
    """
    settings = get_settings()
    path = os.path.join(settings.vector_store_path, INDEX_FILENAME)
    return SimpleVectorStore(path).load()
