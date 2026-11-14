"""
rag/embedder.py
───────────────
Thin wrapper around SentenceTransformer.
Reuses the same model as the clusterer so no extra model download is needed.
Lazy-loads the model on first call (saves RAM when only the API is running).
"""

from __future__ import annotations
from typing import List
from rag.config import EMBEDDING_MODEL, log

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        log.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        _model = SentenceTransformer(EMBEDDING_MODEL)
        log.info("Embedding model loaded ✓")
    return _model


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed a list of texts. Returns list of float vectors."""
    if not texts:
        return []
    model = _get_model()
    vectors = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    return vectors.tolist()


def embed_query(query: str) -> List[float]:
    """Embed a single query string."""
    return embed_texts([query])[0]
