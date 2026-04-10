"""
update_categories.py
--------------------
Re-classify existing articles in MongoDB and update category field
(STRICT + IMPROVED VERSION)
"""

from pymongo import MongoClient
import re

CONNECTION_STRING = "mongodb+srv://pratyushbansal05_db_user:edi123@newscluster0.jenvf5c.mongodb.net/?retryWrites=true&w=majority"

# -------------------------------
# 🔹 Compile regex once (FASTER)
# -------------------------------
def compile_keywords(keywords):
    return [re.compile(rf"\b{k}\b") for k in keywords]

def contains_word(text, patterns):
    return any(p.search(text) for p in patterns)

# -------------------------------
# 🔹 KEYWORDS (STRONG SET)
# -------------------------------
POLITICS_KW = compile_keywords([
    "bjp", "congress", "tmc", "aap", "nda", "upa",
    "election", "vote", "voter", "poll", "assembly",
    "parliament", "minister", "government", "policy",
    "rahul gandhi", "modi", "shehbaz", "pm", "cm",
    "vidhan sabha", "lok sabha", "rajya sabha"
])

WORLD_KW = compile_keywords([
    "usa", "us", "china", "iran", "israel", "pakistan",
    "russia", "ukraine", "global", "international",
    "un", "nato", "ceasefire", "war", "military",
    "foreign", "diplomatic"
])

BUSINESS_KW = compile_keywords([
    "stock", "market", "economy", "business", "company",
    "startup", "funding", "profit", "loss", "shares",
    "ipo", "investment", "bank", "finance", "revenue"
])

SCIENCE_KW = compile_keywords([
    "research", "study", "scientist", "science",
    "experiment", "nasa", "space", "physics", "biology"
])

HEALTH_KW = compile_keywords([
    "health", "disease", "covid", "hospital",
    "doctor", "medical", "treatment", "vaccine"
])

TECH_KW = compile_keywords([
    "technology", "software", "hardware",
    "ai", "artificial intelligence",
    "machine learning", "app", "application",
    "google", "microsoft", "apple", "meta", "openai"
])

# -------------------------------
# 🔹 CLASSIFIER (STRICT + PRIORITY)
# -------------------------------
def classify_category(text: str) -> str:
    text = text.lower()

    # skip junk / very short text
    if len(text.split()) < 5:
        return "General"

    if contains_word(text, POLITICS_KW):
        return "Politics"

    if contains_word(text, WORLD_KW):
        return "World"

    if contains_word(text, BUSINESS_KW):
        return "Business"

    if contains_word(text, SCIENCE_KW):
        return "Science"

    if contains_word(text, HEALTH_KW):
        return "Health"

    if contains_word(text, TECH_KW):
        return "Technology"

    return "General"

# -------------------------------
# 🔹 MAIN SCRIPT
# -------------------------------
def update_categories():
    client = MongoClient(CONNECTION_STRING)
    db = client["news_aggregator"]
    news_col = db["raw_news_data"]

    total = news_col.count_documents({})
    print(f"Total articles: {total}")

    updated = 0

    for article in news_col.find():
        title = article.get("title", "")
        snippet = article.get("snippet", "")
        content = article.get("fullContent", "")

        # 🔥 better classification using content too
        text = f"{title} {snippet} {content[:1000]}"

        new_category = classify_category(text)

        if article.get("category") != new_category:
            news_col.update_one(
                {"_id": article["_id"]},
                {"$set": {"category": new_category}}
            )
            print(f"Updated → {new_category}: {title[:60]}")
            updated += 1

    print(f"\nUpdated {updated} articles")


if __name__ == "__main__":
    update_categories()