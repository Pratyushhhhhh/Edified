# The Edified

> *"True journalism is printing what someone else does not want printed; everything else is public relations."* — George Orwell

A production-grade news aggregation and contrast platform. **The Edified** semantically clusters articles from 30+ global outlets covering the same story, generates factual AI summaries, scores political bias on every article, and surfaces "blindspot" stories that mainstream media under-covers.

![Stack](https://img.shields.io/badge/Stack-React%2019%20%2B%20Node.js%20%2B%20MongoDB-blue?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Groq%20%2B%20Gemini%20%2B%20BERT-orange?style=for-the-badge)
![Python](https://img.shields.io/badge/Pipeline-Python%203.10%2B-yellow?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## Table of Contents

- [Architecture](#architecture)
- [Key Features](#key-features)
- [File Structure](#file-structure)
- [ScraperV2 Pipeline](#scraperv2-pipeline)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Frontend Pages](#frontend-pages)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running Scripts](#running-scripts)
- [Design Decisions](#design-decisions)

---

## Architecture

The system is split into three independent layers that share a single MongoDB Atlas database.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ScraperV2 Pipeline (Python)                  │
│                                                                 │
│  MongoDB        Collector  →  Categorizer  →  Clusterer         │
│  (sources)  →  (RSS fetch)   (keywords)    (HDBSCAN+embeddings) │
│                                                 ↓               │
│                           Bias Analyzer  ←  Summarizer V3       │
│                           (politicalBERT)  (Groq + Gemini)      │
└────────────────────────────────┬────────────────────────────────┘
                                 │ writes to cluster_test_v2
                    ┌────────────▼────────────┐
                    │     MongoDB Atlas        │
                    │   news_aggregator DB     │
                    │   cluster_test_v2 col    │
                    └────────────┬────────────┘
                                 │
               ┌─────────────────▼─────────────────┐
               │     Express.js API  :5000           │
               │  /api/stories  •  /api/contrast     │
               └─────────────────┬─────────────────┘
                                 │ HTTP
               ┌─────────────────▼─────────────────┐
               │    React 19 + Vite  :5173           │
               │  Home  •  Contrast  •  Blindspots   │
               └───────────────────────────────────┘
```

**Tech stack summary:**
| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Axios |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB Atlas (`news_aggregator` / `cluster_test_v2`) |
| Pipeline | Python 3.10+, sentence-transformers, HDBSCAN, PyTorch |
| LLMs | Groq `llama-3.3-70b-versatile` (primary), Gemini `gemini-2.0-flash` (fallback) |
| Bias Model | `bucketresearch/politicalBiasBERT` via HuggingFace Transformers |
| Embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |

---

## Key Features

- **Semantic Clustering** — Articles are embedded using multilingual sentence-transformers and grouped with HDBSCAN using cosine distance. Covers English, Hindi, and other regional languages.
- **AI Summarization** — Every cluster gets 3 strictly factual bullet points via Groq (Llama 3.3 70B). Automatic fallback to Gemini 2.0 Flash when rate limits are hit. Includes article attribution per point.
- **Political Bias Scoring** — Each article is scored from -1.0 (hard left) to +1.0 (hard right) by `politicalBiasBERT`. The cluster stores a `biasDistribution` map for the frontend spectrum bar.
- **Blindspots Engine** — Articles that don't cluster with others become singleton clusters, surfaced on a dedicated Blindspots page as stories mainstream media under-covers.
- **Smart Image Pipeline** — Priority: `og:image` → `twitter:image` → `newspaper3k` top image → branded placeholder. Google domains are blocklisted. Image success rate: **>67%**.
- **Database-Driven Sources** — RSS feed URLs are stored in a MongoDB `sources` collection, not hardcoded. Add a new outlet via DB insert, no code change needed.
- **Resumable Processing** — The summarizer checkpoints every completed cluster to disk. Restart after a crash and it picks up exactly where it left off.
- **Editorial UI** — Broadsheet-style design with Newsreader serif + Public Sans sans-serif, dark mode, and an editorial grid layout.

---

## File Structure

```text
Edified/
│
├── client/                          # React 19 + Vite 8 frontend
│   ├── public/
│   │   └── toi-hero.jpg             # Hero image used on home masthead
│   └── src/
│       ├── api/
│       │   └── stories.js           # Axios instance + typed API calls
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx       # Top nav + category tabs
│       │   │   └── Footer.jsx       # Site footer
│       │   └── story/
│       │       ├── storyCard.jsx    # Card (hero / secondary / compact / default variants)
│       │       ├── articleItem.jsx  # Single article row on contrast page
│       │       └── biasLabel.jsx    # Coloured bias pill (left/center/right)
│       ├── hooks/
│       │   ├── useStories.js        # Paginated story feed (home + blindspots)
│       │   └── useContrast.js       # Single story for contrast page
│       ├── pages/
│       │   ├── home.jsx             # Home — editorial grid with sidebar
│       │   ├── storyDetail.jsx      # Contrast page — full story comparison
│       │   └── blindspots.jsx       # Blindspots — under-covered stories
│       ├── index.css                # Design system, CSS variables, animations
│       └── App.jsx                  # React Router setup
│
├── server/                          # Express 4 + Mongoose 8 API
│   ├── config/
│   │   └── db.js                    # MongoDB connection via Mongoose
│   ├── controllers/
│   │   ├── storiesController.js     # GET/POST/PATCH/DELETE for story feed
│   │   └── contrastController.js    # GET single story for contrast page
│   ├── middleware/
│   │   └── errorHandler.js          # 404 + global error handler
│   ├── models/
│   │   ├── story.js                 # Story schema → cluster_test_v2 collection
│   │   └── article.js               # Article schema (embedded in Story)
│   ├── routes/
│   │   ├── stories.js               # /api/stories routes
│   │   └── contrast.js              # /api/contrast routes
│   ├── seed.js                      # Dev seed data
│   └── server.js                    # Entry point, port 5000
│
├── scraperv2/                       # Python AI pipeline
│   ├── orchestrator.py              # Master runner — full pipeline or single stage
│   ├── collector.py                 # Stage 1: RSS fetch, URL resolution, image extraction
│   ├── categorizer.py               # Stage 2: keyword scoring (EN + Hindi)
│   ├── clusterer.py                 # Stage 3: embeddings + HDBSCAN
│   ├── summarizer_v3.py             # Stage 4: Groq/Gemini 3-point summaries
│   ├── bias_analyzer.py             # Stage 5: politicalBERT batch inference
│   ├── cleanup_clusters.py          # Utility: delete placeholder+low-count clusters
│   ├── collector_cron.py            # Standalone: run collector every 30 min
│   ├── config.py                    # All config (URLs, thresholds, model names)
│   ├── config.example.py            # Template — copy to config.py
│   ├── summarizer_checkpoint.json   # Auto-generated: tracks summarized cluster IDs
│   ├── .env                         # Secrets (gitignored)
│   └── debug/
│       └── _diagnose_cluster.py     # Audit image success rates by source
│
├── requirements.txt                 # Python dependencies
├── RUN_GUIDE.txt                    # Quick-start cheat sheet
└── README.md
```

---

## ScraperV2 Pipeline

The pipeline is orchestrated by `orchestrator.py` and runs 5 stages sequentially.

### Stage 1 — Collector (`collector.py`)

Reads news sources from the MongoDB `sources` collection. Each source document has a `native_rss_feeds` array of RSS URLs and a fallback `rss_url` domain.

**For each source:**
1. Tries all `native_rss_feeds` first (avoids Google News redirect complexity)
2. Falls back to a Google News RSS search if native feeds are empty
3. For each RSS entry, resolves Google News URLs via: base64 decode → snippet link extraction → HTTP redirect follow
4. Scrapes the real article page using `newspaper3k` for full content and images
5. Extracts `og:image` / `twitter:image` from page HTML as backup
6. Deduplicates by MD5 hash of the normalised title
7. Inserts into `test_v2` collection (8 parallel threads via `ThreadPoolExecutor`)

**Config:** `MAX_ARTICLES_PER_SOURCE = 10`, `FETCH_THREADS = 8`, `REQUEST_TIMEOUT = 12s`

### Stage 2 — Categorizer (`categorizer.py`)

Score-based keyword classifier. For each article, it scans `title + snippet + first 500 chars of content` against keyword lists for 8 categories, including Hindi keywords for all major categories.

| Category | Weight |
|---|---|
| Politics, World, Business, Technology, Science, Health | 1.0 |
| Entertainment | 1.1 |
| Sports | 1.2 (higher — keywords are very specific) |

Falls back to `"General"` if no keywords match. Updates `category` field in `test_v2`.

### Stage 3 — Clusterer (`clusterer.py`)

1. Loads all articles from `test_v2`
2. Generates sentence embeddings using `paraphrase-multilingual-MiniLM-L12-v2` (title + first 200 chars of content). Caches embeddings back to MongoDB so re-runs are fast.
3. Computes a full cosine distance matrix
4. Runs `HDBSCAN(min_cluster_size=2, min_samples=1, metric="precomputed")`
5. Articles labelled `-1` (outliers) become **singleton clusters** → surfaced as Blindspots
6. Within each cluster: deduplicates by title hash, sorts newest-first, picks the best available image, generates a branded `placehold.co` placeholder if no real image found
7. Clears `cluster_test_v2` and bulk-inserts all new clusters

### Stage 4 — Summarizer V3 (`summarizer_v3.py`)

For each cluster that doesn't already have 3 summary points:

1. Loads up to 10 articles, truncates each to 300 words
2. Builds a structured prompt with labeled article blocks (`[ARTICLE 1 — Reuters]`)
3. Calls **Groq** (`llama-3.3-70b-versatile`) as primary — sleeps 12s between calls to stay within 30 RPM free tier
4. On Groq 429 (retry-after > 30s), uses **Gemini** (`gemini-2.0-flash`) for that cluster only
5. On Groq daily limit (950 calls), permanently switches to Gemini for the rest of the session
6. Parses the 3-point structured response; falls back to paragraph splits and sentence grouping
7. Saves `summary[]`, `summaryRaw`, `summaryModel`, and `updatedAt` to the cluster document
8. Checkpoints completed cluster IDs to `summarizer_checkpoint.json` after every successful write

**Output format per cluster:**
```
POINT 1 — Main angle: <50+ words> (Articles: 1, 3)
POINT 2 — Different perspective: <50+ words> (Articles: 2, 4)
POINT 3 — Hard facts only: <50+ words> (Articles: 1, 2, 3, 4)
```

### Stage 5 — Bias Analyzer (`bias_analyzer.py`)

Loads `bucketresearch/politicalBiasBERT` locally (runs on CUDA if available, else CPU). Processes articles in batches of 16.

**Scoring:** model outputs `[left_prob, center_prob, right_prob]`. Score = `right_prob - left_prob` → range [-1, +1].

| Score range | Label |
|---|---|
| < -0.33 | `left` |
| -0.33 to -0.10 | `center-left` |
| -0.10 to +0.10 | `center` |
| +0.10 to +0.33 | `center-right` |
| > +0.33 | `right` |

Caches scores back to `test_v2` (raw articles) so articles already scored are skipped on re-runs. Updates `biasDistribution` on every cluster.

### Utility — Cleanup (`cleanup_clusters.py`)

Interactive script. Finds clusters where `imageUrl` contains `placehold.co` AND `articleCount < 3`, lists them, and asks for confirmation before deleting. Keeps the frontend feed high-quality.

### Orchestrator Usage

```bash
# Run the full 5-stage pipeline once
python scraperv2/orchestrator.py

# Run continuously every 2 hours
python scraperv2/orchestrator.py --loop

# Run a single stage
python scraperv2/orchestrator.py --stage collect
python scraperv2/orchestrator.py --stage categorize
python scraperv2/orchestrator.py --stage cluster
python scraperv2/orchestrator.py --stage summarize
python scraperv2/orchestrator.py --stage bias
```

---

## Data Model

### MongoDB Collections

| Collection | Written by | Read by |
|---|---|---|
| `sources` | Manual / admin | Collector |
| `test_v2` | Collector, Categorizer, Bias Analyzer | Clusterer |
| `cluster_test_v2` | Clusterer, Summarizer, Bias Analyzer | Express API → React |

### Story Schema (`cluster_test_v2`)

The Mongoose model (`server/models/story.js`) maps to this collection via the third argument: `mongoose.model("Story", storySchema, "cluster_test_v2")`.

| Field | Type | Description |
|---|---|---|
| `headline` | `String` | Lead article title (becomes cluster headline) |
| `summary` | `[String]` | Array of 3 AI-generated bullet points |
| `summaryModel` | `String` | `"groq"` or `"gemini"` — which model wrote the summary |
| `imageUrl` | `String` | Best real image URL, or branded `placehold.co` URL |
| `category` | `String` | One of: General, Politics, World, Business, Technology, Science, Health, Sports, Entertainment |
| `tags` | `[String]` | Keywords merged from all articles in the cluster |
| `articles` | `[Article]` | Embedded array — all articles in the cluster |
| `articleCount` | `Number` | Length of articles array (stored, not virtual) |
| `coverSource` | `String` | Outlet name of the lead article |
| `biasDistribution` | `Object` | `{left, centerLeft, center, centerRight, right}` counts |
| `latestPublishedAt` | `Mixed` | Most recent article date |
| `isActive` | `Boolean` | Soft-delete flag — feed only shows `isActive: true` |
| `createdAt` / `updatedAt` | `Date` | Mongoose timestamps |

**Pre-save hook:** On every `Story.save()`, the hook recomputes `latestPublishedAt`, `articleCount`, and `biasDistribution` from the current `articles` array.

**Indexes:** `{articleCount: -1, latestPublishedAt: -1}` (primary sort), `{category: 1, latestPublishedAt: -1}` (filtered feed), `{isActive: 1}`.

### Article Schema (embedded in Story)

| Field | Type | Description |
|---|---|---|
| `title` | `String` | Article headline |
| `url` | `String` | Original Google News RSS URL |
| `real_url` | `String` | Resolved real article URL |
| `source` | `String` | Outlet name (legacy field) |
| `source_name` | `String` | Outlet name (pipeline field — preferred) |
| `author` | `String` | Byline |
| `publishedAt` | `Date` | Publication date |
| `snippet` | `String` | Raw RSS summary (may contain HTML) |
| `summary_meta` | `String` | Clean `<meta name="description">` content |
| `imageUrl` | `String` | Extracted article image |
| `top_image` | `String` | `newspaper3k` top image |
| `fullContent` | `String` | Full article body (`select: false` — not returned by default) |
| `biasScore` | `Number` | -1.0 to +1.0 |
| `biasLabel` | `String` | `left` / `center-left` / `center` / `center-right` / `right` / `unrated` |
| `category` | `String` | Per-article category |
| `tags` | `[String]` | Per-article keywords |
| `title_hash` | `String` | MD5 of normalised title — used for dedup |

---

## API Reference

Base URL: `http://localhost:5000`

### `GET /api/stories`

Paginated story feed for the home and blindspots pages.

**Query parameters:**

| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `limit` | `10` | Results per page |
| `category` | — | Case-insensitive filter (e.g. `politics`) |
| `maxArticles` | — | Return only clusters with ≤ N articles (used by Blindspots: `maxArticles=2`) |

**Sort order:** `articleCount DESC`, then `latestPublishedAt DESC` — biggest stories float to the top.

**Strips:** `articles.biasScore` and `__v` from the response to reduce payload.

```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 842,
  "pages": 85,
  "data": [
    {
      "_id": "...",
      "headline": "India-Pakistan ceasefire...",
      "summary": ["Point 1...", "Point 2...", "Point 3..."],
      "imageUrl": "https://...",
      "category": "World",
      "articleCount": 14,
      "biasDistribution": { "left": 2, "centerLeft": 5, "center": 4, "centerRight": 3, "right": 0 }
    }
  ]
}
```

### `GET /api/stories/:id`

Raw single story document. All fields included.

### `POST /api/stories`

Create a new story. Body: story fields per schema.

### `POST /api/stories/:id/articles`

Append articles to an existing story. Deduplicates by URL before pushing.

### `PATCH /api/stories/:id`

Update allowed fields: `headline`, `summary`, `category`, `tags`, `coverSource`, `isActive`, `imageUrl`.

### `DELETE /api/stories/:id`

Soft-delete — sets `isActive: false`. Story remains in DB.

---

### `GET /api/contrast/:storyId`

Returns a single story shaped specifically for the contrast page:
- Separates `coverArticle` from `articles[]` so the frontend doesn't have to find it
- Sorts articles: cover first, then by `publishedAt` descending
- Includes all bias fields and full `summary[]`

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "headline": "...",
    "summary": ["...", "...", "..."],
    "imageUrl": "...",
    "coverSource": "Reuters",
    "coverArticle": { "title": "...", "url": "...", ... },
    "articles": [...],
    "articleCount": 14,
    "biasDistribution": { "left": 2, "centerLeft": 5, ... },
    "latestPublishedAt": "...",
    "createdAt": "..."
  }
}
```

---

## Frontend Pages

### Home (`/`)

Editorial broadsheet layout:
- **Masthead**: Full-width header with the publication name, tagline, and a hero newspaper photo
- **Sidebar**: Sticky category navigation (General, World, Politics, Business, Culture, Science, Health, Technology)
- **Main canvas**: 12-column editorial grid — hero story (8 cols) + "The Blindspots" rail (4 cols)
  - Hero: largest story card with full image
  - Secondary: 2-column grid of the next 2 stories
  - Blindspots rail: compact cards for stories 4–6, plus an Orwell quote block
- **More Stories**: responsive card grid for all remaining paginated stories
- **Load More**: appends next page, shows "You've reached the end" when exhausted

### Contrast (`/story/:id`)

Clicked from any story card:
- **Meta bar**: category pill + tag + source count
- **Hero section**: large image left, 3 AI bullet points right (falls back to first 3 article titles if `summary[]` is empty)
- **Article list**: each row shows outlet name, author, headline (clickable), VISIT button, snippet (HTML-stripped, prefers `summary_meta`), and bias label pill
- Articles sorted: cover source first, then by date descending

### Blindspots (`/blindspots`)

Same layout as home but filtered to `maxArticles=2` — stories covered by only 1 or 2 outlets. Includes a banner explaining the concept. Full category filtering and pagination.

---

## Setup & Installation

### Prerequisites

- Node.js ≥ 18 + npm
- Python 3.10+
- MongoDB Atlas account (free tier works)
- Groq API key (free tier: 1,000 req/day)
- Google Gemini API key (free tier: fallback only)

### 1. Clone

```bash
git clone <repo-url>
cd Edified
```

### 2. Server

```bash
cd server
npm install
cp .env.example .env
# Set MONGO_URI in .env (must include /news_aggregator in path)
npm run dev      # starts on :5000
```

### 3. Client

```bash
cd client
npm install
npm run dev      # starts on :5173
```

### 4. Python Pipeline

```bash
# From project root
pip install -r requirements.txt

# Create scraperv2/.env (see Environment Variables below)

# Run the full pipeline
python scraperv2/orchestrator.py

# Or run in a continuous loop (every 2 hours)
python scraperv2/orchestrator.py --loop
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/news_aggregator` |
| `PORT` | Express port | `5000` |
| `NODE_ENV` | Environment | `development` |

> The URI **must** include `/news_aggregator` — Mongoose uses this to select the DB. The model is hard-coded to the `cluster_test_v2` collection.

### Pipeline (`scraperv2/.env`)

| Variable | Description |
|---|---|
| `MONGO_URI` | Same Atlas URI as above |
| `DB_NAME` | `news_aggregator` |
| `GROQ_API_KEY` | From console.groq.com |
| `GEMINI_API_KEY` | From aistudio.google.com |
| `HF_TOKEN_1/2/3` | HuggingFace tokens (for bias model download if needed) |

---

## Running Scripts

### Server

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Production start |
| `npm run seed` | Seed sample data into DB |

### Client

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |

### Pipeline

| Command | Description |
|---|---|
| `python scraperv2/orchestrator.py` | Run full pipeline once |
| `python scraperv2/orchestrator.py --loop` | Run every 2 hours |
| `python scraperv2/orchestrator.py --stage collect` | Fetch articles only |
| `python scraperv2/orchestrator.py --stage categorize` | Categorize only |
| `python scraperv2/orchestrator.py --stage cluster` | Re-cluster only |
| `python scraperv2/orchestrator.py --stage summarize` | Summarize only |
| `python scraperv2/orchestrator.py --stage bias` | Bias analysis only |
| `python scraperv2/summarizer_v3.py` | Run summarizer standalone |
| `python scraperv2/cleanup_clusters.py` | Interactive cleanup |
| `python scraperv2/debug/_diagnose_cluster.py` | Image success audit |

**Troubleshooting summarizer:**
- If you hit Groq 429 errors, the system auto-switches to Gemini for that cluster
- If Groq daily limit (950) is reached, all remaining clusters use Gemini
- Delete `scraperv2/summarizer_checkpoint.json` to force a full re-run

---

## Design Decisions

1. **Embedded Articles** — Articles live inside the Story document. The contrast page fetches one document and renders everything — no second query needed.

2. **Dual source fields** — Both `source` (legacy) and `source_name` (pipeline) exist on articles. The frontend reads `source_name || source` to support both data origins.

3. **`select: false` on `fullContent`** — Full article bodies can be several KB each. The API never sends them to the frontend; they exist only for the Python pipeline to use as LLM input.

4. **`Mixed` type on `latestPublishedAt`** — The RSS pipeline stores RFC 2822 date strings, not proper Date objects. Using `Mixed` avoids Mongoose validation failures from the pipeline side.

5. **No-referrer tag** — The React frontend sets `<meta name="referrer" content="no-referrer">` so outlets like BBC and Al Jazeera cannot block their images from loading on our domain.

6. **Singleton clusters = Blindspots** — HDBSCAN outlier articles (label `-1`) are not discarded. They become `articleCount: 1` clusters and appear on the Blindspots page — stories that no other outlet picked up.

7. **articleCount stored, not virtual** — Initially a Mongoose virtual, `articleCount` is now a stored Number field so it can be indexed and sorted efficiently at the database level.

8. **Cosine distance for clustering** — Text embeddings have high dimensionality where cosine similarity outperforms Euclidean distance significantly. This is why we pre-compute the full distance matrix and pass it to HDBSCAN as `metric="precomputed"`.

9. **Single-threaded summarizer** — The Groq free tier is 30 RPM shared across all keys. Multi-threading generates burst 429s that cascade. Single-threaded with 12s sleeps stays safely within the limit.

---

*The Edified — PBL 6th Semester Project. Est. 2026.*
