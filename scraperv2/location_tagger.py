import re
import argparse
from pymongo import MongoClient, UpdateOne

from config import log, MONGO_URI, DB_NAME, COL_RAW_ARTICLES, COL_CLUSTERS


# ─────────────────────────────────────────────────────────────────────────────
#  LOCATION RULES — title-only, strict word-boundary matching
#  Format: (canonical_name, [patterns_to_match_in_title])
# ─────────────────────────────────────────────────────────────────────────────

LOCATION_RULES = [
    (
        "Delhi",
        [
            r"\bdelhi\b",
            r"\bnew delhi\b",
            r"\bndmc\b",
            r"\baap\b",           # Aam Aadmi Party — almost always Delhi politics
            r"\bkejriwal\b",
        ],
    ),
    (
        "Uttar Pradesh",
        [
            r"\buttar pradesh\b",
            r"\b(?:up)\b(?=\s+(?:government|govt|cm|chief minister|election|police|bypolls?))",
            r"\blucknow\b",
            r"\byogi\b",
            r"\badityanath\b",
            r"\bvaranasi\b",
            r"\bprayagraj\b",
            r"\ballahabad\b",
            r"\bnoida\b",
            r"\bkanpur\b",
            r"\bagra\b",
            r"\bmeerut\b",
        ],
    ),
    (
        "Uttarakhand",
        [
            r"\buttarakhand\b",
            r"\bdehradun\b",
            r"\bharidwar\b",
            r"\brishikesh\b",
            r"\bkedarnath\b",
            r"\bbadrinath\b",
            r"\bchar dham\b",
        ],
    ),
    (
        "Manipur",
        [
            r"\bmanipuir\b",   # common OCR typo
            r"\bmanipuri?\b",
            r"\bimphal\b",
            r"\bmeitei\b",
            r"\bkuki\b",
        ],
    ),
    (
        "Maharashtra",
        [
            r"\bmaharashtra\b",
            r"\bmumbai\b",
            r"\bbombay\b",
            r"\bpune\b",
            r"\bnagpur\b",
            r"\bnashik\b",
            r"\baurangabad\b",
            r"\bthane\b",
            r"\bmvp\b",         # Maha Vikas Aghadi abbreviation
            r"\bshiv sena\b",
            r"\bncp\b",
            r"\buddhav\b",
            r"\bfadnavis\b",
        ],
    ),
    (
        "West Bengal",
        [
            r"\bwest bengal\b",
            r"\bkolkata\b",
            r"\bcalcutta\b",
            r"\bdarjeeling\b",
            r"\bmamata\b",
            r"\bbanerjee\b(?=.*(?:tmc|chief minister|cm|kolkata|bengal))",
            r"\btmc\b",
            r"\btrinamool\b",
        ],
    ),
    (
        "Kerala",
        [
            r"\bkerala\b",
            r"\bthiruvananthapuram\b",
            r"\btrivandrum\b",
            r"\bkochi\b",
            r"\bcochin\b",
            r"\bkozhikode\b",
            r"\bcalicut\b",
            r"\bthrissur\b",
            r"\bldf\b",
            r"\budf\b",
            r"\bpinarayi\b",
        ],
    ),
    (
        "Punjab",
        [
            r"\bpunjab\b",
            r"\bamritsar\b",
            r"\bludhiana\b",
            r"\bchandigarh\b",
            r"\bbhagwant\b",
            r"\bmann\b(?=.*(?:punjab|cm|chief minister|aap))",
            r"\bgolden temple\b",
            r"\bwahga\b",
            r"\battari\b",
        ],
    ),
]

# Pre-compile all patterns (case-insensitive)
_COMPILED_RULES: list[tuple[str, list]] = []
for canonical, patterns in LOCATION_RULES:
    compiled = [re.compile(p, re.IGNORECASE) for p in patterns]
    _COMPILED_RULES.append((canonical, compiled))


# ─────────────────────────────────────────────────────────────────────────────
#  CORE FUNCTION
# ─────────────────────────────────────────────────────────────────────────────

