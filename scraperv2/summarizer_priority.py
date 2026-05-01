import re
import sys
import time
import json
import argparse
import threading
from datetime import datetime, timezone
from pathlib import Path

import requests
from pymongo import MongoClient

from config import (
    log, MONGO_URI, DB_NAME, COL_CLUSTERS,
    GROQ_API_KEY, GEMINI_API_KEY,
)

# ─────────────────────────────────────────────────────────────────────────────
#  TUNABLE CONSTANTS  ← tweak these to balance speed vs quality
# ─────────────────────────────────────────────────────────────────────────────

MIN_ARTICLE_COUNT   = 3       # skip clusters with fewer articles than this
MAX_CLUSTERS        = 150     # hard cap — never process more than this many
WORDS_PER_ARTICLE   = 150     # truncate each article (was 300 in v3)
MAX_ARTICLES_IN_CTX = 8      # max articles to feed the LLM (was 10 in v3)

# llama-3.1-8b-instant: 30 RPM, 14,400 TPM free tier
# ~800 tokens/call → 18 calls/min by TPM → safe at 4s sleep = 15 calls/min
GROQ_MODEL        = "llama-3.1-8b-instant"
GROQ_RPM_SLEEP    = 8.0
GROQ_DAILY_LIMIT  = 950

GEMINI_MODEL      = "gemini-2.0-flash"
GEMINI_RPM_SLEEP  = 5.0

CHECKPOINT_FILE = Path("summarizer_checkpoint.json")

# ─────────────────────────────────────────────────────────────────────────────
#  CHECKPOINT  (shared with summarizer_v3)
# ─────────────────────────────────────────────────────────────────────────────

def load_checkpoint() -> set:
    if CHECKPOINT_FILE.exists():
        data = json.loads(CHECKPOINT_FILE.read_text())
        ids = set(data.get("completed_ids", []))
        log.info(f"Checkpoint loaded: {len(ids)} clusters already done")
        return ids
    return set()


def save_checkpoint(completed_ids: set):
    CHECKPOINT_FILE.write_text(json.dumps({
        "completed_ids": list(completed_ids),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }, indent=2))


# ─────────────────────────────────────────────────────────────────────────────
#  TEXT HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def get_article_text(article: dict) -> str:
    content = article.get("fullContent", "").strip()
    if content and len(content) > 50:
        return content
    meta = article.get("summary_meta", "").strip()
    if meta and len(meta) > 30:
        return meta
    return article.get("snippet", "").strip()


def truncate_words(text: str, n: int) -> str:
    words = text.split()
    return text if len(words) <= n else " ".join(words[:n]) + "..."


def extract_source(article: dict) -> str:
    s = (
        article.get("source_name") or article.get("source") or
        article.get("outlet") or article.get("domain") or ""
    )
    if s:
        return str(s).strip()
    url = article.get("url") or article.get("real_url") or ""
    m = re.search(r"(?:https?://)?(?:www\.)?([^/.]+)", url)
    return m.group(1).capitalize() if m else "Unknown"


# ─────────────────────────────────────────────────────────────────────────────
#  PROMPT BUILDER  — single call for HEADLINE + 3 POINTS
# ─────────────────────────────────────────────────────────────────────────────

def build_prompt(original_headline: str, articles: list) -> str:
    blocks = []
    for i, art in enumerate(articles[:MAX_ARTICLES_IN_CTX], 1):
        src  = extract_source(art)
        text = get_article_text(art)
        if text:
            text = truncate_words(text, WORDS_PER_ARTICLE)
            blocks.append(f"[ARTICLE {i} — {src}]\n{text}")

    articles_str = "\n\n".join(blocks)
    n = len(blocks)

    return f"""You are a factual news editor. The {n} articles below all cover the same news story.

Original headline: {original_headline}

{articles_str}

---

Write ALL of the following in this EXACT format. Do not add any text before HEADLINE or after POINT 3.

HEADLINE: One crisp, neutral, factual headline. Maximum 12 words. No clickbait.

POINT 1 — Main event:
What happened — the core facts. Minimum 40 words. At the end, cite articles: (Articles: 1, 2)

POINT 2 — Context or second angle:
Background, cause, or a different perspective some outlets emphasize. Minimum 40 words. (Articles: X, Y)

POINT 3 — Verified facts only:
Only specific numbers, dates, names, official statements. No opinions. Minimum 40 words. (Articles: X, Y)"""


# ─────────────────────────────────────────────────────────────────────────────
#  GROQ
# ─────────────────────────────────────────────────────────────────────────────

class GroqRateLimitError(Exception):
    pass

class GroqDailyLimitReached(Exception):
    pass

_groq_calls_today = 0
_groq_lock = threading.Lock()


