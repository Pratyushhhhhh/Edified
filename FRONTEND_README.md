# The Edified — Frontend Documentation

> **Stack**: React 18 + Vite · CSS-in-JS (inline styles) + global `index.css` · React Router v6  
> **Dev server**: `cd client && npm run dev` → http://localhost:5173

---

## File Structure

```
client/
├── index.html                        ← HTML entry: fonts, meta, title
├── public/
│   └── toi-hero.jpg                  ← Hero image shown in Home intro banner
└── src/
    ├── main.jsx                      ← App root (imports index.css)
    ├── App.jsx                       ← Router config (all 5 routes)
    ├── index.css                     ← ENTIRE design system (tokens, classes)
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.jsx            ← Top nav + secondary nav tabs
    │   │   └── Footer.jsx            ← Shared site footer
    │   └── story/
    │       ├── storyCard.jsx         ← Reusable card (5 variants)
    │       ├── articleItem.jsx       ← Article row inside StoryDetail
    │       └── biasLabel.jsx         ← Bias pill (left/center/right)
    │
    ├── pages/
    │   ├── home.jsx                  ← Home page
    │   ├── blindspots.jsx            ← Blindspots page
    │   ├── location.jsx              ← Location page
    │   ├── aboutUs.jsx               ← About Us page
    │   └── storyDetail.jsx           ← Story detail / contrast view
    │
    └── hooks/
        ├── useStories.js             ← Fetches story clusters from API
        └── useContrast.js            ← Fetches single story detail
```

---

## 1. Design System — `src/index.css`

All visual tokens live here as CSS custom properties on `:root`.

### Color Tokens (lines ~10–35)

| Token | Value | Used For |
|---|---|---|
| `--c-bg` | `#fbf9f4` | Page background (cream) |
| `--c-on-surface` | `#31332c` | Primary text, headlines |
| `--c-on-surface-variant` | `#5c5f52` | Secondary body text |
| `--c-outline` | `#8a8d80` | Muted labels, meta text |
| `--c-outline-variant` | `#d4d7ca` | Divider lines, borders |
| `--c-surface-low` | `#f0ede4` | Hover card backgrounds |
| `--c-surface-high` | `#e4e1d8` | Sidebar / rail backgrounds |
| `--c-surface-highest` | `#dbd8cf` | Contrast elements |
| `--c-secondary` | `#b6271a` | Accent red (pills, hover, links) |
| `--c-tertiary` | `#6b5e0f` | Gold/olive accent |

**To change the accent red:** Edit `--c-secondary: #b6271a;` in `:root`.

### Typography

Fonts loaded via `index.html` `<link>` tags (lines 14-17):
- `'Newsreader'` serif — headlines, hero text, quotes, article titles
- `'Public Sans'` sans-serif — UI labels, captions, buttons, meta

### Key CSS Classes

| Class | index.css approx. line | Controls |
|---|---|---|
| `.nav-masthead` | ~109 | Site title — `font-size: 56px` |
| `.primary-nav-link` | ~137 | Top nav tabs — `font-size: 13px` |
| `.secondary-nav-link` | ~176 | Category/city sub-tabs — `font-size: 12px` |
| `.sidebar` | ~195 | Left sidebar — `width: 220px` |
| `.sidebar-link` | ~210 | Sidebar category button rows |
| `.sidebar-link.active` | ~225 | Active sidebar item |
| `.article-row` | ~244 | Article rows in StoryDetail |
| `.visit-btn` | ~255 | "VISIT" link button |
| `.bias-pill` | ~262 | Bias label pill |
| `.cat-pill` | ~283 | Small category label |
| `.btn-load-more` | ~309 | Load More button |
| `.site-footer` | ~301 | Footer wrapper |

---

## 2. Entry Point — `index.html`

```html
<title>The Edified | Digital Broadsheet</title>   <!-- line 8: browser tab title -->
<meta name="description" content="...">           <!-- line 7: SEO description -->

<!-- Fonts (lines 14-17) — edit to change typography -->
<link href="https://fonts.googleapis.com/css2?family=Newsreader...">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined...">
```

