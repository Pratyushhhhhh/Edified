import { useNavigate } from "react-router-dom";

// One card on the cluster/home page.
// Clicking it navigates to the contrast page for that story.
export default function StoryCard({ story }) {
  const navigate = useNavigate();

  return (
    <article
      onClick={() => navigate(`/story/${story._id}`)}
      style={{
        background: "#FDFBF7",
        border: "1px solid #ddd9ce",
        borderRadius: "4px",
        padding: "24px",
        cursor: "pointer",
        transition: "border-color .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#b8281e"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#ddd9ce"}
    >
      {/* Category pill */}
      <div style={{ marginBottom: "12px" }}>
        <span style={{
          fontSize: "9px", fontWeight: 700, letterSpacing: ".14em",
          textTransform: "uppercase", color: "#b8281e",
          border: "1px solid #b8281e", padding: "2px 7px", borderRadius: "2px",
        }}>
          {story.category}
        </span>
      </div>

      {/* Hero image */}
      {story.imageUrl && (
        <img
          src={story.imageUrl}
          alt={story.headline}
          style={{
            width: "100%", aspectRatio: "16/9",
            objectFit: "cover", marginBottom: "16px",
            filter: "grayscale(15%)",
          }}
        />
      )}

      {/* Headline */}
      <h2 style={{
        fontFamily: "'Newsreader', Georgia, serif",
        fontSize: "20px", fontWeight: 700,
        lineHeight: 1.15, color: "#31332C",
        marginBottom: "12px", letterSpacing: "-.01em",
      }}>
        {story.headline}
      </h2>

      {/* First summary bullet */}
      {story.summary?.[0] && (
        <p style={{
          fontSize: "13px", color: "#5a5c54",
          lineHeight: 1.6, marginBottom: "16px",
        }}>
          {story.summary[0]}
        </p>
      )}

      {/* Footer — article count + tags */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid #e8e5dc", paddingTop: "12px",
      }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#31332C", textDecoration: "underline", textUnderlineOffset: "3px" }}>
          {story.articleCount || story.articles?.length || 0} articles
        </span>
        <span style={{ fontSize: "10px", color: "#9a9b95", textTransform: "uppercase", letterSpacing: ".08em" }}>
          {story.tags?.[0]}
        </span>
      </div>
    </article>
  );
}