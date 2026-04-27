"""
scraperv2/collector.py
──────────────────────
Fast, parallel article fetcher.

Flow:
  1. Read sources from MongoDB `sources` collection
  2. For each source, try native RSS first, fall back to Google News RSS
  3. Resolve Google News redirect URLs via base64 decode + HTTP redirect
  4. Extract article content via newspaper3k
  5. Extract images via og:image / twitter:image meta tags
  6. Deduplicate by normalised title per source
  7. Insert into `test_v2` collection

Key improvements over v1:
  - ThreadPoolExecutor for parallel fetching (8 threads)
  - No Playwright dependency
  - Articles are NEVER skipped for missing images
  - Title-based deduplication prevents 27+ duplicates
"""

import re
import base64
import hashlib
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import feedparser
from bs4 import BeautifulSoup
from newspaper import Article
from pymongo import MongoClient

from config import (
    log, MONGO_URI, DB_NAME, COL_SOURCES, COL_RAW_ARTICLES,
    MAX_ARTICLES_PER_SOURCE, FETCH_THREADS, REQUEST_TIMEOUT,
    HEADERS, BAD_IMAGE_DOMAINS,
)

# NATIVE_RSS dict removed: Feeds are now read directly from MongoDB 'native_rss_feeds' array.


# ═══════════════════════════════════════════════════════════════════════════════
#  URL RESOLUTION
# ═══════════════════════════════════════════════════════════════════════════════

def _decode_gnews_base64(google_url: str) -> str:
    """Try to extract the real URL from a Google News article ID via base64."""
    try:
        match = re.search(r"/articles/([A-Za-z0-9_-]+)", google_url)
        if not match:
            return ""
        article_id = match.group(1)
        padding = 4 - len(article_id) % 4
        if padding != 4:
            article_id += "=" * padding
        decoded = base64.urlsafe_b64decode(article_id)
        urls = re.findall(rb"https?://[^\x00-\x1f\x7f-\xff ]{10,}", decoded)
        for url_bytes in urls:
            url = url_bytes.decode("utf-8", errors="ignore").rstrip("\\")
            if "google.com" not in url:
                return url
    except Exception:
        pass
    return ""


def _extract_url_from_snippet(snippet_html: str) -> str:
    """Google News RSS entries contain <a href> to the real article inside the snippet HTML."""
    if not snippet_html:
        return ""
    try:
        soup = BeautifulSoup(snippet_html, "html.parser")
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            if href.startswith("http") and "news.google.com" not in href and "google.com" not in href:
                return href
    except Exception:
        pass
    return ""


def _resolve_via_redirect(google_url: str) -> str:
    """Follow HTTP redirects to find the real article URL."""
    try:
        resp = requests.get(
            google_url, headers=HEADERS, timeout=REQUEST_TIMEOUT,
            allow_redirects=True,
        )
        final = resp.url
        if "news.google.com" not in final:
            return final
        # Parse canonical link from the HTML
        soup = BeautifulSoup(resp.text, "html.parser")
        canonical = soup.find("link", rel="canonical")
        if canonical and canonical.get("href", "").startswith("http"):
            href = canonical["href"]
            if "news.google.com" not in href:
                return href
    except Exception:
        pass
    return ""


def resolve_url(entry_link: str, entry_summary: str = "") -> str:
    """Resolve a Google News URL to the real article URL."""
    if "news.google.com" not in entry_link:
        return entry_link

    # Fast path 1: base64 decode (no HTTP needed)
    url = _decode_gnews_base64(entry_link)
    if url:
        return url

    # Fast path 2: extract from RSS snippet HTML (no HTTP needed)
    url = _extract_url_from_snippet(entry_summary)
    if url:
        return url

    # Slow path: follow HTTP redirects
    url = _resolve_via_redirect(entry_link)
    if url:
        return url

    return entry_link   # return original if nothing works


# ═══════════════════════════════════════════════════════════════════════════════
#  IMAGE EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

