import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import StoryCard from "../components/story/storyCard";
import useStories from "../hooks/useStories";

export default function Home() {
  const [category, setCategory] = useState("all");
  const { stories, loading, error } = useStories(category);

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

        {/* States */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9a9b95", fontFamily: "'Newsreader', serif", fontSize: "18px", fontStyle: "italic" }}>
            Loading stories…
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "#b8281e", fontSize: "14px", marginBottom: "8px" }}>Could not connect to the server.</p>
            <p style={{ color: "#9a9b95", fontSize: "12px" }}>Make sure your backend is running on localhost:5000</p>
          </div>
        )}

        {/* Story card grid */}
        {!loading && !error && stories.length === 0 && (
          <p style={{ textAlign: "center", color: "#9a9b95", padding: "80px 0" }}>No stories found.</p>
        )}

        {!loading && !error && (
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
      </main>
    </div>
  );
}