"""
rag/chunker.py
──────────────
Splits article text and document text into overlapping chunks.
Each chunk carries metadata (source article ID, cluster ID, etc.)
for citation when the LLM generates answers.

Key settings (from config.py):
  CHUNK_SIZE    = 500 chars
  CHUNK_OVERLAP = 100 chars
"""
