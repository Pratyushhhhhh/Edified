# The Edified

A news aggregation and contrast platform that clusters articles from multiple outlets covering the same story, enabling readers to compare coverage and detect media bias.

![The Edified](https://img.shields.io/badge/Stack-React%20%2B%20Express%20%2B%20MongoDB-blue) ![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Data Model](#data-model)
- [API Routes](#api-routes)
- [Frontend Pages](#frontend-pages)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## Overview

**The Edified** groups related news articles from different outlets into "stories" (clusters). Each story represents a single news event as covered by multiple sources. Users can:

1. **Browse the Cluster Page** — a grid of story cards showing headlines, categories, source counts, and images
2. **Open the Contrast Page** — a detailed view comparing how different outlets covered the same event, complete with bias labels and source attribution

The platform reads from a MongoDB database (`news_aggregator` database, `clusters` collection) which is populated by a separate RSS scraping and clustering pipeline.

---

## Architecture

```
┌──────────────┐        ┌──────────────┐        ┌──────────────────────┐
│              │  HTTP   │              │  TCP   │                      │
│  React App   │◄──────►│  Express API │◄──────►│  MongoDB Atlas       │
│  (Vite)      │  :5173  │  (Node.js)   │  :27017│  news_aggregator DB  │
│              │        │              │        │  clusters collection │
└──────────────┘        └──────────────┘        └──────────────────────┘
     Client                  Server                    Database
```

- **Client**: React 19 + Vite 8 + React Router 7
- **Server**: Express 4 + Mongoose 8
- **Database**: MongoDB Atlas (cloud-hosted)

---

## File Structure

```
Edified/
├── client/                          # Frontend — React + Vite
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── api/
│   │   │   └── stories.js           # Axios instance + API functions
│   │   ├── assets/                  # Static images/icons
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navbar.jsx       # Top navigation bar + category tabs
│   │   │   └── story/
│   │   │       ├── storyCard.jsx    # Story card for the cluster grid
│   │   │       ├── articleItem.jsx  # Single article row on contrast page
│   │   │       └── biasLabel.jsx    # Coloured bias pill component
│   │   ├── hooks/
│   │   │   ├── useStories.js        # Fetches paginated stories for home page
│   │   │   └── useContrast.js       # Fetches single story for contrast page
│   │   ├── pages/
│   │   │   ├── home.jsx             # Cluster page — grid of story cards
│   │   │   └── storyDetail.jsx      # Contrast page — full story comparison
│   │   ├── App.jsx                  # Router setup
│   │   ├── App.css                  # App-level styles
│   │   ├── index.css                # Global styles, fonts, animations
│   │   └── main.jsx                 # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Backend — Express + Mongoose
│   ├── config/
│   │   └── db.js                    # MongoDB connection logic
│   ├── controllers/
│   │   ├── storiesController.js     # CRUD for stories (cluster page feed)
│   │   └── contrastController.js    # Single story detail (contrast page)
│   ├── middleware/
│   │   └── errorHandler.js          # 404 + global error handler
│   ├── models/
│   │   ├── story.js                 # Story schema (top-level document)
│   │   └── article.js               # Article schema (embedded in Story)
│   ├── routes/
│   │   ├── stories.js               # /api/stories routes
│   │   └── contrast.js              # /api/contrast routes
│   ├── seed.js                      # Development seed data
│   ├── server.js                    # Express app entry point
│   ├── .env                         # Environment variables (gitignored)
│   ├── .env.example                 # Template for .env
│   └── package.json
```

---

## Data Model

### Story (Collection: `clusters`)

Each document in the `clusters` collection represents one news event covered by multiple outlets.

| Field | Type | Description |
|-------|------|-------------|
| `headline` | `String` | Synthesised headline for the story |
| `summary` | `[String]` | Array of 3 bullet-point summaries (may be empty) |
| `imageUrl` | `String` | Hero image URL for the story |
| `category` | `String` | Category label (e.g. "General", "technology") |
| `tags` | `[String]` | Topic tags for filtering/search |
| `articles` | `[Article]` | Embedded array of articles from different outlets |
| `coverSource` | `String` | Which outlet's article leads the story |
| `biasDistribution` | `Object` | Count of articles per bias bucket: `{left, centerLeft, center, centerRight, right}` |
| `latestPublishedAt` | `Mixed` | Most recent article date (Date or RFC 2822 string) |
| `isActive` | `Boolean` | Soft-delete flag |
| `articleCount` | `Virtual` | Computed from `articles.length` |

### Article (Embedded Schema)

Each article lives inside `story.articles[]` — no separate collection.

| Field | Type | Description |
|-------|------|-------------|
| `title` | `String` | Article headline |
| `url` | `String` | Original article URL (VISIT button link) |
| `source` | `String` | Outlet name (legacy format) |
| `source_name` | `String` | Outlet name (clusters format) |
| `author` | `String` | Byline |
| `publishedAt` | `Date` | Publication timestamp |
| `snippet` | `String` | Short excerpt (may contain HTML from RSS feeds) |
| `summary_meta` | `String` | Clean meta description (preferred over snippet) |
| `imageUrl` | `String` | Per-article thumbnail |
| `top_image` | `String` | Image from Google News RSS |
| `fullContent` | `String` | Full article body (excluded from API responses by default) |
| `biasScore` | `Number` | -1.0 (left) to +1.0 (right) |
| `biasLabel` | `String` | `"left"`, `"center-left"`, `"center"`, `"center-right"`, `"right"`, or `"unrated"` |
| `category` | `String` | Per-article category |
| `tags` | `[String]` | Per-article tags |

---

## API Routes

### Stories (Cluster Page Feed)

Base path: `/api/stories`

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| `GET` | `/api/stories` | Paginated story feed | `page` (default: 1), `limit` (default: 10), `category` |
| `GET` | `/api/stories/:id` | Single story (raw) | — |
| `POST` | `/api/stories` | Create a new story | — |
| `POST` | `/api/stories/:id/articles` | Add articles to a story | — |
| `PATCH` | `/api/stories/:id` | Update story fields | — |
| `DELETE` | `/api/stories/:id` | Soft-delete (set `isActive: false`) | — |

#### Example: `GET /api/stories?page=1&limit=10&category=general`

```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 110,
  "pages": 11,
  "data": [
    {
      "_id": "69c94426845ca9fb800bb3ae",
      "headline": "Telangana Budget 2026-27...",
      "summary": [],
      "imageUrl": "https://...",
      "category": "General",
      "tags": [],
      "articles": [...],
      "coverSource": "The Hindu",
      "biasDistribution": { "left": 0, "centerLeft": 0, "center": 2, ... },
      "isActive": true,
      "articleCount": 2
    }
  ]
}
```

### Contrast (Story Detail Page)

Base path: `/api/contrast`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/contrast/:storyId` | Full story shaped for the contrast page |

#### Example Response

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "headline": "...",
    "summary": [],
    "imageUrl": "...",
    "category": "General",
    "tags": [],
    "coverSource": "The Hindu",
    "coverArticle": { ... },
    "articles": [ ... ],
    "articleCount": 3,
    "biasDistribution": { ... },
    "latestPublishedAt": "...",
    "createdAt": "..."
  }
}
```

The contrast endpoint differs from the stories endpoint by:
- Returning a **single story** instead of a paginated list
- Including a **separated `coverArticle`** object
- **Sorting articles** — cover article first, then by `publishedAt` descending
- Including all fields (no stripping)

---

## Frontend Pages

### Cluster Page (`/`)

The home page displays a grid of story cards. Each card shows:
- Hero image (filtered: Google News generic thumbnails are hidden)
- Category label
- Headline
- Source count and first tag

**Pagination**: Initially loads 10 stories. A "Load More Stories" button at the bottom fetches the next page and appends to the grid. Shows "You've reached the end" when all stories are loaded.

**Category filtering**: The navbar has category tabs (All, General, World, Politics, Business, Technology, Science, Health). Clicking a tab filters stories by category (case-insensitive).

### Contrast Page (`/story/:id`)

Clicking a story card navigates here. The page shows:
- **Meta bar** — category pill, first tag, source count
- **Headline** — large serif text
- **Hero image + Summary bullets** — side-by-side grid layout. If `summary[]` is empty, the first 3 article titles are shown as bullet points instead
- **Article list** — each article shows source name, author, headline (linked), VISIT button, snippet (HTML-stripped), and bias label pill

---

## Setup & Installation

### Prerequisites

- Node.js ≥ 18
- npm
- MongoDB Atlas account (or local MongoDB instance)

### 1. Clone the repository

```bash
git clone <repo-url>
cd Edified
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your MongoDB URI
```

### 4. Install client dependencies

```bash
cd ../client
npm install
```

### 5. Start the application

In two separate terminals:

```bash
# Terminal 1 — Backend
cd server
npm run dev          # or: npm start

# Terminal 2 — Frontend
cd client
npm run dev
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:5173`.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Express server port | `5000` |
| `MONGO_URI` | MongoDB connection string (must include database name) | `mongodb+srv://user:pass@cluster.mongodb.net/news_aggregator` |
| `NODE_ENV` | Environment mode | `development` |

> **Important**: The `MONGO_URI` must include `/news_aggregator` in the path to connect to the correct database. The Mongoose model is configured to read from the `clusters` collection.

---

## Scripts

### Server

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `node server.js` | Start the production server |
| `npm run dev` | `nodemon server.js` | Start with auto-reload |
| `npm run seed` | `node seed.js` | Seed sample data (development) |

### Client

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Start Vite dev server |
| `npm run build` | `vite build` | Build for production |
| `npm run preview` | `vite preview` | Preview production build |
| `npm run lint` | `eslint .` | Run ESLint |

---

## Key Design Decisions

1. **Embedded articles** — Articles are embedded inside Story documents (not referenced). This ensures a single MongoDB query loads everything the contrast page needs.

2. **Dual source fields** — Both `source` and `source_name` exist on articles to support data from different pipelines. The frontend uses `source_name || source`.

3. **HTML stripping** — RSS feed snippets may contain raw HTML tags. The `articleItem.jsx` component strips these before rendering, preferring the clean `summary_meta` field.

4. **Google News image filtering** — Image URLs from `lh3.googleusercontent.com` (generic Google News thumbnails) are detected and hidden. Only real article images from actual news sources are displayed.

5. **Flexible schema** — No strict enum on `category`, `Mixed` type on `latestPublishedAt`, and `"unrated"` added to `biasLabel` — all to accommodate the varying data formats from the RSS clustering pipeline.
