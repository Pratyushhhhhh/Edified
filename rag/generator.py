"""
rag/generator.py
────────────────
Sends retrieved context chunks + user query to the LLM.
Reuses the Groq → Gemini fallback pattern from summarizer_priority.py.

The prompt instructs the LLM to:
  1. Answer using ONLY the provided context
  2. Cite sources using [Source: article title] format
  3. Say "I don't know" if context is insufficient
"""
