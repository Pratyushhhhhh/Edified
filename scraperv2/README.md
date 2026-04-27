# ScraperV2 — Advanced News Aggregation Pipeline

This directory contains the production-ready, asynchronous news scraping and processing pipeline (`v2`), entirely replacing the legacy Playwright-based system.

## Pipeline Architecture
The pipeline is designed as a series of modular stages orchestrated by `orchestrator.py`. All data is temporarily stored in `test_v2` and clustered into `cluster_test_v2`.

### Core Files
1. **`orchestrator.py`**
   - The master controller. Runs the full pipeline sequentially.
   - Can be run once (`python orchestrator.py`) or on a 2-hour loop (`python orchestrator.py --loop`).
   - Supports running single stages via `--stage <name>`.

2. **`collector_cron.py`**
   - A standalone daemon that runs exclusively the `collector` stage every 30 minutes.
   - Used to aggressively fetch breaking news articles without waiting for the heavier AI processing stages.

3. **`config.py`**
   - Centralized configuration (MongoDB URIs, API keys, Model endpoints, thresholds).

### Pipeline Stages
1. **`collector.py`** (Stage 1)
   - Fetches articles from sources. We bypass Google News blocks by heavily relying on **Native Direct RSS Feeds** (over 30 sources explicitly mapped).
   - Downloads HTML, extracts full text, and extracts high-quality `top_image`.
   - Includes robust `title_hash` deduplication to prevent flooding the database.

2. **`categorizer.py`** (Stage 2)
   - Assigns a primary category (Politics, Tech, Health, etc.) based on keyword heuristics and content analysis.

3. **`clusterer.py`** (Stage 3)
   - The engine of the aggregator. Uses `sentence-transformers` and `HDBSCAN` to semantically group articles covering the same event into a single "Cluster".
   - **Key Features:** Uses Cosine Distance for high accuracy. Generates gorgeous **Dynamic Branded Placeholders** (e.g., a dark blue image with the word "Reuters") if a real image fails to load. Strips out duplicate articles within the same cluster. Tracks cluster size (`articleCount`) for frontend sorting.

4. **`summarizer.py`** (Stage 4)
   - Generates 3 strictly factual bullet points for every cluster.
   - **Key Features:** Language-aware. Uses `BART` for English news and seamlessly falls back to `Qwen2.5-72B` for Hindi/regional news.
   - *Note: Configured to support parallel multi-token execution to bypass Hugging Face rate limits.*

5. **`bias_analyzer.py`** (Stage 5)
   - Runs `bucketresearch/politicalBiasBERT` to evaluate the political leaning of every article (Left to Right) and calculates a bias distribution for the overall cluster.

### Diagnostic Tools
- **`_diagnose.py`**: High-level comparison between the legacy `v1` and the new `v2` pipeline performance.
- **`_diagnose_cluster.py`**: Specialized script that calculates exactly what percentage of articles and clusters successfully retrieved real thumbnail images.
- **`_check_dups.py`**: Utility to scan the MongoDB collections for duplicate titles.

## Major Enhancements Over Legacy Pipeline
* **Speed:** Eliminated headless Playwright browsers, reducing fetch times drastically.
* **Image Success Rate:** Transitioned from Google News redirect scraping to direct RSS feeds, jumping our valid image extraction rate from ~20% to **>67%**.
* **Hotlink Bypassing:** Added `no-referrer` tags to the React frontend so news sites (like BBC/Al Jazeera) can no longer block their images from rendering on our site.
* **Smart Placeholders:** Failed images no longer show broken icons; they display a sleek, text-branded placeholder matching the news organization's name.
* **Intelligent UI Sorting:** Clusters are now sorted natively by their `articleCount` size, ensuring the biggest breaking news stories automatically rise to the top of the feed.
