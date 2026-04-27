import re
import json
import base64
import urllib.parse
import requests
import feedparser
from bs4 import BeautifulSoup
from pymongo import MongoClient
from playwright.sync_api import sync_playwright
import warnings
from bs4 import XMLParsedAsHTMLWarning

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

CONNECTION_STRING = "mongodb+srv://pratyushbansal05_db_user:edi123@newscluster0.jenvf5c.mongodb.net/?retryWrites=true&w=majority"

BAD_IMAGE_SIGNALS = [
    "lh3.googleusercontent.com",
    "news.google.com",
    "gstatic.com",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept-Language": "en-US,en;q=0.9",
}

# -------------------------------
# 🔹 CATEGORY CLASSIFIER (NEW)
# -------------------------------
def classify_category(text: str) -> str:
    text = text.lower()

    if any(k in text for k in ["election", "government", "minister", "bjp", "congress", "policy"]):
        return "Politics"

    if any(k in text for k in ["stock", "market", "economy", "business", "company", "profit"]):
        return "Business"

    if any(k in text for k in ["ai", "technology", "tech", "software", "google", "microsoft"]):
        return "Technology"

    if any(k in text for k in ["research", "science", "study", "nasa", "experiment"]):
        return "Science"

    if any(k in text for k in ["health", "disease", "covid", "hospital", "medical"]):
        return "Health"

    if any(k in text for k in ["usa", "china", "iran", "israel", "world", "international"]):
        return "World"

    return "General"

# -------------------------------
# 🔹 Decode Google News URL
# -------------------------------
def decode_google_news_url(google_url: str) -> str:
    try:
        match = re.search(r'/articles/([A-Za-z0-9_-]+)', google_url)
        if not match:
            return ""

        article_id = match.group(1)
        padding = 4 - len(article_id) % 4
        if padding != 4:
            article_id += '=' * padding

        decoded = base64.urlsafe_b64decode(article_id)
        urls = re.findall(rb'https://[^\x00-\x1f\x7f-\xff ]{10,}', decoded)

        for url_bytes in urls:
            url = url_bytes.decode('utf-8', errors='ignore').rstrip('\\')
            if 'google.com' not in url:
                return url
    except:
        pass
    return ""

# -------------------------------
# 🔹 Playwright fallback
# -------------------------------
def resolve_with_browser(google_url: str) -> str:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            page.goto(google_url, timeout=15000)
            page.wait_for_timeout(3000)

            final_url = page.url
            browser.close()

            if "news.google.com" not in final_url:
                return final_url
    except Exception as e:
        print(f"  Browser resolve failed: {e}")

    return ""

# -------------------------------
# 🔹 Image Validation
# -------------------------------
def is_valid_image(url: str) -> bool:
    if not url or not url.startswith("http"):
        return False
    return not any(bad in url for bad in BAD_IMAGE_SIGNALS)

# -------------------------------
# 🔹 Extract Image
# -------------------------------
def fetch_image_from_url(url: str) -> str:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code != 200:
            return ""

        soup = BeautifulSoup(resp.text, "lxml")

        tag = soup.find("meta", property="og:image")
        if tag:
            img = tag.get("content", "")
            if is_valid_image(img):
                return img

        tag = soup.find("meta", attrs={"name": "twitter:image"})
        if tag:
            img = tag.get("content", "")
            if is_valid_image(img):
                return img

        for img_tag in soup.find_all("img"):
            src = img_tag.get("src", "")
            if src.startswith("http") and len(src) > 100:
                return src

    except:
        pass

    return ""

# -------------------------------
# 🔹 Main Pipeline
# -------------------------------
def fetch_and_push_to_mongo():
    client = MongoClient(CONNECTION_STRING)
    db = client["news_aggregator"]
    sources_col = db["sources"]
    news_col = db["raw_news_data"]

    sources = list(sources_col.find())
    print(f"Found {len(sources)} sources")

    saved, skipped = 0, 0

    for site in sources:
        name = site["name"]
        domain = site.get("rss_url")

        if not domain:
            continue

        print(f"\n--- {name} ---")

        encoded_query = urllib.parse.quote(f"site:{domain}")
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"

        feed = feedparser.parse(rss_url)

        for entry in feed.entries[:5]:

            if news_col.find_one({"url": entry.link}):
                print("  Exists:", entry.title[:50])
                continue

            # STEP 1: URL resolve
            real_url = decode_google_news_url(entry.link)

            if not real_url:
                print("  Trying browser fallback...")
                real_url = resolve_with_browser(entry.link)

            if not real_url:
                print("  SKIP (no URL)")
                skipped += 1
                continue

            # STEP 2: CATEGORY (NEW 🔥)
            text_for_category = entry.title + " " + entry.get("summary", "")
            category = classify_category(text_for_category)

            # STEP 3: IMAGE
            image = fetch_image_from_url(real_url)
            if not image:
                print("  SKIP (no image)")
                skipped += 1
                continue

            article = {
                "source_name": name,
                "title": entry.title,
                "url": entry.link,
                "real_url": real_url,
                "publishedAt": entry.get("published", ""),
                "snippet": entry.get("summary", ""),
                "top_image": image,
                "category": category,  # 🔥 HERE
                "fullContent": "",
                "author": "",
                "tags": [],
            }

            # STEP 4: CONTENT
            try:
                from newspaper import Article
                art = Article(real_url)
                art.download()
                art.parse()

                try:
                    art.nlp()
                except:
                    pass

                article["fullContent"] = art.text
                article["author"] = ", ".join(art.authors) if art.authors else name
                article["tags"] = getattr(art, "keywords", [])

            except Exception as e:
                print("  Content error:", e)

            news_col.insert_one(article)
            print(f"  Saved ({category}):", entry.title[:50])
            saved += 1

    print(f"\nSaved: {saved} | Skipped: {skipped}")


if __name__ == "__main__":
    fetch_and_push_to_mongo()