def _call_groq(prompt: str) -> str:
    global _groq_calls_today

    with _groq_lock:
        if _groq_calls_today >= GROQ_DAILY_LIMIT:
            raise GroqDailyLimitReached("Groq daily budget exhausted")
        _groq_calls_today += 1
        count = _groq_calls_today

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are a factual news editor. Follow the output format exactly."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 500,
        "temperature": 0.2,
        "top_p": 0.9,
    }

    for attempt in range(3):
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers, json=payload, timeout=60,
            )
            if resp.status_code == 429:
                retry_after = int(resp.headers.get("retry-after", 60))
                if retry_after > 30:
                    raise GroqRateLimitError(f"Groq rate-limited ({retry_after}s wait)")
                log.warning(f"    Groq 429 — waiting {retry_after}s (attempt {attempt+1}/3)")
                time.sleep(retry_after)
                continue
            if resp.status_code != 200:
                log.warning(f"    Groq error {resp.status_code}: {resp.text[:200]}")
                time.sleep(10)
                continue
            data = resp.json()
            text = data["choices"][0]["message"]["content"].strip()
            log.info(f"    Groq call #{count} OK ({data['usage']['total_tokens']} tokens)")
            return text
        except requests.Timeout:
            log.warning(f"    Groq timeout (attempt {attempt+1})")
            time.sleep(15)

    raise GroqRateLimitError("Groq failed after 3 attempts")


# ─────────────────────────────────────────────────────────────────────────────
#  GEMINI FALLBACK
# ─────────────────────────────────────────────────────────────────────────────

def _call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 500, "temperature": 0.2},
    }
    for attempt in range(3):
        try:
            resp = requests.post(url, json=payload, timeout=60)
            if resp.status_code == 429:
                wait = int(resp.headers.get("retry-after", 60))
                log.warning(f"    Gemini 429 — waiting {wait}s")
                time.sleep(wait)
                continue
            if resp.status_code != 200:
                log.warning(f"    Gemini error {resp.status_code}: {resp.text[:200]}")
                time.sleep(10)
                continue
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return ""
            return candidates[0]["content"]["parts"][0]["text"].strip()
        except requests.Timeout:
            log.warning(f"    Gemini timeout (attempt {attempt+1})")
            time.sleep(15)
    return ""


# ─────────────────────────────────────────────────────────────────────────────
#  UNIFIED CALLER
# ─────────────────────────────────────────────────────────────────────────────

_using_gemini_fallback = False


def call_llm(prompt: str) -> str:
    global _using_gemini_fallback

    if not _using_gemini_fallback:
        try:
            result = _call_groq(prompt)
            time.sleep(GROQ_RPM_SLEEP)
            return result
        except GroqDailyLimitReached:
            log.warning("★ Groq daily limit reached — switching permanently to Gemini")
            _using_gemini_fallback = True
        except GroqRateLimitError as e:
            log.warning(f"    {e} — using Gemini for this cluster only")
            result = _call_gemini(prompt)
            time.sleep(GEMINI_RPM_SLEEP)
            return result

    result = _call_gemini(prompt)
    time.sleep(GEMINI_RPM_SLEEP)
    return result


# ─────────────────────────────────────────────────────────────────────────────
#  RESPONSE PARSER  — extracts HEADLINE + 3 POINTS from one response
# ─────────────────────────────────────────────────────────────────────────────

def parse_response(text: str) -> tuple[str, list]:
    """
    Returns (generated_headline, [point1, point2, point3]).
    Headline falls back to "" if not found.
    Points fall back to paragraph splits.
    """
    # Extract headline
    headline = ""
    headline_match = re.search(r"HEADLINE:\s*(.+?)(?:\n|$)", text, re.IGNORECASE)
    if headline_match:
        headline = headline_match.group(1).strip()

    # Extract 3 points — split on POINT N pattern
    segments = re.split(r"POINT\s+\d+\s*[—\-–:][^\n]*\n?", text, flags=re.IGNORECASE)
    segments = [s.strip() for s in segments if s.strip() and len(s.strip()) > 30]

    points = []
    if len(segments) >= 2:
        for seg in segments[:3]:
            cleaned = re.sub(r"^[^\n:]+:\s*\n?", "", seg, count=1).strip() or seg.strip()
            if len(cleaned) > 20:
                points.append(cleaned)

    # Fallback: paragraph splits
    if len(points) < 2:
        paras = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 40]
        points = paras[:3]

    if not points:
        points = [text[:800].strip()]

    return headline, points[:3]


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────────────────────────

