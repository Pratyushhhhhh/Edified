"""
scraperv2/config.py
───────────────────
Shared configuration for the entire pipeline.
All other modules import from here — no hardcoded strings anywhere else.
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the current directory
load_dotenv(Path(__file__).parent / ".env")

# ── Force UTF-8 on Windows consoles ────────────────────────────────────────────
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
log = logging.getLogger("scraperv2")

# ── MongoDB ────────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "news_aggregator")

# Collections — v2 writes to separate collections so production is untouched
COL_SOURCES       = "sources"
COL_RAW_ARTICLES  = "test_v2"
COL_CLUSTERS      = "cluster_test_v2"

# ── HuggingFace (used by bias_analyzer only) ───────────────────────────────
HF_TOKENS = [
    os.getenv("HF_TOKEN_1"),
    os.getenv("HF_TOKEN_2"),
    os.getenv("HF_TOKEN_3"),
]
HF_BART_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"

# ── Groq + Gemini (used by summarizer_v3) ──────────────────────────────────
GROQ_API_KEY   = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ── Scraping ───────────────────────────────────────────────────────────────────
MAX_ARTICLES_PER_SOURCE = 10          # fetch up to 10 articles per RSS source
FETCH_THREADS           = 8           # parallel threads for HTTP requests
REQUEST_TIMEOUT         = 12          # seconds per HTTP request
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
}

# Google News generic image domains — always reject these
BAD_IMAGE_DOMAINS = [
    "lh3.googleusercontent.com",
    "news.google.com",
    "gstatic.com",
    "google.com/s2",
    "encrypted-tbn",
]

# ── Clustering ─────────────────────────────────────────────────────────────────
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
HDBSCAN_MIN_CLUSTER_SIZE = 2
HDBSCAN_MIN_SAMPLES      = 1

# ── Summarization ──────────────────────────────────────────────────────────────
MAX_ARTICLES_FOR_SUMMARY = 10    # pass up to 10 articles to the LLM
SUMMARIZER_THREADS       = 1    # MUST be 1 — Groq free tier is 30 RPM shared
DELAY_BETWEEN_API_CALLS  = 2    # legacy; v3 uses GROQ_RPM_SLEEP internally

# ── Bias ───────────────────────────────────────────────────────────────────────
BIAS_MODEL_NAME     = "bucketresearch/politicalBiasBERT"
BIAS_TOKENIZER_NAME = "bert-base-cased"
BIAS_BATCH_SIZE     = 16
