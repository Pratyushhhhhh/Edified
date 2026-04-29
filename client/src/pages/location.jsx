import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import StoryCard from "../components/story/storyCard";
import useStories from "../hooks/useStories";

const CITIES = ["delhi", "mumbai", "bangalore", "kolkata", "chennai", "hyderabad", "pune", "ahmedabad", "jaipur", "lucknow"];

const ANALYTICS = [
  { label: "Health Infrastructure",  value: 42.1, pct: 42 },
  { label: "Educational Access",     value: 56.8, pct: 57 },
  { label: "Public Green Space",     value: 12.4, pct: 12 },
  { label: "Transit Coverage",       value: 38.6, pct: 39 },
];

const isRealImage = (url) => url && !url.includes("lh3.googleusercontent.com");
function getImg(story) {
  if (isRealImage(story.imageUrl)) return story.imageUrl;
  return story.articles?.find(a => isRealImage(a.imageUrl))?.imageUrl || null;
}

export default function Location() {
  const [activeCity, setActiveCity] = useState("delhi");
  // Stories filtered by location tag — the server will support ?location= when tags are added
  const { stories, loading, loadingMore, error, hasMore, loadMore } = useStories("all", null, activeCity);

  const hero    = stories[0] || null;
  const gridCards = stories.slice(1, 4);
  const wideCard  = stories[4] || null;
  const briefs    = stories.slice(5, 8);
  const rest      = stories.slice(8);

  const navigate = useNavigate();
  const cityLabel = activeCity.charAt(0).toUpperCase() + activeCity.slice(1);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar activeCity={activeCity} onCityChange={setActiveCity} />

      <main style={{ maxWidth: 1536, margin: "0 auto", padding: "48px 40px" }}>

        {/* ── Loading / Error / Empty ── */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--c-outline)", fontFamily: "'Newsreader', serif", fontSize: 20, fontStyle: "italic" }}>
            Loading {cityLabel} stories...
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
            <p style={{ color: "var(--c-outline)", marginBottom: 8, fontFamily: "'Newsreader', serif", fontSize: 20, fontStyle: "italic" }}>
              No location stories for {cityLabel} yet.
            </p>
            <p style={{ color: "var(--c-on-surface-variant)", fontSize: 13, fontFamily: "'Public Sans', sans-serif" }}>
              Stories with a <strong>{activeCity}</strong> location tag will appear here once indexed.
            </p>
          </div>
        )}

        {!loading && !error && stories.length > 0 && (
          <>
            {/* ── Hero Section ── */}
            {hero && (
              <section style={{
                display: "grid",
                gridTemplateColumns: "8fr 4fr",
                border: "1px solid var(--c-on-surface)",
                marginBottom: 40,
                overflow: "hidden",
              }}>
                <div style={{
                  padding: 40,
                  borderRight: "1px solid var(--c-on-surface)",
                  background: "var(--c-surface-low)",
                  cursor: "pointer",
                }}
                  onClick={() => navigate(`/story/${hero._id}`)}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <span className="cat-pill">{cityLabel} Spotlight</span>
                    <span style={{ fontSize: 10, fontFamily: "'Public Sans', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--c-on-surface-variant)" }}>
                      {hero.articleCount} sources
                    </span>
                  </div>
                  <h1 style={{
                    fontFamily: "'Newsreader', serif",
                    fontSize: "clamp(28px, 4vw, 54px)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.0,
                    color: "var(--c-on-surface)",
                    marginBottom: 20,
                    transition: "color 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--c-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--c-on-surface)"}
                  >
                    {hero.headline}
                  </h1>
                  {hero.summary?.[0] && (
                    <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 16, color: "var(--c-on-surface-variant)", lineHeight: 1.65, maxWidth: 560, marginBottom: 24 }}>
                      {hero.summary[0]}
                    </p>
                  )}
                  <a
                    style={{
                      display: "inline-block",
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--c-on-surface)",
                      borderBottom: "1px solid var(--c-secondary)",
                      paddingBottom: 2,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={e => e.target.style.color = "var(--c-secondary)"}
                    onMouseLeave={e => e.target.style.color = "var(--c-on-surface)"}
                  >
                    Read Investigation
                  </a>
                </div>

                {/* Hero image */}
                <div style={{ position: "relative", minHeight: 360, overflow: "hidden" }}>
                  {getImg(hero) ? (
                    <img
                      src={getImg(hero)}
                      alt={hero.headline}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "filter 0.7s" }}
                      />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: "var(--c-surface-highest)" }} />
                  )}
                </div>
              </section>
            )}

            {/* ── 3-column grid ── */}
            {gridCards.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(gridCards.length, 3)}, 1fr)`,
                borderTop: "1px solid var(--c-on-surface)",
                borderLeft: "1px solid var(--c-on-surface)",
                marginBottom: 40,
              }}>
                {gridCards.map(story => (
                  <article
                    key={story._id}
                    onClick={() => navigate(`/story/${story._id}`)}
                    style={{
                      padding: 24,
                      borderRight: "1px solid var(--c-on-surface)",
                      borderBottom: "1px solid var(--c-on-surface)",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--c-surface-high)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--c-tertiary)", fontFamily: "'Public Sans', sans-serif" }}>
                        {story.category || "Local"}
                      </span>
                    </div>
                    <h2 style={{
                      fontFamily: "'Newsreader', serif",
                      fontSize: 20,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: "var(--c-on-surface)",
                      marginBottom: 14,
                      transition: "color 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--c-secondary)"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--c-on-surface)"}
                    >
                      {story.headline}
                    </h2>
                    {getImg(story) && (
                      <div style={{ height: 160, overflow: "hidden", marginBottom: 12 }}>
                        <img
                          src={getImg(story)}
                          alt={story.headline}
                          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "filter 0.5s" }}
                          />
                      </div>
                    )}
                    {story.summary?.[0] && (
                      <p style={{ fontSize: 13, color: "var(--c-on-surface-variant)", lineHeight: 1.6, fontFamily: "'Public Sans', sans-serif" }}>
                        {story.summary[0]?.slice(0, 100)}...
                      </p>
                    )}
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--c-outline-variant)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 9, fontFamily: "'Public Sans', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--c-on-surface-variant)" }}>
                        {story.articleCount} sources
                      </span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>north_east</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* ── Wide card + briefs row ── */}
            {(wideCard || briefs.length > 0) && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "8fr 4fr",
                border: "1px solid var(--c-on-surface)",
                marginBottom: 40,
              }}>
                {/* Wide feature */}
                {wideCard && (
                  <article
                    onClick={() => navigate(`/story/${wideCard._id}`)}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 0,
                      borderRight: "1px solid var(--c-on-surface)",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--c-surface-low)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ flex: 1, padding: 28 }}>
                      <span style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--c-secondary)", fontFamily: "'Public Sans', sans-serif", marginBottom: 12 }}>
                        Policy Brief
                      </span>
                      <h2 style={{
                        fontFamily: "'Newsreader', serif",
                        fontSize: 28,
                        fontWeight: 800,
                        lineHeight: 1.15,
                        color: "var(--c-on-surface)",
                        marginBottom: 16,
                        transition: "color 0.15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--c-secondary)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--c-on-surface)"}
                      >
                        {wideCard.headline}
                      </h2>
                      {wideCard.summary?.[0] && (
                        <p style={{ fontSize: 14, color: "var(--c-on-surface-variant)", lineHeight: 1.65, fontFamily: "'Public Sans', sans-serif" }}>
                          {wideCard.summary[0]?.slice(0, 180)}...
                        </p>
                      )}
                    </div>
                    {getImg(wideCard) && (
                      <div style={{ width: "40%", flexShrink: 0, overflow: "hidden" }}>
                        <img
                          src={getImg(wideCard)}
                          alt={wideCard.headline}
                          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "filter 0.5s" }}
                          />
                      </div>
                    )}
                  </article>
                )}

                {/* Regional briefs */}
                <div style={{ background: "var(--c-surface-highest)", padding: 24 }}>
                  <div style={{ borderBottom: "1px solid var(--c-on-surface)", paddingBottom: 10, marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                      Regional Briefs
                    </h3>
                  </div>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
                    {briefs.map(story => (
                      <li
                        key={story._id}
                        onClick={() => navigate(`/story/${story._id}`)}
                        style={{ borderBottom: "1px solid var(--c-outline-variant)", paddingBottom: 14, cursor: "pointer" }}
                      >
                        <span style={{ display: "block", fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--c-secondary)", fontFamily: "'Public Sans', sans-serif", marginBottom: 4 }}>
                          {story.category || "Local"}
                        </span>
                        <p
                          style={{ fontFamily: "'Newsreader', serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3, transition: "text-decoration 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                        >
                          {story.headline}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ── Location Analytics ── */}
            <section style={{ border: "1px solid var(--c-on-surface)", marginBottom: 40 }}>
              <div style={{ display: "grid", gridTemplateColumns: "4fr 8fr" }}>
                <div style={{ padding: 32, borderRight: "1px solid var(--c-on-surface)" }}>
                  <p style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--c-on-surface-variant)",
                    marginBottom: 16,
                    fontWeight: 600,
                  }}>
                    Location Analytics
                  </p>
                  <h2 style={{
                    fontFamily: "'Newsreader', serif",
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--c-on-surface)",
                    marginBottom: 16,
                  }}>
                    Visualizing Disparity.
                  </h2>
                  <p style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 13,
                    color: "var(--c-on-surface-variant)",
                    lineHeight: 1.6,
                    marginBottom: 28,
                  }}>
                    Our data mapping tracks resource allocation across municipal wards of {cityLabel}.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {ANALYTICS.map(({ label, value, pct }) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
                          <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--c-on-surface-variant)" }}>
                            {label}
                          </span>
                          <span style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 700, color: "var(--c-on-surface)" }}>
                            {value}%
                          </span>
                        </div>
                        <div style={{ height: 3, background: "var(--c-surface-highest)", overflow: "hidden" }}>
                          <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map placeholder */}
                <div style={{
                  background: "var(--c-surface-container)",
                  minHeight: 280,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 12,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--c-outline-variant)", opacity: 0.5 }}>map</span>
                  <p style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--c-outline)",
                    fontWeight: 600,
                  }}>
                    {cityLabel} &middot; Data Map
                  </p>
                </div>
              </div>
            </section>

            {/* Rest of stories */}
            {rest.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 24,
                marginBottom: 40,
              }}>
                {rest.map(s => (
                  <StoryCard key={s._id} story={s} variant="location" />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Load More ── */}
        {!loading && !error && hasMore && (
          <div style={{ textAlign: "center", padding: "52px 0 20px" }}>
            <button className="btn-load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
