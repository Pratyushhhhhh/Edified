import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import StoryCard from "../components/story/storyCard";
import useStories from "../hooks/useStories";

const SIDEBAR_CATS = [
  { label: "General",    val: "general",    icon: "newspaper" },
  { label: "World",      val: "world",       icon: "public" },
  { label: "Politics",   val: "politics",    icon: "gavel" },
  { label: "Business",   val: "business",    icon: "payments" },
  { label: "Science",    val: "science",     icon: "science" },
  { label: "Health",     val: "health",      icon: "health_and_safety" },
  { label: "Technology", val: "technology",  icon: "devices" },
  { label: "Sports",     val: "sports",      icon: "sports_cricket" },
];

const ORWELL_QUOTE = '\u201cTrue journalism is printing what someone else does not want printed; everything else is public relations.\u201d';


export default function Home() {
  const [category, setCategory] = useState("all");
  const { stories, loading, loadingMore, error, hasMore, loadMore } = useStories(category);

  const hero = stories[0] || null;
  const secondary = stories.slice(1, 3);
  const sidebarItems = stories.slice(3, 6);
  const gridStories = stories.slice(6);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar
        activeCategory={category}
        onCategoryChange={setCategory}
      />

      {/* ── Full-width intro hero (spans full viewport) ── */}
      <header style={{
        maxWidth: 1536,
        margin: "0 auto",
        padding: "36px 40px",
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        borderBottom: "1px solid var(--c-outline-variant)",
      }}>
        {/* Left: text — no maxWidth constraint, fills all remaining space */}
        <div style={{ flex: 1, paddingRight: 40 }}>
          <span style={{
            display: "block",
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--c-secondary)",
            marginBottom: 20,
          }}>
            Est. 2026
          </span>
          <h1 style={{
            fontFamily: "'Newsreader', serif",
            fontSize: "clamp(40px, 5vw, 72px)",
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: "var(--c-on-surface)",
            marginBottom: 24,
          }}>
            Rigorous inquiry for a nuanced world.
          </h1>
          <p style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 19,
            fontStyle: "italic",
            color: "var(--c-on-surface-variant)",
            lineHeight: 1.55,
          }}>
            The Edified provides a panoramic view of global shifts, combining archival depth
            with immediate digital relevance. No fluff. No clickbait. Just the weight of the word.
          </p>
        </div>

        {/* Right: hero image */}
        <div style={{ width: 340, flexShrink: 0, overflow: "hidden" }}>
          <img
            src="/toi-hero.jpg"
            alt="The Edified Editorial"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </header>

      {/* ── Sidebar + Main (below the intro) ── */}
      <div style={{ display: "flex", maxWidth: 1536, margin: "0 auto" }}>
        {/* ── Desktop sidebar ── */}
        <aside className="sidebar" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 24 }}>
            <p style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--c-on-surface)",
              marginBottom: 4,
            }}>
              Sections
            </p>
            <p style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--c-outline)",
              fontFamily: "'Public Sans', sans-serif",
            }}>
              The Daily Ledger
            </p>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <button
              className={`sidebar-link${!category || category === "all" ? " active" : ""}`}
              onClick={() => setCategory("all")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>apps</span>
              All
            </button>
            {SIDEBAR_CATS.map(({ label, val, icon }) => (
              <button
                key={val}
                className={`sidebar-link${category === val ? " active" : ""}`}
                onClick={() => setCategory(val)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main canvas ── */}
        <main style={{ flex: 1, minWidth: 0, padding: "32px 32px 24px" }}>

          {/* ── States: loading / error / empty ── */}
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--c-outline)", fontFamily: "'Newsreader', serif", fontSize: 20, fontStyle: "italic" }}>
              Loading stories...
            </div>
          )}
          {error && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ color: "var(--c-secondary)", fontSize: 14, marginBottom: 8 }}>Could not connect to the server.</p>
              <p style={{ color: "var(--c-outline)", fontSize: 12 }}>Make sure your backend is running on localhost:5000</p>
            </div>
          )}
          {!loading && !error && stories.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--c-outline)", padding: "80px 0" }}>No stories found.</p>
          )}

          {/* ── Editorial grid ── */}
          {!loading && !error && stories.length > 0 && (
            <section style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 0,
            }}>
              {/* Left: hero + secondary 2-col */}

              <div style={{
                gridColumn: "span 8",
                display: "flex",
                flexDirection: "column",
                gap: 48,
                paddingRight: 48,
                borderRight: "1px solid var(--c-outline-variant)",
              }}>
                {/* Hero story */}
                {hero && <StoryCard story={hero} variant="hero" />}

                {/* Secondary 2-col */}
                {secondary.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 40,
                    paddingTop: 40,
                    borderTop: "1px solid var(--c-outline-variant)",
                  }}>
                    {secondary.map(s => (
                      <StoryCard key={s._id} story={s} variant="secondary" />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Blindspots rail */}
              <div style={{
                gridColumn: "span 4",
                paddingLeft: 32,
              }}>
                <div style={{ position: "sticky", top: 120 }}>
                  <h2 style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--c-on-surface)",
                    marginBottom: 24,
                    paddingBottom: 14,
                    borderBottom: "2px solid var(--c-on-surface)",
                  }}>
                    The Blindspots
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {sidebarItems.length > 0 ? (
                      sidebarItems.map(s => (
                        <StoryCard key={s._id} story={s} variant="compact" />
                      ))
                    ) : (
                      /* Placeholder items while loading more */
                      ["Politics", "World", "Economy"].map(cat => (
                        <div key={cat} style={{
                          paddingBottom: 20,
                          borderBottom: "1px solid var(--c-outline-variant)",
                        }}>
                          <span style={{
                            display: "block",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: "var(--c-secondary)",
                            fontFamily: "'Public Sans', sans-serif",
                            marginBottom: 6,
                          }}>
                            {cat}
                          </span>
                          <div style={{ height: 14, background: "var(--c-surface-highest)", marginBottom: 6 }} />
                          <div style={{ height: 14, background: "var(--c-surface-highest)", width: "70%" }} />
                        </div>
                      ))
                    )}

                    {/* Quote block */}
                    <div style={{
                      background: "var(--c-surface-low)",
                      padding: 20,
                      border: "1px solid var(--c-outline-variant)",
                    }}>
                      <p style={{
                        fontFamily: "'Newsreader', serif",
                        fontSize: 15,
                        fontStyle: "italic",
                        lineHeight: 1.5,
                        marginBottom: 10,
                        color: "var(--c-on-surface)",
                      }}>
                        {ORWELL_QUOTE}
                      </p>
                      <p style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}>
                        - George Orwell
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <button
                      className="btn-solid"
                      onClick={() => window.location.href = "/blindspots"}
                    >
                      View Full Archive
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── More stories grid ── */}
          {!loading && !error && gridStories.length > 0 && (
            <section style={{ marginTop: 64 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 32,
              }}>
                <div style={{ flex: 1, height: 1, background: "var(--c-outline-variant)" }} />
                <span style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--c-outline)",
                }}>
                  More Stories
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--c-outline-variant)" }} />
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 24,
              }}>
                {gridStories.map(s => (
                  <StoryCard key={s._id} story={s} variant="default" />
                ))}
              </div>
            </section>
          )}

          {/* ── Load More ── */}
          {!loading && !error && hasMore && (
            <div style={{ textAlign: "center", padding: "52px 0 20px" }}>
              <button
                className="btn-load-more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More Stories"}
              </button>
            </div>
          )}

          {/* ── End indicator ── */}
          {!loading && !error && !hasMore && stories.length > 6 && (
            <div style={{
              textAlign: "center", padding: "44px 0 20px",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <span style={{ flex: 1, height: 1, background: "var(--c-outline-variant)" }} />
              <span style={{
                fontSize: 11, fontWeight: 500, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--c-outline)",
                fontFamily: "'Newsreader', serif", fontStyle: "italic",
              }}>
                You've reached the end
              </span>
              <span style={{ flex: 1, height: 1, background: "var(--c-outline-variant)" }} />
            </div>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
}