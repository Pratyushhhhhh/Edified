import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient

c = MongoClient('mongodb+srv://pratyushbansal05_db_user:edi123@newscluster0.jenvf5c.mongodb.net/?retryWrites=true&w=majority')
db = c['news_aggregator']
sources_col = db['sources']

NATIVE_RSS = {
    "thehindu.com":        ["https://www.thehindu.com/feeder/default.rss", "https://www.thehindu.com/rssfeeds/"],
    "indianexpress.com":   ["https://indianexpress.com/section/india/feed/", "https://indianexpress.com/section/world/feed/", "https://indianexpress.com/section/technology/feed/", "https://indianexpress.com/section/sports/feed/", "https://indianexpress.com/section/technology/science/feed/", "https://indianexpress.com/section/research/feed/", "https://indianexpress.com/section/pakistan/feed/", "https://indianexpress.com/section/news-today/feed/", "https://indianexpress.com/elections/feed/", "https://indianexpress.com/section/technology/artificial-intelligence/feed/", "https://indianexpress.com/section/politics/feed/", "http://indianexpress.com/print/front-page/feed/", "https://indianexpress.com/syndication/"],
    "ndtv.com":            ["https://feeds.feedburner.com/ndtvnews-top-stories", "https://www.ndtv.com/rss", "http://feeds.feedburner.com/ndtvnews-world-news"],
    "hindustantimes.com":  ["https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml"],
    "livemint.com":        ["https://www.livemint.com/rss/news"],
    "theguardian.com":     ["https://www.theguardian.com/world/rss", "https://www.theguardian.com/world/india/rss"],
    "bbc.com":             ["https://feeds.bbci.co.uk/news/rss.xml", "http://feeds.bbci.co.uk/news/world/asia/india/rss.xml", "http://feeds.bbci.co.uk/news/world/rss.xml", "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml"],
    "aljazeera.com":       ["https://www.aljazeera.com/xml/rss/all.xml"],
    "reuters.com":         ["https://www.reutersagency.com/feed/"],
    "scroll.in":           ["https://scroll.in/rss/feed", "http://feeds.feedburner.com/ScrollinArticles.rss"],
    "thewire.in":          ["https://thewire.in/rss", "https://science.thewire.in/feed/"],
    "thequint.com":        ["https://www.thequint.com/quintlab/rss-feeds/the-quint-rss-feed.xml"],
    "nytimes.com":         ["https://rss.nytimes.com/services/xml/rss/nyt/World.xml"],
    "dw.com":              ["https://rss.dw.com/rdf/rss-en-all"],
    "france24.com":        ["https://www.france24.com/en/rss"],
    "economist.com":       ["https://www.economist.com/the-world-this-week/rss.xml"],
    "wsj.com":             ["https://feeds.a.dj.com/rss/RSSWorldNews.xml"],
    "aajtak.in":           ["https://www.aajtak.in/rssfeeds/?id=home"],
    "amarujala.com":       ["https://www.amarujala.com/rss/breaking-news.xml"],
    "indiatimes.com":      ["https://timesofindia.indiatimes.com/rssfeedstopstories.cms", "https://timesofindia.indiatimes.com/rss.cms", "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms"],
    "abplive.com":         ["https://news.abplive.com/home/feed"],
    "zeenews.india.com":   ["https://zeenews.india.com/rss/india-national-news.xml"],
    "indiatvnews.com":     ["https://www.indiatvnews.com/rssfeed/topstory.xml"],
    "altnews.in":          ["https://www.altnews.in/feed/"],
    "apnews.com":          ["https://feedx.net/rss/ap.xml"],
    "business-standard.com":["https://www.business-standard.com/rss/home_page_top_stories.rss"],
    "firstpost.com":       ["https://www.firstpost.com/rss/india.xml", "https://www.firstpost.com/rss"],
    "outlookindia.com":    ["https://www.outlookindia.com/rss/main/magazine", "https://www.outlookindia.com/rssfeed"],
    "freepressjournal.in": ["https://www.freepressjournal.in/stories.rss"],
    "theprint.in":         ["https://theprint.in/feed/"],
    "uniindia.com":        ["https://www.uniindia.com/feed.aspx?lang_id=1"],
    "csmonitor.com":       ["https://rss.csmonitor.com/feeds/all"],
    "bloomberg.com":       ["https://feeds.bloomberg.com/politics/news.rss", "https://feeds.bloomberg.com/technology/news.rss"],
    "bhaskar.com":         ["https://www.bhaskar.com/rss-v1--category-1125.xml", "https://www.bhaskar.com/rss-v1--category-1061.xml"],
}

# Exact mapping
MAPPING = {
    "The Hindu": "thehindu.com",
    "Indian Express": "indianexpress.com",
    "NDTV": "ndtv.com",
    "Hindustan Times": "hindustantimes.com",
    "LiveMint": "livemint.com",
    "The Guardian": "theguardian.com",
    "BBC News": "bbc.com",
    "Al Jazeera": "aljazeera.com",
    "Reuters": "reuters.com",
    "Scroll.in": "scroll.in",
    "The Wire": "thewire.in",
    "The Quint": "thequint.com",
    "The New York Times": "nytimes.com",
    "Deutsche Welle": "dw.com",
    "France 24": "france24.com",
    "The Economist": "economist.com",
    "Wall Street Journal": "wsj.com",
    "Aaj Tak": "aajtak.in",
    "Amar Ujala": "amarujala.com",
    "Times of India": "indiatimes.com",
    "ABP News": "abplive.com",
    "Zee News": "zeenews.india.com",
    "India TV": "indiatvnews.com",
    "Alt News": "altnews.in",
    "Associated Press": "apnews.com",
    "Business Standard": "business-standard.com",
    "Dainik Bhaskar": "bhaskar.com",
    "Christian Science Monitor": "csmonitor.com",
    "Bloomberg": "bloomberg.com",
    "United News of India": "uniindia.com",
}

sources = list(sources_col.find({}))
updated_count = 0

for s in sources:
    name = s['name']
    domain_key = MAPPING.get(name)
    
    feeds = []
    if domain_key:
        feeds = NATIVE_RSS.get(domain_key, [])
        
    sources_col.update_one({'_id': s['_id']}, {'$set': {'native_rss_feeds': feeds}})
    updated_count += 1
    print(f"Set {len(feeds)} feeds for {name}")

print(f"\nMigration complete. Re-updated {updated_count} sources correctly.")
