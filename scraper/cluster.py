import feedparser
import json
import urllib.parse
import requests
from newspaper import Article
from bs4 import BeautifulSoup
from pymongo import MongoClient

CONNECTION_STRING = "mongodb+srv://pratyushbansal05_db_user:edi123@newscluster0.jenvf5c.mongodb.net/?retryWrites=true&w=majority"

INVALID_IMAGE_DOMAINS = [
    "lh3.googleusercontent.com",
    "news.google.com",
    "google.com/s2",
]

def is_valid_image(url: str) -> bool:
    """Returns True only if the URL is a real article image (not a Google placeholder)."""
    if not url or not url.startswith("http"):
        return False
    for bad_domain in INVALID_IMAGE_DOMAINS:
        if bad_domain in url:
            return False
    return True

def extract_image_from_meta(html: str) -> str:
    """
    Scrape OG / Twitter card image from raw HTML.
    This is the most reliable fallback when newspaper3k gives us a Google image.
    """
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")

    # Priority order: og:image > twitter:image > rel=image_src
    for prop in ["og:image", "og:image:url", "twitter:image", "twitter:image:src"]:
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if tag:
            content = tag.get("content", "").strip()
            if is_valid_image(content):
                return content

    # <link rel="image_src" href="...">
    link_tag = soup.find("link", rel="image_src")
    if link_tag and is_valid_image(link_tag.get("href", "")):
        return link_tag["href"].strip()

    return ""

def resolve_google_news_url(google_url: str) -> str:
    """
    Google News RSS entries link to a redirect page, not the real article.
    Follow redirects to get the canonical URL so newspaper3k can scrape it properly.
    """
    if "news.google.com" not in google_url:
        return google_url
    try:
        resp = requests.get(
            google_url,
            timeout=10,
            allow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)"},
        )
        # After redirects the final URL is the real article
        final_url = resp.url
        # Sometimes Google wraps it further; the canonical <link> in the HTML is most reliable
        soup = BeautifulSoup(resp.text, "html.parser")
        canonical = soup.find("link", rel="canonical")
        if canonical and canonical.get("href", "").startswith("http"):
            return canonical["href"]
        return final_url
    except Exception as e:
        print(f"  Could not resolve redirect for {google_url}: {e}")
        return google_url  # fall back to original

def fetch_and_push_to_mongo():
    try:
        client = MongoClient(CONNECTION_STRING)
        db = client["news_aggregator"]
        sources_col = db["sources"]
        news_data_col = db["raw_news_data"]

        sources = list(sources_col.find())
        print(f"Found {len(sources)} sources in database.")

        for site in sources:
            name = site["name"]
            domain = site.get("rss_url")
            cat = site.get("category")

            if not domain:
                print(f"Skipping {name}: No domain found.")
                continue

            print(f"\n--- Scraping: {name} ---")

            encoded_query = urllib.parse.quote(f"site:{domain}")
            rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"
            feed = feedparser.parse(rss_url)

            for entry in feed.entries[:5]:
                if news_data_col.find_one({"url": entry.link}):
                    print(f"  Skipping (exists): {entry.title[:50]}...")
                    continue

                article_data = {
                    "source_name": name,
                    "title": entry.title,
                    "url": entry.link,
                    "publishedAt": entry.get("published", "N/A"),
                    "biasScore": site.get("biasScore", 0),
                    "biasLabel": site.get("biasLabel", "unrated"),
                    "snippet": entry.get("summary", ""),
                    "fullContent": "",
                    "top_image": "",         # will be filled below
                    "imageUrl": "",          # canonical image field
                    "summary_meta": "",
                    "author": "",
                    "category": (
                        entry.tags[0].term
                        if hasattr(entry, "tags") and entry.tags
                        else cat
                    ),
                    "tags": [],
                }

                try:
                    # --- Step 1: resolve the real URL if it's a Google News redirect ---
                    real_url = resolve_google_news_url(entry.link)

                    # --- Step 2: scrape with newspaper3k ---
                    news_article = Article(real_url)
                    news_article.download()
                    news_article.parse()
                    news_article.nlp()

                    article_data["fullContent"] = news_article.text
                    article_data["author"] = (
                        ", ".join(news_article.authors) if news_article.authors else name
                    )
                    article_data["tags"] = news_article.keywords

                    # --- Step 3: validate newspaper3k's image pick ---
                    np_image = news_article.top_image or ""
                    if is_valid_image(np_image):
                        article_data["top_image"] = np_image
                        article_data["imageUrl"] = np_image
                    else:
                        # --- Step 4: fall back to meta tags ---
                        meta_image = extract_image_from_meta(news_article.html)
                        article_data["top_image"] = meta_image
                        article_data["imageUrl"] = meta_image
                        if meta_image:
                            print(f"  Used meta-tag image for: {entry.title[:40]}...")
                        else:
                            print(f"  No valid image found for: {entry.title[:40]}...")

                    # --- Step 5: meta description ---
                    soup = BeautifulSoup(news_article.html, "html.parser")
                    meta_desc = soup.find("meta", attrs={"name": "description"})
                    article_data["summary_meta"] = (
                        meta_desc["content"] if meta_desc else ""
                    )

                    news_data_col.insert_one(article_data)
                    print(f"  Saved: {entry.title[:50]}...")

                except Exception as e:
                    print(f"  Error scraping {entry.link}: {e}")

    except Exception as e:
        print(f"Database Connection Error: {e}")

if __name__ == "__main__":
    fetch_and_push_to_mongo()