---

## 3. Router — `src/App.jsx`

```jsx
<Route path="/"           element={<Home />} />        // Home
<Route path="/story/:id"  element={<StoryDetail />} /> // Story detail
<Route path="/blindspots" element={<Blindspots />} />  // Blindspots
<Route path="/location"   element={<Location />} />    // Location
<Route path="/about"      element={<AboutUs />} />     // About Us
```

---

## 4. Navbar — `src/components/layout/Navbar.jsx`

### Visual Structure
```
Row 1:  [Monday, 28 April]    [THE EDIFIED]    [account icon]
Row 2:  [Home] [Location] [Blindspots] [About Us]
────────────────────────────────────────────────────────────────
Row 3:  [All] [General] [World] [Politics] ...  (Home/Blindspots only)
        [Delhi] [Mumbai] [Bangalore] ...          (Location only)
```

### Manual Change Reference

| What | Location |
|---|---|
| Date format | Line ~57 · `toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })` |
| Site title text | Line ~58 · `"The Edified"` |
| Primary nav links | Lines 3–7 · `PRIMARY_LINKS` array |
| Category tabs | Lines 9–18 · `HOME_CATEGORIES` array |
| City tabs | Lines 20–23 · `CITIES` array |
| Masthead font size | `index.css` ~line 109 · `font-size: 56px` |
| Which pages show category tabs | Lines 88–108 · `isHome || isBlindspots` condition |

---

## 5. Home Page — `src/pages/home.jsx`

### Layout Structure
```
<Navbar />

<header>  ← FULL-WIDTH intro (outside sidebar flex, spans left to right)
  [Left: Est.2026 label + H1 + italic tagline]   [Right: toi-hero.jpg]
</header>

<div style="display:flex">   ← sidebar + content row
  <aside class="sidebar">
    Sections / The Daily Ledger
    [All] [General] [World] ...
  </aside>
  <main>
    [Hero StoryCard — variant="hero"]
    [2-col secondary StoryCards]
    [4th col: Blindspots sticky rail]
    [Additional grid stories]
    [Load More]
  </main>
</div>

<Footer />
```

### Manual Change Reference

| What | Location |
|---|---|
| "Est. 2026" label | ~line 44 |
| H1 headline text | ~line 55 |
| Tagline paragraph | ~lines 65–68 |
| Hero image src | ~line 81 · `src="/toi-hero.jpg"` |
| Hero image width | ~line 77 · `width: 340` |
| Sidebar title | ~line 110 · `"Sections"` / `"The Daily Ledger"` |
| Sidebar categories | Lines 7–16 · `SIDEBAR_CATS` array |
| Orwell quote | Line 18 · `ORWELL_QUOTE` constant |
| Stories distribution | Lines 25–28 · `slice()` calls: hero[0], secondary[1-3], rail[3-6], grid[6+] |
| Load more button text | ~line 309 · `"Load More Stories"` |

---

## 6. StoryCard — `src/components/story/storyCard.jsx`

**Usage:** `<StoryCard story={s} variant="hero" />`

| Variant | Used On | Description |
|---|---|---|
| `"hero"` | Home top story | Large, 16:9 image, big serif headline |
| `"secondary"` | Home 2-col row | Medium, optional image |
| `"compact"` | Home sidebar rail | Text-only, no image |
| `"location"` | Location overflow grid | Medium with image |
| `"default"` | Fallback | Standard card |

### Manual Change Reference

| What | Location |
|---|---|
| Hero image aspect ratio | ~line 35 · `aspectRatio: "16/9"` |
| Hero headline font size | ~line 55 · `clamp(28px, 3.5vw, 48px)` |
| Summary truncation | ~line 70 · `.slice(0, 220)` |
| Secondary image height | ~line 130 · `height: 200` |
| Card hover background | `onMouseEnter` handlers · `"var(--c-surface-low)"` |

---

