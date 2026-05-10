"""
rag/rag_chain.py
────────────────
The main RAG pipeline that ties everything together:
  1. Embed the user's question
  2. Retrieve top-K relevant chunks from ChromaDB
  3. Build a context-rich prompt
  4. Call the LLM (Groq/Gemini)
  5. Return the answer with source citations

Provides:
  ask(question: str) -> dict  # {"answer": "...", "sources": [...]}
"""
