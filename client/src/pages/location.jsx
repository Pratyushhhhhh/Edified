import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import StoryCard from "../components/story/storyCard";
import useStories from "../hooks/useStories";

// High-coverage Indian states — only show what's actually in the DB
const LOCATIONS = [
  { label: "All India", val: "All India", icon: "flag" },
  { label: "New Delhi", val: "Delhi", icon: "location_city" },
  { label: "Uttar Pradesh", val: "Uttar Pradesh", icon: "temple_hindu" },
  { label: "Uttarakhand", val: "Uttarakhand", icon: "forest" },
  { label: "Manipur", val: "Manipur", icon: "crisis_alert" },
  { label: "Maharashtra", val: "Maharashtra", icon: "apartment" },
  { label: "West Bengal", val: "West Bengal", icon: "anchor" },
  { label: "Kerala", val: "Kerala", icon: "water" },
  { label: "Punjab", val: "Punjab", icon: "agriculture" },
];

const isRealImage = (url) => url && !url.includes("lh3.googleusercontent.com");
function getImg(story) {
  if (isRealImage(story.imageUrl)) return story.imageUrl;
  return story.articles?.find(a => isRealImage(a.imageUrl))?.imageUrl || null;
}

export default function Location() {
  const [activeLocation, setActiveLocation] = useState("All India");
  const navigate = useNavigate();

  const { stories, loading, loadingMore, error, hasMore, loadMore } = useStories("all", null, activeLocation);

  const hero = stories[0] || null;
  const secondary = stories.slice(1, 4);
  const rest = stories.slice(4);

  const activeLabel = LOCATIONS.find(l => l.val === activeLocation)?.label || "All India";

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      <div style={{ display: "flex", maxWidth: 1536, margin: "0 auto" }}>

        {/* ── Location Sidebar ─────────────────────────────────────────────── */}
        <aside className="sidebar" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--c-on-surface)",
              marginBottom: 4,
            }}>
              Regions
            </p>
            <p style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--c-outline)",
              fontFamily: "'Public Sans', sans-serif",
            }}>
              Browse by State
            </p>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {LOCATIONS.map(({ label, val, icon }) => (
              <button
                key={val}
                className={`sidebar-link${activeLocation === val ? " active" : ""}`}
                onClick={() => setActiveLocation(val)}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14, opacity: activeLocation === val ? 1 : 0.45 }}
                >
                  {icon}
                </span>
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, padding: "32px 32px 60px" }}>

          {/* Region header */}
          <div style={{ marginBottom: 28, paddingBottom: 16, borderBottom: "2px solid var(--c-on-surface)" }}>
            <p style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--c-secondary)",
              marginBottom: 6,
            }}>
              Location Coverage
            </p>
            <h1 style={{
              fontFamily: "'Newsreader', serif",
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.0,
              color: "var(--c-on-surface)",
            }}>
              {activeLabel}
            </h1>
          </div>

          {/* ── States ── */}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--c-outline)", fontFamily: "'Newsreader', serif", fontSize: 20, fontStyle: "italic" }}>
              Loading {activeLabel} stories...
            </div>
          )}
          {error && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ color: "var(--c-secondary)", fontSize: 14, marginBottom: 8 }}>Could not connect to the server.</p>
              <p style={{ color: "var(--c-outline)", fontSize: 12 }}>Make sure your backend is running on localhost:5000</p>
            </div>
          )}
          {!loading && !error && stories.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ color: "var(--c-outline)", fontFamily: "'Newsreader', serif", fontSize: 22, fontStyle: "italic", marginBottom: 12 }}>
                No stories tagged for {activeLabel} yet.
              </p>
              <p style={{ color: "var(--c-on-surface-variant)", fontSize: 13, fontFamily: "'Public Sans', sans-serif" }}>
                Run <code>python scraperv2/location_tagger.py</code> to tag your clusters.
              </p>
            </div>
          )}

          {!loading && !error && stories.length > 0 && (
            <>
              {/* ── Hero ── */}
              {hero && (
                <article
                  onClick={() => navigate(`/story/${hero._id}`)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: getImg(hero) ? "1fr 1fr" : "1fr",
                    border: "1px solid var(--c-on-surface)",
                    marginBottom: 32,
                    cursor: "pointer",
                    overflow: "hidden",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--c-surface-low)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ padding: 32 }}>
                    <span style={{ display: "block", fontFamily: "'Public Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--c-secondary)", marginBottom: 14 }}>
                      {activeLabel} · Top Story
                    </span>
                    <h2 style={{
                      fontFamily: "'Newsreader', serif",
                      fontSize: "clamp(22px, 3vw, 40px)",
                      fontWeight: 800,
                      lineHeight: 1.1,
                      letterSpacing: "-0.025em",
                      color: "var(--c-on-surface)",
                      marginBottom: 16,
                    }}>
                      {hero.generatedHeadline || hero.headline}
                    </h2>
                    {hero.summary?.[0] && (
                      <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 14, color: "var(--c-on-surface-variant)", lineHeight: 1.65, marginBottom: 20 }}>
                        {hero.summary[0].replace(/^POINT\s+\d+\s*[—\-–][^:]+:\s*/i, "").replace(/\s*\(Articles?:[\s\d,]+\)\s*$/i, "").slice(0, 220)}...
                      </p>
                    )}
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-outline)" }}>
                      {hero.articleCount} sources
                    </span>
                  </div>

                  {getImg(hero) && (
                    <div style={{ overflow: "hidden", minHeight: 280 }}>
                      <img
                        src={getImg(hero)}
                        alt={hero.headline}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  )}
                </article>
              )}

              {/* ── Secondary 3-col ── */}
              {secondary.length > 0 && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(secondary.length, 3)}, 1fr)`,
                  gap: 24,
                  marginBottom: 32,
                }}>
                  {secondary.map(s => (
                    <StoryCard key={s._id} story={s} variant="secondary" />
                  ))}
                </div>
              )}

              {/* ── More stories ── */}
              {rest.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--c-outline-variant)" }} />
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--c-outline)" }}>
                      More from {activeLabel}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "var(--c-outline-variant)" }} />
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 20,
                  }}>
                    {rest.map(s => (
                      <StoryCard key={s._id} story={s} variant="default" />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Load More ── */}
          {!loading && !error && hasMore && (
            <div style={{ textAlign: "center", padding: "52px 0 20px" }}>
              <button className="btn-load-more" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load More Stories"}
              </button>
            </div>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
}