## 7. ArticleItem — `src/components/story/articleItem.jsx`

Renders one source article row inside StoryDetail.

```
[Source Name (red)] · [Author] · [Date]          [BIAS PILL]
[Article Headline — serif link]                  [VISIT btn]
[Snippet text]
──────────────────────────────────────────────────────────────
```

| What | Location |
|---|---|
| Source name color | ~line 25 · `color: "var(--c-secondary)"` |
| Headline font size | ~line 68 · `fontSize: 20` |
| Date format | `formatDate()` function lines ~10–15 |
| VISIT button style | `index.css` · `.visit-btn` |

---

## 8. BiasLabel — `src/components/story/biasLabel.jsx`

```js
const PALETTE = {
  "left":         { bg: "#dbeafe", color: "#1e3a8a" },  // blue
  "center-left":  { bg: "#dcfce7", color: "#14532d" },  // green
  "center":       { bg: "surface-highest", color: "..." },
  "center-right": { bg: "#fef3c7", color: "#92400e" },  // amber
  "right":        { bg: "#fee2e2", color: "#991b1b" },  // red
};
```

To add a label: add a new key in `PALETTE` (lines 3–9).

---

## 9. Blindspots — `src/pages/blindspots.jsx`

### Layout Structure
```
[Large H1 "Blindspots" + italic tagline]
[2px dark divider]

Row 1: [7fr big card]  [5fr default card]      stories[0], stories[1]
Row 2: [1fr] [1fr] [1fr] 3-column grid         stories[2..4]
Row 3: [Wide horizontal card] x2               stories[5..6]
Row 4: auto-fill grid (minmax 260px)           stories[7+]

[Load More / End of archive]
```

### Manual Change Reference

| What | Location |
|---|---|
| H1 text | ~line 165 · `"Blindspots"` |
| Tagline | ~lines 172–174 |
| Row 1 split | ~line 210 · `"7fr 5fr"` |
| Row 2 columns | ~line 218 · `"repeat(3, 1fr)"` |
| Big card image ratio | `BlindCard` component · `isBig ? "16/9" : "4/3"` |
| Summary truncation | ~line 79 · `.slice(0, isBig ? 200 : 110)` |
| Wide card summary | `WideCard` component · `.slice(0, 150)` |
| Card border | `BlindCard` · `"1px solid var(--c-outline-variant)"` |

---

## 10. Location — `src/pages/location.jsx`

### Layout Structure
```
[Navbar with city tabs]
[Hero: 8fr text panel + 4fr image]         stories[0]
[3-column article grid]                    stories[1..3]
[Wide feature card + Regional Briefs col]  stories[4] + stories[5..7]
[Analytics bars + Map placeholder]
[Auto-fill overflow grid]                  stories[8+]
```

### Manual Change Reference

| What | Location |
|---|---|
| City list | Line 8 · `const CITIES = [...]` |
| Analytics data | Lines 10–15 · `const ANALYTICS = [...]` |
| Hero column split | ~line 72 · `"8fr 4fr"` |
| Wide card + briefs split | ~line 221 · `"8fr 4fr"` |
| Analytics bar color | `index.css` · `.stat-bar-fill` |
| Location filter param | Passed to `useStories("all", null, activeCity)` |

---

## 11. About Us — `src/pages/aboutUs.jsx`

Uses a **fully dark theme** — does not inherit the global cream background.

### Color Constants (lines 3–8)
```js
const DARK   = "#1c1e17";              // page background
const CREAM  = "#fbf9f4";             // all text
const RED    = "#b6271a";             // accent color
const MUTED  = "rgba(251,249,244,0.62)"; // secondary text
const BORDER = "rgba(251,249,244,0.14)"; // dividers
const CARD   = "rgba(251,249,244,0.05)"; // card backgrounds
```

### Sections

