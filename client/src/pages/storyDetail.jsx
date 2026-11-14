import { useParams, useNavigate } from "react-router-dom";
import useContrast from "../hooks/useContrast";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ArticleItem from "../components/story/articleItem";
import StoryChat from "../components/rag/StoryChat";

const isRealImage = (url) => url && !url.includes("lh3.googleusercontent.com");

/** Strip LLM formatting artifacts from a summary point string while preserving article citations. */
function cleanPoint(raw) {
  if (!raw) return "";
  let text = raw;
  // Remove leading "HEADLINE: " prefix
  text = text.replace(/^HEADLINE:\s*/i, "");
  // Remove leading "POINT N — Some label:\n?" prefix
  text = text.replace(/^POINT\s+\d+\s*[—\-–:]\s*[^:\n]*:\s*\n?/i, "");
  // Remove orphaned leftover labels like "POINT 1 — ..." mid-text
  text = text.replace(/POINT\s+\d+\s*[—\-–:]\s*[^:\n]*:\s*/gi, "");
  return text.trim();
}

export default function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { story, loading, error } = useContrast(id);

  if (loading) return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div style={{
        textAlign: "center",
        padding: "120px 0",
        color: "var(--c-outline)",
        fontFamily: "'Newsreader', serif",
        fontSize: 22,
        fontStyle: "italic",
      }}>
        Loading story...
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div style={{ textAlign: "center", padding: "120px 24px" }}>
        <p style={{ color: "var(--c-secondary)", fontSize: 15, marginBottom: 8 }}>{error}</p>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "var(--c-outline)",
            fontSize: 13,
            cursor: "pointer",
            textDecoration: "underline",
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Back to stories
        </button>
      </div>
    </div>
  );

  if (!story) return null;

  const POINT_LABELS = [
    "Mainstream Narrative",
    "Alternative Perspectives & Diverging Narratives",
    "Verified Hard Facts",
  ];

  const summaryPoints = story.summary?.length > 0
    ? story.summary.map(cleanPoint).filter(Boolean)
    : story.articles?.slice(0, 3).map(a => a.title) || [];

  const heroImage = isRealImage(story.imageUrl)
    ? story.imageUrl
    : story.articles?.find(a => isRealImage(a.imageUrl))?.imageUrl || null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "48px 40px 80px", animation: "fadeUp 0.4s ease both" }}>

        {/* ── Back button ── */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--c-outline)",
            marginBottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--c-on-surface)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--c-outline)"}
        >
          &larr; All Stories
        </button>

        {/* ── Meta bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--c-secondary)",
            border: "1px solid var(--c-secondary)",
            padding: "3px 8px",
          }}>
            {story.category}
          </span>
          <span style={{ width: 32, height: 1, background: "var(--c-outline-variant)", display: "inline-block" }} />
          <span style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--c-outline)",
          }}>
            {story.tags?.[0]} &middot; {story.articleCount} sources
          </span>
        </div>

        {/* ── Headline ── */}
        <h1 style={{
          fontFamily: "'Newsreader', serif",
          fontSize: "clamp(32px, 4.8vw, 56px)",
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          color: "var(--c-on-surface)",
          maxWidth: 1200,
          marginBottom: 44,
        }}>
          {story.headline}
        </h1>

        {/* ── Hero image + summary ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: heroImage ? "minmax(320px, 460px) 1fr" : "1fr",
          gap: 48,
          alignItems: "start",
          marginBottom: 56,
        }}>
          {heroImage && (
            <div style={{
              overflow: "hidden",
              border: "1px solid var(--c-outline-variant)",
              borderRadius: 2,
              background: "var(--c-surface-low)",
            }}>
              <img
                src={heroImage}
                alt={story.headline}
                style={{
                  width: "100%",
                  maxHeight: 460,
                  aspectRatio: "16/11",
                  objectFit: "cover",
                  display: "block",
                  transition: "filter 0.5s",
                }}
              />
            </div>
          )}

          <div>
            <p style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--c-secondary)",
              marginBottom: 16,
            }}>
              Key Points
            </p>
            {summaryPoints.map((point, i) => (
              <div
                key={i}
                style={{
                  padding: "18px 0",
                  borderBottom: "1px solid var(--c-outline-variant)",
                  borderTop: i === 0 ? "1px solid var(--c-outline-variant)" : "none",
                  animation: `fadeUp 0.4s ease ${0.1 + i * 0.07}s both`,
                }}
              >
                <p style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--c-secondary)",
                  marginBottom: 8,
                  opacity: 0.85,
                }}>
                  {POINT_LABELS[i] ?? `Point ${i + 1}`}
                </p>
                <p style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 14.5,
                  color: "var(--c-on-surface-variant)",
                  lineHeight: 1.75,
                  margin: 0,
                }}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Article count divider ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 8,
        }}>
          <span style={{ flex: 1, height: 1, background: "var(--c-outline-variant)" }} />
          <span style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--c-on-surface)",
            borderBottom: "1px solid var(--c-on-surface)",
            paddingBottom: 2,
          }}>
            {story.articleCount} articles covering this story
          </span>
          <span style={{ flex: 1, height: 1, background: "var(--c-outline-variant)" }} />
        </div>

        {/* ── Article list ── */}
        <div>
          {story.articles?.map((article, i) => (
            <ArticleItem key={article._id || i} article={article} index={i} />
          ))}
        </div>

      </main>

      {/* Story-specific RAG chatbot drawer — visible ONLY on story cluster page */}
      <StoryChat story={story} />

      <Footer />
    </div>
  );
}