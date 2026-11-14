"""
rag/api.py
──────────
FastAPI server that exposes the RAG chatbot as HTTP endpoints.
Runs independently on port 8000; Express on port 5000 proxies /api/rag/* to it.

Endpoints:
  POST /api/rag/ask     → {"question": "...", "category": "..."} 
                        → {"answer": "...", "sources": [...], "model_used": "..."}
  GET  /api/rag/health  → {"status": "ok", "chunks": N}
  POST /api/rag/ingest  → Trigger re-ingestion from MongoDB (admin use)

Run:
  uvicorn rag.api:app --port 8000 --reload
  or:
  python -m rag.api
"""

from __future__ import annotations
import os
import sys
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from rag.rag_chain import ask
from rag.config import RAG_PORT, log

app = FastAPI(
    title="Edified RAG API",
    description="Retrieval-Augmented Generation chatbot for The Edified news platform",
    version="1.0.0",
)

# Allow requests from the React dev server + production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ─────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000,
                          description="The user's question about news")
    category: Optional[str] = Field(None, description="Optional category filter")
    top_k: int = Field(6, ge=1, le=15, description="Number of chunks to retrieve")
    cluster_id: Optional[str] = Field(None, description="Optional story cluster ID to scope retrieval")
    cluster_context: Optional[dict] = Field(None, description="Direct story cluster articles & metadata")


class SourceItem(BaseModel):
    headline: str
    source:   str
    url:      str
    category: str
    score:    float


class AskResponse(BaseModel):
    answer:      str
    sources:     list[SourceItem]
    model_used:  str
    chunks_used: int


class HealthResponse(BaseModel):
    status: str
    chunks: int
    collection: str


class IngestResponse(BaseModel):
    status:  str
    chunks:  int
    message: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/rag/health", response_model=HealthResponse)
def health():
    """Health check — also reports how many chunks are indexed."""
    try:
        import chromadb
        from rag.config import CHROMA_DIR, CHROMA_COLLECTION
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        col    = client.get_or_create_collection(CHROMA_COLLECTION)
        count  = col.count()
    except Exception:
        count = -1
    return {"status": "ok", "chunks": count, "collection": "edified_news"}


@app.post("/api/rag/ask", response_model=AskResponse)
def ask_question(req: AskRequest):
    """
    Main RAG endpoint. Takes a question, retrieves relevant news chunks,
    and returns an LLM-generated answer with source citations.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        result = ask(
            question=req.question.strip(),
            top_k=req.top_k,
            category=req.category,
            cluster_id=req.cluster_id,
            cluster_context=req.cluster_context,
        )
        return result
    except Exception as e:
        log.error(f"RAG chain error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rag/ingest", response_model=IngestResponse)
def trigger_ingest(clear: bool = False):
    """
    Re-ingest all clusters from MongoDB into ChromaDB.
    Pass ?clear=true to wipe and rebuild from scratch.
    """
    try:
        from rag.ingest import ingest
        n = ingest(clear=clear)
        return {
            "status":  "ok",
            "chunks":  n,
            "message": f"Successfully ingested {n} chunks into ChromaDB",
        }
    except Exception as e:
        log.error(f"Ingest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Dev entrypoint ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("rag.api:app", host="0.0.0.0", port=RAG_PORT, reload=False)
