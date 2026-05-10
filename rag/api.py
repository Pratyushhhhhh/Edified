"""
rag/api.py
──────────
Lightweight FastAPI server that exposes the RAG chain as HTTP endpoints.

Endpoints:
  POST /api/rag/ask     → {"question": "..."} → {"answer": "...", "sources": [...]}
  GET  /api/rag/health  → {"status": "ok"}
  POST /api/rag/ingest  → Trigger re-ingestion manually

Run:
  uvicorn rag.api:app --port 8000 --reload
"""
