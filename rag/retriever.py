"""
rag/retriever.py
────────────────
Embeds a user query and performs cosine-similarity search against ChromaDB.
Returns the top-K most relevant chunks with their text, metadata and score.
"""

from __future__ import annotations
from typing import List, Optional
import chromadb
from rag.config import CHROMA_DIR, CHROMA_COLLECTION, TOP_K, log
from rag.embedder import embed_query

_collection = None


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = client.get_or_create_collection(
            name=CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def retrieve(
    query: str,
    top_k: int = TOP_K,
    category_filter: Optional[str] = None,
    cluster_id: Optional[str] = None,
) -> List[dict]:
    """
    Embed query → search ChromaDB → return top_k chunks.

    Each returned item:
      {
        "text":     str,
        "score":    float,          # cosine distance (lower = more similar)
        "metadata": {cluster_id, headline, category, source, url, chunk_idx}
      }
    """
    if not query or not query.strip():
        return []

    collection = _get_collection()
    if collection.count() == 0:
        log.warning("ChromaDB is empty — run `python -m rag.ingest` first")
        return []

    query_vec = embed_query(query.strip())

    # Filter by cluster_id if provided (for story-specific chat), else by category
    where = None
    if cluster_id:
        where = {"cluster_id": {"$eq": str(cluster_id)}}
    elif category_filter and category_filter.lower() not in ("all", ""):
        where = {"category": {"$eq": category_filter.capitalize()}}

    try:
        results = collection.query(
            query_embeddings=[query_vec],
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"],
            where=where,
        )
    except Exception as e:
        log.warning(f"ChromaDB query with filter failed ({e}) — falling back without filter")
        results = collection.query(
            query_embeddings=[query_vec],
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"],
        )

    chunks = []
    docs      = results.get("documents", [[]])[0]
    metas     = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    # If cluster_id is specified, keep all chunks from this cluster (no cluster deduplication)
    # If general search, deduplicate by cluster_id so multiple stories appear
    seen_clusters: set[str] = set()
    for doc, meta, dist in zip(docs, metas, distances):
        cid = meta.get("cluster_id", "")
        if not cluster_id:
            if cid in seen_clusters:
                continue
            seen_clusters.add(cid)
        chunks.append({
            "text":     doc,
            "score":    round(float(dist), 4),
            "metadata": meta,
        })

    return chunks
