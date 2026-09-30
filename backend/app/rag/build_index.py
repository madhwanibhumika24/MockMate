"""Builds (or rebuilds) the RAG vector store from the curated knowledge base.

Run this manually whenever backend/app/rag/knowledge_base/*.md changes:

    cd backend
    venv\\Scripts\\activate
    python -m app.rag.build_index

It reads every markdown file in knowledge_base/, splits each one into
sections on "## " headings, embeds each section with Gemini, and writes the
result to settings.vector_store_path as a single JSON file. The running API
server caches the vector store in memory for the life of the process (see
vector_store.get_vector_store), so restart the server after rebuilding for
new content to take effect.
"""

import glob
import os
import re
from typing import List, Tuple

from app.core.config import get_settings
from app.rag.embeddings import embed_documents
from app.rag.vector_store import Chunk, INDEX_FILENAME, SimpleVectorStore

KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(__file__), "knowledge_base")


def _split_into_sections(markdown_text: str, fallback_title: str) -> List[Tuple[str, str]]:
    """Splits one markdown file into (heading, text) sections on '## ' headings.

    The file's top-level '# Title' (if present) is prefixed onto every
    section's text, so a section still says what broader topic it belongs to
    once it's pulled out of the file and shown on its own inside a prompt.
    """
    lines = markdown_text.strip().splitlines()
    has_title = bool(lines) and lines[0].startswith("# ")
    title = lines[0][2:].strip() if has_title else fallback_title
    body = "\n".join(lines[1:]) if has_title else markdown_text

    raw_sections = re.split(r"\n(?=## )", body.strip())
    sections: List[Tuple[str, str]] = []
    for raw in raw_sections:
        raw = raw.strip()
        if not raw:
            continue
        heading_match = re.match(r"^##\s+(.+)", raw)
        heading = heading_match.group(1).strip() if heading_match else title
        text = re.sub(r"^##\s+.+\n?", "", raw).strip()
        if not text:
            continue
        sections.append((heading, f"{title} -- {heading}\n{text}"))
    return sections


def build_index() -> int:
    """Rebuilds the vector store from scratch. Returns the number of chunks indexed."""
    md_files = sorted(glob.glob(os.path.join(KNOWLEDGE_BASE_DIR, "*.md")))
    if not md_files:
        raise RuntimeError(f"No knowledge base files found in {KNOWLEDGE_BASE_DIR}")

    chunk_texts: List[str] = []
    chunk_meta: List[dict] = []
    for path in md_files:
        source = os.path.basename(path)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        for heading, text in _split_into_sections(content, source):
            chunk_texts.append(text)
            chunk_meta.append({"source": source, "topic": heading})

    print(f"Embedding {len(chunk_texts)} chunks from {len(md_files)} files...")
    embeddings = embed_documents(chunk_texts)

    chunks = [
        Chunk(id=f"{meta['source']}::{i}", text=text, embedding=embedding, metadata=meta)
        for i, (text, embedding, meta) in enumerate(zip(chunk_texts, embeddings, chunk_meta))
    ]

    settings = get_settings()
    path = os.path.join(settings.vector_store_path, INDEX_FILENAME)
    SimpleVectorStore(path).rebuild(chunks)
    return len(chunks)


if __name__ == "__main__":
    indexed_count = build_index()
    print(f"Indexed {indexed_count} chunks into {get_settings().vector_store_path}")
