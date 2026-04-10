import { useParams, useNavigate } from "react-router-dom";
import useContrast from "../hooks/useContrast";
import Navbar from "../components/layout/Navbar";
import ArticleItem from "../components/story/articleItem";

export default function StoryDetail() {
  const { id } = useParams();   // grabs the :id from the URL
  const navigate = useNavigate();
  const { story, loading, error } = useContrast(id);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      <Navbar />
      <div style={{ textAlign: "center", padding: "120px 0", color: "#9a9b95", fontFamily: "'Newsreader', serif", fontSize: "20px", fontStyle: "italic" }}>
        Loading story…
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      <Navbar />
      <div style={{ textAlign: "center", padding: "120px 24px" }}>
        <p style={{ color: "#b8281e", fontSize: "15px", marginBottom: "8px" }}>{error}</p>
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", color: "#5a5c54", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
        >
          ← Back to stories
        </button>
      </div>
    </div>
  );

  if (!story) return null;

  // When summary[] is empty (clusters data), show first 3 article titles instead
  const summaryPoints = story.summary?.length > 0
    ? story.summary
    : story.articles?.slice(0, 3).map(a => a.title) || [];

  // Filter out Google News generic thumbnails
  const isRealImage = (url) => url && !url.includes("lh3.googleusercontent.com");
  const heroImage = isRealImage(story.imageUrl)
    ? story.imageUrl
    : story.articles?.find(a => isRealImage(a.imageUrl))?.imageUrl || null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1" }}>
      <Navbar />

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "52px 24px 80px" }}>

        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "11px", fontWeight: 600, letterSpacing: ".08em",
            textTransform: "uppercase", color: "#9a9b95",
            marginBottom: "28px", display: "flex", alignItems: "center", gap: "6px",
            padding: 0, transition: "color .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#31332C"}
          onMouseLeave={e => e.currentTarget.style.color = "#9a9b95"}
        >
          ← All Stories
        </button>

        {/* ── Meta bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "22px" }}>
          <span style={{
            fontSize: "9px", fontWeight: 700, letterSpacing: ".14em",
            textTransform: "uppercase", color: "#b8281e",
            border: "1px solid #b8281e", padding: "3px 8px", borderRadius: "2px",
          }}>
            {story.category}
          </span>
          <span style={{ width: "32px", height: "1px", background: "#ddd9ce" }} />
          <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a9b95" }}>
            {story.tags?.[0]} · {story.articleCount} sources
          </span>
        </div>

        {/* ── Headline ── */}
        <h1 style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: "clamp(28px, 5vw, 50px)",
          fontWeight: 700, lineHeight: 1.08,
          letterSpacing: "-.02em", color: "#31332C",
          marginBottom: "36px",
          animation: "fadeUp .5s ease both",
        }}>
          {story.headline}
        </h1>

        {/* ── Image + Summary ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: heroImage ? "1fr 1fr" : "1fr",
          gap: "36px", marginBottom: "48px",
          animation: "fadeUp .5s ease .1s both",
        }}>
          {/* Hero image */}
          {heroImage && (
            <img
              src={heroImage}
              alt={story.headline}
              style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", filter: "grayscale(15%)" }}
            />
          )}

          {/* 3 summary bullet points (or article titles as fallback) */}
          <div>
            {summaryPoints.map((point, i) => (
              <div key={i} style={{
                display: "flex", gap: "14px",
                padding: "16px 0",
                borderBottom: "1px solid #ddd9ce",
                borderTop: i === 0 ? "1px solid #ddd9ce" : "none",
                animation: `fadeUp .5s ease ${0.15 + i * 0.08}s both`,
              }}>
                <span style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontSize: "11px", fontWeight: 500,
                  color: "#b8281e", minWidth: "18px",
                  paddingTop: "3px", fontStyle: "italic",
                }}>
                  {i + 1}.
                </span>
                <p style={{ fontSize: "13px", color: "#5a5c54", lineHeight: 1.65, margin: 0 }}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Article count divider ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "4px" }}>
          <span style={{ flex: 1, height: "1px", background: "#ddd9ce" }} />
          <span style={{
            fontSize: "12px", fontWeight: 600, letterSpacing: ".08em",
            textTransform: "uppercase", color: "#31332C",
            textDecoration: "underline", textUnderlineOffset: "3px",
          }}>
            {story.articleCount} articles
          </span>
          <span style={{ flex: 1, height: "1px", background: "#ddd9ce" }} />
        </div>

        {/* ── Article list ── */}
        <div>
          {story.articles?.map((article, i) => (
            <ArticleItem key={article._id} article={article} index={i} />
          ))}
        </div>

      </main>
    </div>
  );
}