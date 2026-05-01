# The Edified

> *"True journalism is printing what someone else does not want printed; everything else is public relations."* — George Orwell

**The Edified** is a news aggregation and media contrast platform that collects articles from 30+ global outlets, groups them by story, and helps readers see how the same event is covered differently across the media landscape.

---

## What It Does

Most news readers see one outlet's take on a story. The Edified shows you many — side by side, with context. For any given news story, the platform pulls together every article covering it, generates a factual AI summary, scores each article for political bias, and presents everything in a clean editorial interface.

It also surfaces a **Blindspots** feed: stories that only one or two outlets bothered to cover — the news that might otherwise pass you by.

---

## How It Works

The platform is built in three layers that work together through a shared database.

### The Data Pipeline

A Python pipeline runs automatically in the background, processing news in five stages:

1. **Collection** — Fetches articles from RSS feeds across dozens of outlets. Resolves redirect URLs, extracts images, and removes duplicates.

2. **Categorization** — Classifies each article into a topic category (Politics, World, Business, Technology, Science, Health, Sports, Entertainment) using keyword scoring that works across English and Hindi.

3. **Clustering** — Groups articles about the same story together using AI text embeddings and a clustering algorithm. Articles that don't match any group become Blindspot candidates.

4. **Summarization** — For each story cluster, an AI model reads all the articles and writes three factual bullet points summarising what happened, with different angles represented.

5. **Bias Analysis** — A political bias model scores each article on a spectrum from left to right. The platform shows the bias distribution across all sources covering a story.

### The Backend

An Express.js API serves story data to the frontend. It handles filtering by category, pagination, and a dedicated endpoint for the contrast view that assembles all articles about a single story.

### The Frontend

A React application with a broadsheet-style editorial design. Three main pages:

- **Home** — An editorial grid showing the top stories of the day, with a sidebar Blindspots rail.
- **Contrast** — A deep-dive on a single story showing the AI summary, every article covering it, each outlet's bias score, and links to the original sources.
- **Blindspots** — Stories that slipped under the radar, covered by only one or two outlets.

---

## Key Ideas Behind the Project

**Seeing the full picture.** Any single article is one perspective. By clustering dozens of articles about the same event, the platform lets you compare how Reuters, Al Jazeera, the BBC, and regional Indian outlets each frame the same story.

**Blind spots matter.** HDBSCAN, the clustering algorithm used, naturally identifies outlier articles that don't fit any major story group. Rather than discarding them, the platform treats these as the most interesting stories — ones the mainstream largely ignored.

**Factual summaries, not opinions.** The AI summarization is explicitly prompted to produce only verifiable facts, not analysis or editorial commentary.

**Bias as data, not judgment.** Political bias scores are presented as information for the reader to interpret, not as a reason to dismiss or elevate any source.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Pipeline | Python, sentence-transformers, HDBSCAN |
| Summarization | Groq (Llama 3.3 70B) with Gemini 2.0 Flash as fallback |
| Bias Scoring | politicalBiasBERT via HuggingFace |
| Embeddings | paraphrase-multilingual-MiniLM-L12-v2 |

---

## Project Background

The Edified was built as a 6th Semester PBL (Project-Based Learning) project. The goal was to tackle a real problem in modern media consumption — filter bubbles and the difficulty of getting a balanced view of any given news story — with a full-stack, AI-powered solution.

---

## Collaborators

- **Pratyush**
- **Palak**
- **Diya**
- **Raj**

---

*Est. 2026*