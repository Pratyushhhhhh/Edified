"""
rag/ingest_documents.py
───────────────────────
Reads PDFs, text files, and markdown files from the knowledge_sources/
folder, chunks them, and adds to ChromaDB alongside the news data.

Supported formats:
  .txt  — plain text
  .pdf  — via PyPDF2
  .md   — markdown (stripped of formatting)

Usage:
  python -m rag.ingest_documents
"""
