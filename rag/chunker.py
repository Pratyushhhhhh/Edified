"""
rag/chunker.py
──────────────
Splits cluster headlines + summaries + article snippets into overlapping
character-level chunks, each carrying rich metadata for citation.
"""

from __future__ import annotations
from typing import List, Dict, Any
from rag.config import CHUNK_SIZE, CHUNK_OVERLAP


def _split_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    """Split a text string into overlapping chunks."""
    if not text or not text.strip():
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = end - overlap
    return chunks


def chunk_cluster(cluster: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Turn one MongoDB cluster document into a list of chunk dicts.
    Each chunk dict has: text, metadata (cluster_id, headline, source, category, url).
    """
    cluster_id = str(cluster.get("_id", ""))
    headline   = cluster.get("headline", "")
    category   = cluster.get("category", "General")
    summary    = cluster.get("summary", [])
    articles   = cluster.get("articles", [])

    # Build the full text corpus for this cluster
    parts: List[str] = []

    # 1. Headline (high signal — repeat it so it appears in many chunks)
    if headline:
        parts.append(f"Headline: {headline}")

    # 2. AI-generated summary bullets
    if summary:
        parts.append("Summary:\n" + "\n".join(f"• {s}" for s in summary if s))

    # 3. Each article's title + snippet/summary_meta
    for art in articles:
        title        = art.get("title", "")
        source       = art.get("source_name") or art.get("source", "Unknown")
        snippet      = art.get("summary_meta") or art.get("snippet", "")
        url          = art.get("url") or art.get("real_url", "")
        bias         = art.get("biasLabel", "")

        article_text = ""
        if title:
            article_text += f"[{source}] {title}"
        if snippet:
            article_text += f"\n{snippet}"
        if bias:
            article_text += f"\n(Bias: {bias})"
        if article_text.strip():
            parts.append(article_text.strip())

    full_text = "\n\n".join(parts)

    # Chunk and annotate
    raw_chunks = _split_text(full_text, CHUNK_SIZE, CHUNK_OVERLAP)
    result = []
    for i, text in enumerate(raw_chunks):
        # Pick a representative source from first article
        first_article = articles[0] if articles else {}
        cover_source  = first_article.get("source_name") or first_article.get("source", "Unknown")
        cover_url     = first_article.get("url") or first_article.get("real_url", "")

        result.append({
            "text": text,
            "metadata": {
                "cluster_id": cluster_id,
                "headline":   headline[:120],
                "category":   category,
                "source":     cover_source,
                "url":        cover_url,
                "chunk_idx":  i,
            }
        })
    return result
