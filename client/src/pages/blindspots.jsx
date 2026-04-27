import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import useStories from "../hooks/useStories";

const isRealImage = (url) => url && !url.includes("lh3.googleusercontent.com");
function getImg(story) {
  if (isRealImage(story.imageUrl)) return story.imageUrl;
  return story.articles?.find(a => isRealImage(a.imageUrl))?.imageUrl || null;
}

function BlindCard({ story, navigate, size = "default" }) {
  const img = getImg(story);
  const isBig = size === "big";

  return (
    <article
      onClick={() => navigate(`/story/${story._id}`)}
      style={{
        background: "var(--c-bg)",
        border: "1px solid var(--c-outline-variant)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, background 0.2s",
        overflow: "hidden",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--c-surface-low)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(49,51,44,0.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--c-bg)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Image */}
      {img && (
        <div style={{ overflow: "hidden", aspectRatio: isBig ? "16/9" : "4/3" }}>
          <img
            src={img}
            alt={story.headline}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s", display: "block" }}
            onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          />
        </div>
      )}
      {!img && <div style={{ aspectRatio: isBig ? "16/9" : "4/3", background: "var(--c-surface-highest)" }} />}

      {/* Content */}
      <div style={{ padding: isBig ? "24px 28px 28px" : "18px 20px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <span style={{
          display: "block",
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--c-secondary)",
          marginBottom: 10,
        }}>
          {story.category || "General"}
        </span>
        <h2
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: isBig ? 28 : 19,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "var(--c-on-surface)",
            marginBottom: 12,
            transition: "color 0.15s",
            flex: 1,
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--c-secondary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--c-on-surface)"}
        >
          {story.headline}
        </h2>
        {story.summary?.[0] && (
          <p style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: isBig ? 15 : 13,
            color: "var(--c-on-surface-variant)",
            lineHeight: 1.65,
            marginBottom: 16,
          }}>
            {story.summary[0].slice(0, isBig ? 200 : 110)}...
          </p>
        )}
        <div style={{
          borderTop: "1px solid var(--c-outline-variant)",
          paddingTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-outline)" }}>
            {story.articleCount} sources
          </span>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--c-secondary)" }}>north_east</span>
        </div>
      </div>
    </article>
  );
}

function WideCard({ story, navigate }) {
  const img = getImg(story);
  return (
    <article
      onClick={() => navigate(`/story/${story._id}`)}
      style={{
        background: "var(--c-bg)",
        border: "1px solid var(--c-outline-variant)",
        cursor: "pointer",
        display: "flex",
        overflow: "hidden",
        minHeight: 220,
        transition: "box-shadow 0.2s, background 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--c-surface-low)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(49,51,44,0.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--c-bg)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span style={{ display: "block", fontFamily: "'Public Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--c-secondary)", marginBottom: 12 }}>
          {story.category || "General"}
        </span>
        <h2
          style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: "var(--c-on-surface)", marginBottom: 12, transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--c-secondary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--c-on-surface)"}
        >
          {story.headline}
        </h2>
        {story.summary?.[0] && (
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 14, color: "var(--c-on-surface-variant)", lineHeight: 1.65 }}>
            {story.summary[0].slice(0, 150)}...
          </p>
        )}
      </div>
      {img && (
        <div style={{ width: "38%", flexShrink: 0, overflow: "hidden" }}>
          <img src={img} alt={story.headline} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
            onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          />
        </div>
      )}
    </article>
  );
}

export default function Blindspots() {
  const [category, setCategory] = useState("all");
  const { stories, loading, loadingMore, error, hasMore, loadMore } = useStories(category, 2);
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar activeCategory={category} onCategoryChange={setCategory} />

      <main style={{ maxWidth: 1536, margin: "0 auto", padding: "48px 40px" }}>

        {/* Section header */}
        <div style={{ marginBottom: 48 }}>
          <span style={{
            display: "block",
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--c-secondary)",
            marginBottom: 12,
          }}>
            Editorial Intelligence
          </span>
          <h1 style={{
            fontFamily: "'Newsreader', serif",
            fontSize: "clamp(52px, 7vw, 88px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "var(--c-on-surface)",
            lineHeight: 1,
            marginBottom: 20,
          }}>
            Blindspots
          </h1>
          <p style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 19,
            fontStyle: "italic",
            color: "var(--c-on-surface-variant)",
            lineHeight: 1.55,
            maxWidth: 640,
          }}>
            Illuminating the perspectives traditional news cycles overlook. Underreported narratives,
            emerging shifts, and essential nuance.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 2, background: "var(--c-on-surface)", marginBottom: 40 }} />

        {/* States */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--c-outline)", fontFamily: "'Newsreader', serif", fontSize: 20, fontStyle: "italic" }}>
            Loading blindspots...
          </div>
        )}
        {error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "var(--c-secondary)", fontSize: 14, marginBottom: 8 }}>Could not connect to the server.</p>
            <p style={{ color: "var(--c-outline)", fontSize: 12 }}>Make sure your backend is running on localhost:5000</p>
          </div>
        )}
        {!loading && !error && stories.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--c-outline)", padding: "80px 0" }}>No blindspots found.</p>
        )}

        {!loading && !error && stories.length > 0 && (
          <>
            {/* Row 1: Big featured (7/12) + side (5/12) */}
            {stories[0] && (
              <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 24, marginBottom: 24 }}>
                <BlindCard story={stories[0]} navigate={navigate} size="big" />
                {stories[1] && <BlindCard story={stories[1]} navigate={navigate} size="default" />}
              </div>
            )}

            {/* Row 2: 3-col grid */}
            {stories.slice(2, 5).length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 24 }}>
                {stories.slice(2, 5).map(s => (
                  <BlindCard key={s._id} story={s} navigate={navigate} />
                ))}
              </div>
            )}

            {/* Row 3: Wide horizontal cards */}
            {stories.slice(5, 7).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
                {stories.slice(5, 7).map(s => (
                  <WideCard key={s._id} story={s} navigate={navigate} />
                ))}
              </div>
            )}

            {/* Row 4: Additional 4-col grid */}
            {stories.slice(7).length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, marginBottom: 24 }}>
                {stories.slice(7).map(s => (
                  <BlindCard key={s._id} story={s} navigate={navigate} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Load More */}
        {!loading && !error && hasMore && (
          <div style={{ textAlign: "center", padding: "48px 0 20px" }}>
            <button className="btn-load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load Archive Reports"}
            </button>
          </div>
        )}

        {!loading && !error && !hasMore && stories.length > 0 && (
          <div style={{ textAlign: "center", padding: "40px 0 20px", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ flex: 1, height: 1, background: "var(--c-outline-variant)" }} />
            <span style={{ fontSize: 11, fontFamily: "'Newsreader', serif", fontStyle: "italic", color: "var(--c-outline)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              End of archive
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--c-outline-variant)" }} />
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
