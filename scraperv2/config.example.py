import os
import sys
import logging
from pathlib import Path

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
# Note: In production, these should be loaded from environment variables
MONGO_URI = "YOUR_MONGO_URI_HERE"
DB_NAME = "news_aggregator"

# Collections
COL_SOURCES       = "sources"
COL_RAW_ARTICLES  = "test_v2"
COL_CLUSTERS      = "cluster_test_v2"

# ── HuggingFace ─────────────────────────────────────────────────────────────
HF_TOKENS = [
    "YOUR_HF_TOKEN_1",
    "YOUR_HF_TOKEN_2",
    "YOUR_HF_TOKEN_3",
]
HF_BART_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"

# ── Groq + Gemini ──────────────────────────────────────────────────────────
GROQ_API_KEY   = "YOUR_GROQ_API_KEY"
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"

# ── Scraping Settings ──────────────────────────────────────────────────────────
MAX_ARTICLES_PER_SOURCE = 10
FETCH_THREADS           = 8
REQUEST_TIMEOUT         = 12
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
}

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
MAX_ARTICLES_FOR_SUMMARY = 10
SUMMARIZER_THREADS       = 1
DELAY_BETWEEN_API_CALLS  = 2

# ── Bias ───────────────────────────────────────────────────────────────────────
BIAS_MODEL_NAME     = "bucketresearch/politicalBiasBERT"
