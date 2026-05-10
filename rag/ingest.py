"""
rag/ingest.py
─────────────
Reads clusters from MongoDB (cluster_test_v2), chunks article text,
embeds it, and stores in ChromaDB. Designed to run after the main
orchestrator pipeline or as a standalone stage.

Usage:
  python -m rag.ingest           # ingest all active clusters
  python orchestrator.py --stage rag  # via orchestrator
"""
