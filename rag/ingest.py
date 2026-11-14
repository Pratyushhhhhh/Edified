"""
rag/ingest.py
─────────────
Reads ALL active clusters from MongoDB (cluster_test_v2),
chunks headline + summary + article snippets,
embeds the chunks with the same MiniLM model used by the clusterer,
and upserts everything into ChromaDB.

Usage:
  python -m rag.ingest           # ingest / refresh all clusters
  python -m rag.ingest --clear   # wipe ChromaDB first, then re-ingest
"""

from __future__ import annotations
import argparse
import sys
from pymongo import MongoClient
from rag.config import MONGO_URI, DB_NAME, COL_CLUSTERS, CHROMA_DIR, CHROMA_COLLECTION, log
from rag.chunker import chunk_cluster
from rag.embedder import embed_texts
import chromadb


def get_chroma_collection(clear: bool = False):
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    if clear:
        try:
            client.delete_collection(CHROMA_COLLECTION)
            log.info(f"Cleared ChromaDB collection '{CHROMA_COLLECTION}'")
        except Exception:
            pass
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        metadata={"hnsw:space": "cosine"},  # cosine similarity
    )
    return collection


def ingest(clear: bool = False) -> int:
    """
    Pull clusters from MongoDB, chunk + embed, store in ChromaDB.
    Returns the total number of chunks upserted.
    """
    # ── 1. Load clusters ───────────────────────────────────────────────────────
    mongo  = MongoClient(MONGO_URI)
    db     = mongo[DB_NAME]
    col    = db[COL_CLUSTERS]

    # Only active clusters with a real headline
    clusters = list(col.find(
        {"isActive": {"$ne": False}, "headline": {"$exists": True, "$ne": ""}},
        # Projection: get headline, summary, articles (minus fullContent), category
        {
            "_id": 1, "headline": 1, "summary": 1, "category": 1,
            "articles.title": 1, "articles.source_name": 1, "articles.source": 1,
            "articles.snippet": 1, "articles.summary_meta": 1,
            "articles.url": 1, "articles.real_url": 1,
            "articles.biasLabel": 1,
        }
    ))
    log.info(f"Fetched {len(clusters)} clusters from MongoDB")

    # ── 2. Chunk ───────────────────────────────────────────────────────────────
    all_chunks: list[dict] = []
    for cluster in clusters:
        all_chunks.extend(chunk_cluster(cluster))

    log.info(f"Generated {len(all_chunks)} chunks from {len(clusters)} clusters")

    if not all_chunks:
        log.warning("No chunks to ingest — is the DB populated?")
        mongo.close()
        return 0

    # ── 3. Embed ───────────────────────────────────────────────────────────────
    texts = [c["text"] for c in all_chunks]
    log.info("Embedding chunks (this may take a moment)…")
    embeddings = embed_texts(texts)
    log.info("Embedding done ✓")

    # ── 4. Upsert into ChromaDB ────────────────────────────────────────────────
    collection = get_chroma_collection(clear=clear)

    # Build IDs: cluster_id + chunk_idx (stable across re-runs → upsert)
    ids        = [f"{c['metadata']['cluster_id']}__chunk{c['metadata']['chunk_idx']}" for c in all_chunks]
    metadatas  = [c["metadata"] for c in all_chunks]

    # ChromaDB upsert in batches of 500 (Chroma limit per call)
    BATCH = 500
    for i in range(0, len(all_chunks), BATCH):
        collection.upsert(
            ids=ids[i:i+BATCH],
            embeddings=embeddings[i:i+BATCH],
            documents=texts[i:i+BATCH],
            metadatas=metadatas[i:i+BATCH],
        )
        log.info(f"Upserted batch {i//BATCH + 1} ({min(i+BATCH, len(all_chunks))}/{len(all_chunks)})")

    log.info(f"✓ ChromaDB now has {collection.count()} total chunks")
    mongo.close()
    return len(all_chunks)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest news clusters into ChromaDB")
    parser.add_argument("--clear", action="store_true", help="Wipe ChromaDB before ingesting")
    args = parser.parse_args()
    n = ingest(clear=args.clear)
    print(f"\n✓ Ingested {n} chunks into ChromaDB")