def run(min_articles: int = MIN_ARTICLE_COUNT, max_clusters: int = MAX_CLUSTERS):
    log.info(f"=== Summarizer PRIORITY (min_articles={min_articles}, cap={max_clusters}) ===")
    log.info(f"    Model: {GROQ_MODEL} | Words/article: {WORDS_PER_ARTICLE} | Max articles: {MAX_ARTICLES_IN_CTX}")

    if not GROQ_API_KEY:
        log.error("GROQ_API_KEY not set!")
        return
    if not GEMINI_API_KEY:
        log.warning("GEMINI_API_KEY not set — no fallback available")

    client = MongoClient(MONGO_URI)
    cluster_col = client[DB_NAME][COL_CLUSTERS]

    # Load top clusters sorted by articleCount DESC, filtered by min size
    log.info(f"Loading clusters with articleCount >= {min_articles}, sorted by size...")
    clusters = list(
        cluster_col.find(
            {"articleCount": {"$gte": min_articles}},
            {"_id": 1, "headline": 1, "articles": 1, "summary": 1, "articleCount": 1}
        ).sort("articleCount", -1).limit(max_clusters)
    )
    log.info(f"Found {len(clusters)} qualifying clusters (cap: {max_clusters})")

    completed_ids = load_checkpoint()

    def already_done(c):
        if str(c["_id"]) in completed_ids:
            return True
        existing = c.get("summary", [])
        return isinstance(existing, list) and len(existing) >= 3

    pending = [c for c in clusters if not already_done(c)]
    log.info(f"Pending: {len(pending)} | Already done: {len(clusters) - len(pending)}")

    if not pending:
        log.info("All qualifying clusters are already summarized.")
        return

    # Estimate time
    est_min = (len(pending) * (GROQ_RPM_SLEEP + 1)) / 60
    log.info(f"Estimated time: ~{est_min:.0f} minutes at {GROQ_RPM_SLEEP}s/call")

    success = failed = skipped = 0
    start_time = time.time()

    for i, cluster in enumerate(pending, 1):
        headline    = cluster.get("headline", "Unknown")
        art_count   = cluster.get("articleCount", 0)
        log.info(f"\n[{i}/{len(pending)}] ({art_count} articles) {headline[:70]}")

        # Collect article texts
        articles_raw = cluster.get("articles", [])
        usable = []
        for art in articles_raw[:MAX_ARTICLES_IN_CTX]:
            text = get_article_text(art)
            if text and len(text) > 30:
                usable.append({"source": extract_source(art), "text": text})

        if not usable:
            log.warning("  → No usable content, skipping")
            skipped += 1
            completed_ids.add(str(cluster["_id"]))
            save_checkpoint(completed_ids)
            continue

        log.info(f"  → {len(usable)} articles with content")
        prompt = build_prompt(headline, usable)

        try:
            raw_response = call_llm(prompt)
        except Exception as e:
            log.error(f"  → Both APIs failed: {e}")
            failed += 1
            continue

        if not raw_response:
            log.warning("  → Empty response")
            failed += 1
            continue

        gen_headline, points = parse_response(raw_response)
        log.info(f"  → Headline: {gen_headline[:80]}")
        log.info(f"  → {len(points)} points parsed")
        for j, p in enumerate(points, 1):
            log.info(f"     P{j}: {p[:80]}...")

        update = {
            "summary":            points,
            "summaryRaw":         raw_response,
            "summaryModel":       "gemini" if _using_gemini_fallback else f"groq/{GROQ_MODEL}",
            "updatedAt":          datetime.now(timezone.utc),
        }
        # Only overwrite headline if we got a clean one from the LLM
        if gen_headline and len(gen_headline) > 5:
            update["generatedHeadline"] = gen_headline

        cluster_col.update_one({"_id": cluster["_id"]}, {"$set": update})
        completed_ids.add(str(cluster["_id"]))
        save_checkpoint(completed_ids)
        success += 1

        if i % 25 == 0:
            elapsed = time.time() - start_time
            rate = i / elapsed * 60
            eta  = (len(pending) - i) / max(rate, 0.1)
            log.info(f"\n  ── Progress: {i}/{len(pending)} | {rate:.1f}/min | ETA: {eta:.0f} min ──")

    elapsed_total = time.time() - start_time
    log.info(f"\n{'═' * 50}")
    log.info(f"Success  : {success}")
    log.info(f"Skipped  : {skipped}")
    log.info(f"Failed   : {failed}")
    log.info(f"Groq calls: {_groq_calls_today} / {GROQ_DAILY_LIMIT}")
    log.info(f"Time      : {elapsed_total/60:.1f} min")
    log.info(f"Gemini fallback: {'Yes' if _using_gemini_fallback else 'No'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Priority summarizer — top clusters first")
    parser.add_argument("--min-articles", type=int, default=MIN_ARTICLE_COUNT,
                        help=f"Only summarize clusters with >= N articles (default: {MIN_ARTICLE_COUNT})")
    parser.add_argument("--max-clusters", type=int, default=MAX_CLUSTERS,
                        help=f"Hard cap on clusters to process (default: {MAX_CLUSTERS})")
    args = parser.parse_args()
    run(min_articles=args.min_articles, max_clusters=args.max_clusters)