| Section | Approx. Lines | Contents |
|---|---|---|
| Hero | ~64–110 | H1 + tagline on dark bg |
| Mission Quote | ~113–140 | Red background block |
| Our Values | ~143–197 | 4-card grid from `VALUES` array |
| Contributors | ~200–296 | 4-person grid from `CONTRIBUTORS` array |
| Our Story | ~299–364 | Timeline: 2024, 2025, 2026 |
| Get In Touch | ~367–412 | Contact email link |

### Manual Change Reference

| What | Location |
|---|---|
| Contributor names/roles/bios | Lines 11–32 · `CONTRIBUTORS` array |
| Values grid | Lines 34–53 · `VALUES` array |
| Timeline events | ~lines 330–336 · `[{ year, text }]` inline array |
| Contact email | ~lines 400, 410 |
| Dark background | Line 3 · `const DARK` |
| Accent red | Line 5 · `const RED` |

---

## 12. StoryDetail — `src/pages/storyDetail.jsx`

### Layout Structure
```
[Back button — "All Stories"]
[Category pill] · [tag · N sources]
[H1 Headline — large serif]
[Hero image (left 50%)]  [Key Points bullets (right 50%)]
[──── N articles covering this story ────]
[ArticleItem list]
```

| What | Location |
|---|---|
| H1 font size | ~line 121 · `clamp(30px, 5vw, 54px)` |
| Image aspect ratio | ~line 148 · `"4/3"` |
| Back button text | ~line 92 · `"All Stories"` |
| Article count text | ~line 174 · `"{story.articleCount} articles..."` |

---

## 13. Footer — `src/components/layout/Footer.jsx`

### Structure
```
[THE EDIFIED — large serif]
[Est. 2026 · Digital Broadsheet]
────────────────────────────────
[Our Mission]  [Contributors]  [Navigate links]
────────────────────────────────
[® THE EDIFIED · Est. 2026 · © year]
```

| What | Location |
|---|---|
| Site name | ~line 18 |
| Est. 2026 subtitle | ~line 28 |
| Mission text | ~lines 62–63 |
| Contributors | ~lines 82–83 · `"Pratyush · Palak / Raj · Diya"` |
| Nav links | ~lines 104–108 · `{ label, to }` array |

---

## 14. Data Hook — `src/hooks/useStories.js`

```js
useStories(category, maxArticles, location)
// Builds: GET /api/stories?page=1&limit=10&category=X&location=Y
```

| Param | Type | Effect |
|---|---|---|
| `category` | `"all"` or tag string | Filters by category |
| `maxArticles` | number or `null` | Min article count (Blindspots passes `2`) |
| `location` | city string or `null` | `?location=delhi` — needs DB tag support |

**API URL:** Line ~3 · `const API = "http://localhost:5000/api/stories"`

---

## 15. Quick Reference

### Change accent color everywhere
```
index.css ~line 22:   --c-secondary: #b6271a;
aboutUs.jsx line 5:   const RED = "#b6271a";
```

### Change the site name
```
Navbar.jsx ~line 58
Footer.jsx ~line 18
index.html line 8
```

### Change "Est. 2026" year
```
home.jsx ~line 44
Footer.jsx ~line 28
aboutUs.jsx ~line 84
```

### Replace hero image
```
1. Copy image to: client/public/your-image.jpg
2. home.jsx ~line 81:  src="/your-image.jpg"
```

### Change masthead size
```
index.css ~line 109:  .nav-masthead { font-size: 56px; }
Mobile override ~401: .nav-masthead { font-size: 36px; }
```

### Add a new city
```
location.jsx line 8:  const CITIES = [..., "newcity"]
Navbar.jsx line 20:   const CITIES = [..., "New City"]
```

### Change stories per page
```
useStories.js ~line 12:  limit: 10
```

---

## 16. Mobile Breakpoints (`index.css`)

| Breakpoint | Approx. Line | Effect |
|---|---|---|
| `max-width: 1024px` | ~422 | 12-col grid spans collapse to full width |
| `max-width: 900px` | ~444 | Editorial grids stack vertically |
| `max-width: 768px` | ~400 | Sidebar hidden, masthead 36px, nav shrinks |
