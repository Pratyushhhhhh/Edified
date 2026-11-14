"""
rag/generator.py
────────────────
Builds a grounded prompt from retrieved chunks and calls the LLM.
Uses OpenRouter (primary) with automatic fallback to Gemini.

Returns:
  { "answer": str, "model_used": str }
"""

from __future__ import annotations
import requests
from rag.config import (
    OPENROUTER_API_KEY, GEMINI_API_KEY,
    OPENROUTER_MODEL, GEMINI_MODEL, log,
)

# ── System prompt ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a knowledgeable news assistant for "The Edified" — an editorial platform.
Your job is to answer the user's question using ONLY the provided news context.

Rules:
1. Answer concisely and factually. Be direct — no unnecessary preamble.
2. Cite sources inline as [Source: <outlet name>] when you use a specific article.
3. If the context doesn't contain enough information, say: "I don't have enough information in the current news database to answer that accurately."
4. Never fabricate facts, dates, or quotes.
5. If the user asks about breaking news not in the context, acknowledge the limitation.
6. Keep answers to 2–4 paragraphs max unless the user explicitly asks for more detail.
"""


def _build_prompt(question: str, chunks: list[dict]) -> str:
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        meta     = chunk.get("metadata", {})
        source   = meta.get("source", "Unknown")
        headline = meta.get("headline", "")
        url      = meta.get("url", "")
        text     = chunk.get("text", "")
        context_parts.append(
            f"[Context {i} — {source}]\n"
            f"Headline: {headline}\n"
            f"{text}"
            + (f"\nURL: {url}" if url else "")
        )
    context_block = "\n\n---\n\n".join(context_parts)
    return f"NEWS CONTEXT:\n{context_block}\n\nUSER QUESTION: {question}"


def _call_openrouter(prompt: str) -> str:
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not set")

    # Models to try on OpenRouter (auto router + popular free models)
    models_to_try = [
        OPENROUTER_MODEL,
        "openrouter/free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemini-2.0-flash-lite-preview-02-05:free",
    ]
    # Remove duplicates preserving order
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY.strip()}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "The Edified News",
    }

    last_error = None
    for model_name in models_to_try:
        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json={
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": prompt},
                    ],
                    "max_tokens": 600,
                    "temperature": 0.3,
                },
                timeout=45,
            )

            if resp.status_code == 429:
                log.warning(f"OpenRouter rate-limited on '{model_name}'")
                last_error = "Rate limit reached"
                continue

            if resp.status_code != 200:
                log.warning(f"OpenRouter model '{model_name}' error {resp.status_code}: {resp.text[:200]}")
                last_error = resp.text
                continue

            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0]["message"]["content"].strip()
        except requests.exceptions.RequestException as e:
            last_error = e

    raise RuntimeError(f"All OpenRouter models failed: {last_error}")


def _call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")

    clean_key = GEMINI_API_KEY.strip()
    full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"
    
    # Models to try in order
    models_to_try = [GEMINI_MODEL]
    for alt in ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-2.5-flash"]:
        if alt not in models_to_try:
            models_to_try.append(alt)

    last_error = None
    for model_name in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": clean_key,
            }
            params = {"key": clean_key}

            resp = requests.post(
                url,
                headers=headers,
                params=params,
                json={
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {
                        "maxOutputTokens": 600,
                        "temperature": 0.3,
                    },
                },
                timeout=30,
            )

            if resp.status_code == 404:
                log.warning(f"Gemini model '{model_name}' returned 404: {resp.text[:200]}")
                last_error = resp.text
                continue
            if resp.status_code != 200:
                log.warning(f"Gemini returned error {resp.status_code}: {resp.text[:200]}")
                resp.raise_for_status()

            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except requests.exceptions.RequestException as e:
            last_error = e

    raise RuntimeError(f"All Gemini models failed: {last_error}")


def generate(question: str, chunks: list[dict]) -> dict:
    """
    Generate an answer grounded in `chunks`.
    Returns {"answer": str, "model_used": "openrouter" | "gemini"}.
    """
    if not chunks:
        return {
            "answer": "I don't have relevant news in the database for that question. Try asking about recent news topics.",
            "model_used": "none",
        }

    prompt = _build_prompt(question, chunks)

    # 1. Try OpenRouter first
    try:
        answer = _call_openrouter(prompt)
        return {"answer": answer, "model_used": "openrouter"}
    except Exception as e:
        log.warning(f"OpenRouter call failed ({e}) → falling back to Gemini")

    # 2. Fallback: Gemini
    try:
        answer = _call_gemini(prompt)
        return {"answer": answer, "model_used": "gemini"}
    except Exception as e:
        log.error(f"Gemini also failed: {e}")
        return {
            "answer": "Sorry, I couldn't generate a response right now. Please check your API keys or try again in a moment.",
            "model_used": "error",
        }
