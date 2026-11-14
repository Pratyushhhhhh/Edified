"""
rag/rag_chain.py
────────────────
Ties retriever + generator into a single call:
  ask(question) → {"answer": str, "sources": [...], "model_used": str}

Supports cluster-specific answering:
  - If cluster_context / articles are provided, answers directly from that cluster.
  - If cluster_id is provided, filters ChromaDB retrieval specifically for that story.
"""

from __future__ import annotations
from typing import Optional, List, Dict, Any
from rag.retriever import retrieve
from rag.generator import generate
from rag.config import TOP_K


def ask(
    question: str,
    top_k: int = TOP_K,
    category: Optional[str] = None,
    cluster_id: Optional[str] = None,
    cluster_context: Optional[Dict[str, Any]] = None,
) -> dict:
    """
    Full RAG pipeline with optional cluster grounding:
      1. If cluster_context provided (articles array), format chunks directly from the story.
      2. Otherwise, retrieve top-k chunks from ChromaDB (filtered by cluster_id if supplied).
      3. Send chunks + question to LLM → get grounded answer.
      4. Return answer + source citations.
    """
    chunks = []

    # Case A: Live cluster context passed directly from the story detail page
    if cluster_context and cluster_context.get("articles"):
        headline = cluster_context.get("headline", "")
        category_name = cluster_context.get("category", "General")
        summary_pts = cluster_context.get("summary", [])

        if summary_pts:
            chunks.append({
                "text": "Editorial Summary Points:\n" + "\n".join(f"• {p}" for p in summary_pts),
                "score": 0.0,
                "metadata": {
                    "source": "The Edified Synthesis",
                    "headline": headline,
                    "url": "",
                    "category": category_name,
                }
            })

        for art in cluster_context.get("articles", [])[:10]:
            title = art.get("title", "")
            snippet = art.get("snippet") or art.get("summary_meta", "")
            source = art.get("source_name") or art.get("source", "Unknown Outlet")
            url = art.get("real_url") or art.get("url", "")
            bias = art.get("biasLabel", "")

            art_text = f"[{source}] {title}"
            if snippet:
                art_text += f"\n{snippet}"
            if bias:
                art_text += f"\n(Reported Bias: {bias})"

            chunks.append({
                "text": art_text,
                "score": 0.0,
                "metadata": {
                    "source": source,
                    "headline": title or headline,
                    "url": url,
                    "category": category_name,
                }
            })

    # Case B: If no direct articles or fewer than needed, retrieve from ChromaDB
    if not chunks:
        chunks = retrieve(
            question,
            top_k=top_k,
            category_filter=category,
            cluster_id=cluster_id,
        )

    # Step 2: Generate grounded answer
    result = generate(question, chunks)

    # Step 3: Build deduplicated source citations
    seen_urls: set[str] = set()
    sources = []
    for chunk in chunks:
        meta = chunk.get("metadata", {})
        source_name = meta.get("source", "")
        headline_text = meta.get("headline", "")
        url = meta.get("url", "")
        identifier = url if url else (source_name + headline_text)

        if identifier and identifier not in seen_urls:
            seen_urls.add(identifier)
            sources.append({
                "headline": headline_text,
                "source":   source_name,
                "url":      url,
                "category": meta.get("category", ""),
                "score":    chunk.get("score", 1.0),
            })

    return {
        "answer":      result["answer"],
        "sources":     sources,
        "model_used":  result["model_used"],
        "chunks_used": len(chunks),
    }
