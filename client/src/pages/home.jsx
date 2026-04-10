import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import StoryCard from "../components/story/storyCard";
import useStories from "../hooks/useStories";

export default function Home() {
  const [category, setCategory] = useState("all");
  const { stories, loading, loadingMore, error, hasMore, loadMore } = useStories(category);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      <Navbar activeCategory={category} onCategoryChange={setCategory} />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Page header */}
        <div style={{ marginBottom: "40px", borderBottom: "1px solid #ddd9ce", paddingBottom: "20px" }}>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: "13px", fontWeight: 400,
            letterSpacing: ".12em", textTransform: "uppercase",
            color: "#9a9b95", marginBottom: "8px",
          }}>
            Today's stories
          </h1>
          <p style={{ fontSize: "13px", color: "#5a5c54" }}>
            Similar articles from different outlets, grouped into one story. Click any card to compare coverage.
          </p>
        </div>

        {/* Initial loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9a9b95", fontFamily: "'Newsreader', serif", fontSize: "18px", fontStyle: "italic" }}>
            Loading stories…
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "#b8281e", fontSize: "14px", marginBottom: "8px" }}>Could not connect to the server.</p>
            <p style={{ color: "#9a9b95", fontSize: "12px" }}>Make sure your backend is running on localhost:5000</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && stories.length === 0 && (
          <p style={{ textAlign: "center", color: "#9a9b95", padding: "80px 0" }}>No stories found.</p>
        )}

        {/* Story card grid */}
        {!loading && !error && stories.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}>
            {stories.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))}
          </div>
        )}

        {/* ── Load More Button ── */}
        {!loading && !error && hasMore && (
          <div style={{ textAlign: "center", padding: "52px 0 20px" }}>
            <button
              id="load-more-btn"
              onClick={() => loadMore()}
              disabled={loadingMore}
              style={{
                background: loadingMore ? "#e8e6e0" : "transparent",
                border: "1.5px solid #31332C",
                cursor: loadingMore ? "wait" : "pointer",
                fontFamily: "'Public Sans', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: loadingMore ? "#9a9b95" : "#31332C",
                padding: "14px 48px",
                borderRadius: "3px",
                transition: "all .25s ease",
              }}
              onMouseEnter={(e) => {
                if (!loadingMore) {
                  e.currentTarget.style.background = "#31332C";
                  e.currentTarget.style.color = "#F8F6F1";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.15)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = loadingMore ? "#e8e6e0" : "transparent";
                e.currentTarget.style.color = loadingMore ? "#9a9b95" : "#31332C";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {loadingMore ? "Loading…" : "Load More Stories"}
            </button>
          </div>
        )}

        {/* ── End indicator ── */}
        {!loading && !error && !hasMore && stories.length > 10 && (
          <div style={{
            textAlign: "center", padding: "44px 0 20px",
            display: "flex", alignItems: "center", gap: "16px",
          }}>
            <span style={{ flex: 1, height: "1px", background: "#ddd9ce" }} />
            <span style={{
              fontSize: "11px", fontWeight: 500, letterSpacing: ".08em",
              textTransform: "uppercase", color: "#9a9b95",
              fontFamily: "'Newsreader', serif", fontStyle: "italic",
            }}>
              You've reached the end
            </span>
            <span style={{ flex: 1, height: "1px", background: "#ddd9ce" }} />
          </div>
        )}

      </main>
    </div>
  );
}