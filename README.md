# The Edified

An editorial news aggregation and perspective contrast platform. **The Edified** ingests articles from multiple news outlets, clusters them into unified story events, generates concise 3-point factual summaries, and provides a conversational RAG assistant to query verified news.

---

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7
- **Backend API**: Node.js, Express.js, Mongoose
- **Database**: MongoDB Atlas, ChromaDB (Vector Store)
- **RAG & AI**: FastAPI, SentenceTransformers, Google Gemini, OpenRouter
- **Scraper & Pipeline**: Python, BeautifulSoup4, HDBSCAN, LangDetect

---

## File Structure

```
Edified/
├── client/                     # Frontend (React 19 + Vite)
│   ├── src/
│   │   ├── api/                # API request helpers
│   │   ├── components/         # Reusable UI, layout & RAG components
│   │   ├── hooks/              # Custom React hooks (useStories, useContrast)
│   │   ├── pages/              # App pages (Home, StoryDetail, Location, Blindspots, About, Chat)
│   │   ├── App.jsx             # Route definitions
│   │   └── main.jsx            # React root entry
│   └── package.json
│
├── server/                     # Backend API (Node.js + Express)
│   ├── config/                 # Database configuration
│   ├── controllers/            # Route controllers (stories, contrast)
│   ├── models/                 # Mongoose schemas (Story, Article)
│   ├── routes/                 # Express REST endpoints
│   ├── server.js               # Express entry point (Port 5000)
│   └── package.json
│
├── scraperv2/                  # News Ingestion & NLP Pipeline (Python)
│   ├── collector.py            # RSS feed ingestion & deduplication
│   ├── categorizer.py          # Category classifier
│   ├── location_tagger.py      # Regional location tagger
│   ├── bias_analyzer.py        # Political bias analysis
│   ├── clusterer.py            # HDBSCAN story clustering
│   ├── summarizer_v3.py        # 3-point multi-source factual summarizer
│   └── config.py               # Database and API keys
│
├── rag/                        # Conversational AI & Vector Store (FastAPI)
│   ├── api.py                  # FastAPI service (Port 8000)
│   ├── chunker.py              # Text chunking logic
│   ├── embedder.py             # SentenceTransformer embedding wrapper
│   ├── generator.py            # Grounded LLM response generator
│   ├── retriever.py            # ChromaDB vector search
│   └── requirements.txt
│
├── start_rag.bat               # Windows RAG service launcher
└── README.md                   # Project overview
```

---

## Quick Start

### 1. Start Backend API (Port 5000)
```bash
cd server
npm install
node server.js
```

### 2. Start RAG Service (Port 8000)
```bash
# Windows
.\start_rag.bat

# Or with uvicorn
python -m uvicorn rag.api:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start Frontend (Port 5173)
```bash
cd client
npm install
npm run dev
```