def tag_title(title: str) -> list[str]:
    """
    Return sorted list of matched canonical state names found in the title string.
    Only the title is checked — no content, no snippets.
    """
    if not title:
        return []
    found = []
    for canonical, patterns in _COMPILED_RULES:
        if any(p.search(title) for p in patterns):
            found.append(canonical)
    return sorted(set(found))


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────────────────────────

def run(dry_run: bool = False, reset: bool = False):
    log.info(f"=== Location Tagger (title-only) {'[DRY RUN]' if dry_run else ''} ===")

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    articles_col = db[COL_RAW_ARTICLES]
    clusters_col = db[COL_CLUSTERS]

    if reset and not dry_run:
        log.info("Resetting all location tags...")
        articles_col.update_many({}, {"$set": {"locations": []}})
        clusters_col.update_many({}, {"$set": {"locations": []}})
        log.info("  ✓ All location tags cleared")

    # ── 1. Tag raw articles (title only + category check) ────────────────────
    log.info(f"Scanning article titles in {COL_RAW_ARTICLES}...")
    articles = list(articles_col.find({}, {"_id": 1, "title": 1, "category": 1}))
    log.info(f"  {len(articles)} articles loaded")

    article_ops = []
    article_counts: dict[str, int] = {}
    tagged_articles = 0

    for art in articles:
        title = art.get("title", "")
        category = art.get("category", "").lower()
        
        locs = tag_title(title)
        
        if category and category != "world":
            locs.append("All India")
            locs = sorted(set(locs))
            
        if locs:
            tagged_articles += 1
            for l in locs:
                article_counts[l] = article_counts.get(l, 0) + 1
        article_ops.append(UpdateOne(
            {"_id": art["_id"]},
            {"$set": {"locations": locs}}
        ))

    log.info(f"  Articles tagged: {tagged_articles} / {len(articles)}")

    if not dry_run and article_ops:
        result = articles_col.bulk_write(article_ops)
        log.info(f"  ✓ Updated {result.modified_count} article documents")

    # ── 2. Tag clusters (cluster headline title only + category check) ───────
    log.info(f"Scanning cluster headlines in {COL_CLUSTERS}...")
    clusters = list(clusters_col.find({}, {"_id": 1, "headline": 1, "generatedHeadline": 1, "category": 1}))
    log.info(f"  {len(clusters)} clusters loaded")

    cluster_ops = []
    cluster_counts: dict[str, int] = {}
    tagged_clusters = 0

    for cluster in clusters:
        # Prefer the AI-generated headline if available, else use the lead article title
        title = cluster.get("generatedHeadline", "") or cluster.get("headline", "")
        category = cluster.get("category", "").lower()
        
        locs = tag_title(title)
        
        if category and category != "world":
            locs.append("All India")
            locs = sorted(set(locs))
            
        if locs:
            tagged_clusters += 1
            for l in locs:
                cluster_counts[l] = cluster_counts.get(l, 0) + 1
        cluster_ops.append(UpdateOne(
            {"_id": cluster["_id"]},
            {"$set": {"locations": locs}}
        ))

    log.info(f"  Clusters tagged: {tagged_clusters} / {len(clusters)}")

    if not dry_run and cluster_ops:
        result = clusters_col.bulk_write(cluster_ops)
        log.info(f"  ✓ Updated {result.modified_count} cluster documents")

    # ── 3. Stats ──────────────────────────────────────────────────────────────
    log.info("\n── Article hits by state ──")
    for state, count in sorted(article_counts.items(), key=lambda x: -x[1]):
        log.info(f"  {state:<20} {count:>4} articles")

    log.info("\n── Cluster hits by state ──")
    for state, count in sorted(cluster_counts.items(), key=lambda x: -x[1]):
        log.info(f"  {state:<20} {count:>4} clusters")

    if dry_run:
        log.info("\n[DRY RUN] No changes written to MongoDB.")

    log.info("Done.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Title-only location tagger for Indian states")
    parser.add_argument("--dry-run", action="store_true", help="Show counts only, don't write to DB")
    parser.add_argument("--reset", action="store_true", help="Clear all location tags before re-tagging")
    args = parser.parse_args()
    run(dry_run=args.dry_run, reset=args.reset)