def is_valid_image(url: str) -> bool:
    if not url or not isinstance(url, str) or not url.startswith("http"):
        return False
    return not any(bad in url for bad in BAD_IMAGE_DOMAINS)


def extract_image(html: str) -> str:
    """Extract best image from raw HTML via meta tags."""
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")

    # Priority: og:image > twitter:image > first large img
    for prop in ["og:image", "og:image:url", "twitter:image", "twitter:image:src"]:
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if tag:
            img = tag.get("content", "").strip()
            if is_valid_image(img):
                return img

    # Fallback: link rel=image_src
    link = soup.find("link", rel="image_src")
    if link and is_valid_image(link.get("href", "")):
        return link["href"].strip()

    return ""


def fetch_image_from_url(url: str) -> str:
    """Fetch a page and extract its social media image."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        if resp.status_code == 200:
            return extract_image(resp.text)
    except Exception:
        pass
    return ""


# ═══════════════════════════════════════════════════════════════════════════════
#  TITLE NORMALISATION & DEDUP
# ═══════════════════════════════════════════════════════════════════════════════

def normalise_title(title: str) -> str:
    """Normalise a title for deduplication: lowercase, strip punctuation, collapse spaces."""
    t = title.lower()
    t = re.sub(r"[^\w\s]", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def title_hash(title: str) -> str:
    return hashlib.md5(normalise_title(title).encode("utf-8")).hexdigest()


# ═══════════════════════════════════════════════════════════════════════════════
#  ARTICLE SCRAPING
# ═══════════════════════════════════════════════════════════════════════════════

def scrape_article(url: str) -> dict:
    """Download and parse an article. Returns {text, authors, keywords, html, top_image}."""
    result = {"text": "", "authors": [], "keywords": [], "html": "", "top_image": ""}
    try:
        art = Article(url)
        art.download()
        art.parse()
        result["text"] = art.text.strip()
        result["authors"] = art.authors
        result["html"] = art.html
        result["top_image"] = art.top_image or ""
        try:
            art.nlp()
            result["keywords"] = art.keywords
        except Exception:
            pass
    except Exception:
        pass
    return result


# ═══════════════════════════════════════════════════════════════════════════════
#  SINGLE SOURCE PROCESSOR
# ═══════════════════════════════════════════════════════════════════════════════

def _get_rss_feed(native_urls: list, gnews_domain: str) -> list:
    """Try native RSS first, then fallback to Google News search."""
    all_entries = []
    if native_urls:
        for rss_url in native_urls:
            try:
                feed = feedparser.parse(rss_url)
                if feed.entries:
                    log.info(f"  Native RSS OK: {rss_url} ({len(feed.entries)} entries)")
                    all_entries.extend(feed.entries[:MAX_ARTICLES_PER_SOURCE])
            except Exception:
                pass
        if all_entries:
            return all_entries

    # Fall back to Google News search
    encoded = urllib.parse.quote(f"site:{gnews_domain}")
    gnews_url = f"https://news.google.com/rss/search?q={encoded}&hl=en-IN&gl=IN&ceid=IN:en"
    feed = feedparser.parse(gnews_url)
    if feed.entries:
        log.info(f"  Google News fallback: {len(feed.entries)} entries")
    return feed.entries[:MAX_ARTICLES_PER_SOURCE]


def process_source(site: dict, existing_hashes: set) -> list:
    """
    Process a single news source. Returns list of article dicts ready for DB insertion.
    Articles with missing images are STILL included (imageUrl will be empty).
    """
    name = site["name"]
    # Provide a rough domain for the google news fallback if needed
    domain = urllib.parse.urlparse(site.get("rss_url", "")).netloc.replace("www.", "")
    if not domain:
        domain = name.replace(" ", "").lower() + ".com"

    native_urls = site.get("native_rss_feeds", [])

    log.info(f"Processing source: {name} (Native Feeds: {len(native_urls)})")
    
    entries = _get_rss_feed(native_urls, domain)
    if not entries:
        log.warning(f"  No RSS entries for {name}")
        return []

    articles = []
    for entry in entries:
        title = entry.get("title", "").strip()
        if not title:
            continue

        # Dedup by normalised title
        th = title_hash(title)
        if th in existing_hashes:
            continue
        existing_hashes.add(th)

        # Resolve URL — pass snippet for fallback extraction
        raw_url = entry.get("link", "")
        snippet_html = entry.get("summary", "")
        real_url = resolve_url(raw_url, snippet_html)

        # Skip scraping unresolved Google News URLs (JS-rendered, will fail)
        if "news.google.com" in real_url:
            scraped = {"text": "", "authors": [], "keywords": [], "html": "", "top_image": ""}
        else:
            scraped = scrape_article(real_url)

        # Extract image — try newspaper3k image first, then meta tag scrape
        image_url = ""
        np_img = scraped.get("top_image", "")
        if is_valid_image(np_img):
            image_url = np_img
        else:
            image_url = extract_image(scraped.get("html", ""))

        # If newspaper didn't get the image, try a direct fetch of the page meta tags
        if not image_url and "news.google.com" not in real_url:
            image_url = fetch_image_from_url(real_url)

        # Extract meta description
        meta_desc = ""
        if scraped.get("html"):
            soup = BeautifulSoup(scraped["html"], "html.parser")
            desc_tag = soup.find("meta", attrs={"name": "description"})
            if desc_tag:
                meta_desc = desc_tag.get("content", "")

        article = {
            "source_name":  name,
            "title":        title,
            "title_hash":   th,
            "url":          raw_url,
            "real_url":     real_url,
            "publishedAt":  entry.get("published", ""),
            "snippet":      entry.get("summary", ""),
            "summary_meta": meta_desc,
            "top_image":    image_url,
            "imageUrl":     image_url,
            "fullContent":  scraped.get("text", ""),
            "author":       ", ".join(scraped.get("authors", [])) or name,
            "tags":         scraped.get("keywords", []),
            "category":     "",     # will be set by categorizer
        }
        articles.append(article)
        status = "✓" if image_url else "⚠ no-img"
        log.info(f"  [{status}] {title[:55]}")

    return articles


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def run():
    log.info("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    sources_col = db[COL_SOURCES]
    articles_col = db[COL_RAW_ARTICLES]

    # Build set of existing title hashes for dedup
    existing_hashes = set()
    for doc in articles_col.find({}, {"title_hash": 1}):
        h = doc.get("title_hash")
        if h:
            existing_hashes.add(h)
    # Also hash existing titles that don't have title_hash yet
    for doc in articles_col.find({"title_hash": {"$exists": False}}, {"title": 1}):
        existing_hashes.add(title_hash(doc.get("title", "")))

    log.info(f"Existing articles (dedup set): {len(existing_hashes)}")

    sources = list(sources_col.find())
    log.info(f"Processing {len(sources)} sources with {FETCH_THREADS} threads...")

    all_articles = []

    # Process sources in parallel
    with ThreadPoolExecutor(max_workers=FETCH_THREADS) as pool:
        futures = {
            pool.submit(process_source, site, existing_hashes): site["name"]
            for site in sources
        }
        for future in as_completed(futures):
            name = futures[future]
            try:
                articles = future.result()
                all_articles.extend(articles)
            except Exception as e:
                log.error(f"Error processing {name}: {e}")

    # Bulk insert
    if all_articles:
        articles_col.insert_many(all_articles)
        log.info(f"\n✓ Inserted {len(all_articles)} new articles into {COL_RAW_ARTICLES}")
    else:
        log.info("No new articles found.")

    total = articles_col.count_documents({})
    with_img = articles_col.count_documents({"imageUrl": {"$ne": ""}})
    log.info(f"Total in {COL_RAW_ARTICLES}: {total} ({with_img} with images)")


if __name__ == "__main__":
    run()
