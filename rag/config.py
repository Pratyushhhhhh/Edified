"""
rag/config.py
─────────────
RAG-specific configuration.
Imports shared secrets (MONGO_URI, API keys) from scraperv2/.env
and defines RAG-specific settings like chunk size, overlap, top-k, etc.
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load from scraperv2/.env (where all API keys live)
_env_path = Path(__file__).parent.parent / "scraperv2" / ".env"
load_dotenv(_env_path)

# ── Force UTF-8 on Windows ─────────────────────────────────────────────────────
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("rag")

# ── MongoDB ────────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "news_aggregator")
COL_CLUSTERS = "cluster_test_v2"

# ── LLM keys ──────────────────────────────────────────────────────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GEMINI_API_KEY     = os.getenv("GEMINI_API_KEY")

# ── LLM models ────────────────────────────────────────────────────────────────
# OpenRouter: Supports openrouter/free, Llama 3.3 70B, etc.
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")

# Gemini: Google AI Studio fallback
GEMINI_MODEL     = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

# ── Embedding ─────────────────────────────────────────────────────────────────
# Reuse same model as the clusterer for consistency (no extra download)
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# ── ChromaDB ──────────────────────────────────────────────────────────────────
CHROMA_DIR        = str(Path(__file__).parent / "chroma_store")
CHROMA_COLLECTION = "edified_news"

# ── Chunking ──────────────────────────────────────────────────────────────────
CHUNK_SIZE    = 600   # characters per chunk
CHUNK_OVERLAP = 120   # overlap between consecutive chunks

# ── Retrieval ─────────────────────────────────────────────────────────────────
TOP_K         = 6     # number of chunks to retrieve per query

# ── FastAPI ───────────────────────────────────────────────────────────────────
RAG_PORT = 8000
