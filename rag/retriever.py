"""
rag/retriever.py
────────────────
Takes a user query, embeds it, and performs a similarity search
against ChromaDB. Returns the top-K most relevant chunks with
their metadata and relevance scores.

Provides:
  retrieve(query: str, top_k: int = 5, filters: dict = None) -> list[dict]
"""
