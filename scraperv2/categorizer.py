import re
from pymongo import MongoClient
from config import log, MONGO_URI, DB_NAME, COL_RAW_ARTICLES


CATEGORY_RULES = [
    ("Politics", [
        "election", "vote", "voter", "poll", "assembly", "parliament",
        "minister", "government", "legislation", "cabinet", "opposition",
        "party", "coalition", "bjp", "congress", "tmc", "aap", "nda", "upa",
        "modi", "rahul gandhi", "amit shah", "kejriwal",
        "lok sabha", "rajya sabha", "vidhan sabha",
        # Hindi
        "चुनाव", "सरकार", "मंत्री", "पार्टी", "विधानसभा", "संसद",
        "भाजपा", "कांग्रेस", "राजनीति",
    ], 1.0),

    ("World", [
        "international", "global", "foreign", "diplomatic", "embassy",
        "united nations", "nato", "ceasefire", "war", "conflict",
        "treaty", "sanctions", "refugee",
        "usa", "china", "iran", "israel", "pakistan", "russia", "ukraine",
        "japan", "australia", "germany", "france", "turkey",
        "trump", "biden", "putin", "xi jinping", "netanyahu", "zelensky",
        # Hindi
        "अंतरराष्ट्रीय", "युद्ध", "विदेश",
    ], 1.0),

    ("Business", [
        "stock", "market", "economy", "economic", "business",
        "company", "startup", "funding", "profit", "loss", "revenue",
        "shares", "ipo", "investment", "banking", "finance", "gdp",
        "inflation", "rbi", "sebi", "nifty", "sensex", "rupee",
        "budget", "fiscal", "trade", "export", "import",
        # Hindi
        "बाजार", "अर्थव्यवस्था", "कारोबार", "शेयर", "बजट",
    ], 1.0),

    ("Technology", [
        "technology", "software", "hardware", "app", "application",
        "artificial intelligence", "machine learning", "deep learning",
        "startup", "semiconductor", "chip", "cybersecurity",
        "google", "microsoft", "apple", "meta", "openai", "chatgpt",
        "samsung", "nvidia", "tesla", "spacex",
        "smartphone", "iphone", "android", "internet", "5g",
        # Hindi
        "तकनीक", "सॉफ्टवेयर",
    ], 1.0),

    ("Science", [
        "research", "study", "scientist", "science", "discovery",
        "experiment", "nasa", "isro", "space", "physics", "biology",
        "chemistry", "astronomy", "climate", "environment", "fossil",
        "genome", "quantum", "satellite", "mars", "moon",
        # Hindi
        "विज्ञान", "अनुसंधान", "अंतरिक्ष",
    ], 1.0),

    ("Health", [
        "health", "disease", "hospital", "doctor", "medical",
        "treatment", "vaccine", "virus", "pandemic", "covid",
        "surgery", "mental health", "cancer", "diabetes", "who",
        "pharmaceutical", "drug", "therapy", "fitness",
        # Hindi
        "स्वास्थ्य", "अस्पताल", "बीमारी", "इलाज",
    ], 1.0),

    ("Sports", [
        "cricket", "football", "soccer", "tennis", "hockey",
        "ipl", "t20", "odi", "test match", "world cup",
        "premier league", "champions league", "olympics",
        "match", "tournament", "champion", "medal", "player",
        "innings", "wicket", "goal", "trophy", "stadium",
        "kohli", "rohit sharma", "dhoni",
        # Hindi
        "क्रिकेट", "फुटबॉल", "खेल", "मैच", "विश्व कप",
    ], 1.2),  # slightly higher weight because sports keywords are very specific

    ("Entertainment", [
        "bollywood", "hollywood", "movie", "film", "actor", "actress",
        "director", "series", "netflix", "streaming", "music",
        "album", "celebrity", "box office", "award", "oscar",
        "grammy", "emmy", "concert", "festival",
        # Hindi
        "बॉलीवुड", "फिल्म", "अभिनेता", "गाना", "सिनेमा",
    ], 1.1),
]

# Pre-compile patterns for speed
_COMPILED_RULES = []
for cat, keywords, weight in CATEGORY_RULES:
    patterns = [re.compile(rf"\b{re.escape(k)}\b", re.IGNORECASE) for k in keywords]
    _COMPILED_RULES.append((cat, patterns, weight))


# ═══════════════════════════════════════════════════════════════════════════════
#  CLASSIFIER
# ═══════════════════════════════════════════════════════════════════════════════

def classify(text: str) -> str:
    """
    Score-based category classification.
    Returns the category with the highest weighted match count.
    Falls back to 'General' if no matches.
    """
    if not text or len(text.split()) < 3:
        return "General"

    scores = {}
    for cat, patterns, weight in _COMPILED_RULES:
        count = sum(1 for p in patterns if p.search(text))
        if count > 0:
            scores[cat] = count * weight

    if not scores:
        return "General"

    return max(scores, key=scores.get)


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN — update articles in test_v2
# ═══════════════════════════════════════════════════════════════════════════════

def run():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    col = db[COL_RAW_ARTICLES]

    total = col.count_documents({})
    log.info(f"Categorizing {total} articles in {COL_RAW_ARTICLES}...")

    updated = 0
    for article in col.find():
        title   = article.get("title", "")
        snippet = article.get("snippet", "")
        content = article.get("fullContent", "")[:500]

        text = f"{title} {snippet} {content}"
        new_cat = classify(text)

        if article.get("category") != new_cat:
            col.update_one(
                {"_id": article["_id"]},
                {"$set": {"category": new_cat}},
            )
            updated += 1

    log.info(f"✓ Updated {updated}/{total} article categories")


if __name__ == "__main__":
    run()
