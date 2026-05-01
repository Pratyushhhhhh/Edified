import { useNavigate } from "react-router-dom";

// Filter out Google News generic thumbnails
const isRealImage = (url) => url && !url.includes("lh3.googleusercontent.com");

function getDisplayImage(story) {
  if (isRealImage(story.imageUrl)) return story.imageUrl;
  return story.articles?.find(a => isRealImage(a.imageUrl))?.imageUrl || null;
}

// variant = "default" 
// "hero" | "secondary"
// "compact" 
// "location"
export default function StoryCard({ story, variant = "default" }) {
  const navigate = useNavigate();
  const displayImage = getDisplayImage(story);

  const handleClick = () => navigate(`/story/${story._id}`);

  if (variant === "hero") return <HeroCard story={story} displayImage={displayImage} onClick={handleClick} />;
  if (variant === "secondary") return <SecondaryCard story={story} displayImage={displayImage} onClick={handleClick} />;
  if (variant === "compact") return <CompactCard story={story} onClick={handleClick} />;
  if (variant === "location") return <LocationCard story={story} displayImage={displayImage} onClick={handleClick} />;

  return <DefaultCard story={story} displayImage={displayImage} onClick={handleClick} />;
}

//Hero 
function HeroCard({ story, displayImage, onClick }) {
  return (
    <article
      className="story-card-editorial"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {displayImage && (
        <div className="img-zoom" style={{ aspectRatio: "16/9", marginBottom: 20, overflow: "hidden" }}>
          <img src={displayImage} alt={story.headline} />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span className="cat-pill">{story.category || "General"}</span>
        <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-outline)", fontFamily: "'Public Sans', sans-serif" }}>
          {story.articleCount} sources
        </span>
      </div>
      <h2
        className="headline-hover"
        style={{
          fontFamily: "'Newsreader', serif",
          fontSize: "clamp(28px, 3.5vw, 44px)",
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          color: "var(--c-on-surface)",
          marginBottom: 14,
        }}
      >
        {story.headline}
      </h2>
      {story.summary?.[0] && (
        <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--c-on-surface-variant)", fontFamily: "'Public Sans', sans-serif", maxWidth: 680 }}>
          {story.summary[0]}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
        <div style={{ width: 32, height: 1, background: "var(--c-outline-variant)" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Public Sans', sans-serif" }}>
          {story.tags?.[0] || "News"}
        </span>
      </div>
    </article>
  );
}

// Secondary  
function SecondaryCard({ story, displayImage, onClick }) {
  return (
    <article
      className="story-card-editorial"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {displayImage && (
        <div className="img-zoom" style={{ aspectRatio: "4/3", marginBottom: 12, overflow: "hidden" }}>
          <img src={displayImage} alt={story.headline} />
        </div>
      )}
      <span style={{
        display: "block",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--c-tertiary)",
        fontFamily: "'Public Sans', sans-serif",
        marginBottom: 6,
      }}>
        {story.category || "General"}
      </span>
      <h3
        className="headline-hover"
        style={{
          fontFamily: "'Newsreader', serif",
          fontSize: 21,
          fontWeight: 700,
          lineHeight: 1.2,
          color: "var(--c-on-surface)",
          marginBottom: 8,
        }}
      >
        {story.headline}
      </h3>
      <p style={{ fontSize: 13, color: "var(--c-on-surface-variant)", lineHeight: 1.6, fontFamily: "'Public Sans', sans-serif" }}>
        {story.summary?.[0]?.slice(0, 120) || ""}
        {(story.summary?.[0]?.length > 120) ? "..." : ""}
      </p>
    </article>
  );
}

// Compact 
function CompactCard({ story, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        paddingBottom: 20,
        borderBottom: "1px solid var(--c-outline-variant)",
        cursor: "pointer",
      }}
    >
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
        {story.category || "General"}
      </span>
      <h4
        style={{
          fontFamily: "'Newsreader', serif",
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.25,
          color: "var(--c-on-surface)",
          marginBottom: 6,
          transition: "color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--c-secondary)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--c-on-surface)"}
      >
        {story.headline}
      </h4>
      <p style={{
        fontSize: 10,
        fontFamily: "'Public Sans', sans-serif",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--c-outline)",
      }}>
        {story.tags?.[0] || "Analysis"} &middot; {story.articleCount} sources
      </p>
    </div>
  );
}

// Location card 
function LocationCard({ story, displayImage, onClick }) {
  return (
    <article
      className="story-card-editorial"
      onClick={onClick}
      style={{
        cursor: "pointer",
        border: "1px solid var(--c-outline-variant)",
        padding: 20,
        borderRight: "1px solid var(--c-on-surface)",
        borderBottom: "1px solid var(--c-on-surface)",
        transition: "background 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--c-surface-high)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ marginBottom: 12 }}>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--c-tertiary)",
          fontFamily: "'Public Sans', sans-serif",
        }}>
          {story.category || "General"}
        </span>
      </div>
      <h2
        className="headline-hover"
        style={{
          fontFamily: "'Newsreader', serif",
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.2,
          color: "var(--c-on-surface)",
          marginBottom: 14,
        }}
      >
        {story.headline}
      </h2>
      {displayImage && (
        <div style={{ height: 160, overflow: "hidden", marginBottom: 12 }}>
          <img
            src={displayImage}
            alt={story.headline}
            className="img-grayscale"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      <p style={{ fontSize: 13, color: "var(--c-on-surface-variant)", lineHeight: 1.6, marginBottom: 14, fontFamily: "'Public Sans', sans-serif" }}>
        {story.summary?.[0]?.slice(0, 100) || ""}...
      </p>
      <div style={{
        borderTop: "1px solid var(--c-outline-variant)",
        paddingTop: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 9, fontFamily: "'Public Sans', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--c-on-surface-variant)" }}>
          {story.articleCount} sources
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--c-on-surface)" }}>north_east</span>
      </div>
    </article>
  );
}

// Default
function DefaultCard({ story, displayImage, onClick }) {
  return (
    <article
      onClick={onClick}
      style={{
        background: "var(--c-bg)",
        border: "1px solid var(--c-outline-variant)",
        cursor: "pointer",
        padding: "0 0 20px",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--c-surface-low)"}
      onMouseLeave={e => e.currentTarget.style.background = "var(--c-bg)"}
    >
      {displayImage && (
        <div style={{ aspectRatio: "16/9", overflow: "hidden", marginBottom: 16 }}>
          <img
            src={displayImage}
            alt={story.headline}
            className="img-grayscale"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      {!displayImage && (
        <div style={{ aspectRatio: "16/9", background: "var(--c-surface-highest)", marginBottom: 16 }} />
      )}
      <div style={{ padding: "0 16px" }}>
        <span className="cat-pill" style={{ marginBottom: 10, display: "inline-block" }}>
          {story.category || "General"}
        </span>
        <h2
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 19,
            fontWeight: 700,
            lineHeight: 1.25,
            color: "var(--c-on-surface)",
            marginBottom: 8,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--c-secondary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--c-on-surface)"}
        >
          {story.headline}
        </h2>
        <p style={{ fontSize: 12, color: "var(--c-outline)", fontFamily: "'Public Sans', sans-serif" }}>
          {story.articleCount} sources &middot; {story.tags?.[0] || ""}
        </p>
      </div>
    </article>
  );
}