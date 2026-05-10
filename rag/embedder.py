"""
rag/embedder.py
───────────────
Thin wrapper around SentenceTransformer for generating embeddings.
Reuses the same model as the clusterer (paraphrase-multilingual-MiniLM-L12-v2)
to keep the system consistent and avoid downloading extra models.

Provides:
  embed_texts(texts: list[str]) -> list[list[float]]
  embed_query(query: str)       -> list[float]
"""
