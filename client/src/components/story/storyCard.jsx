import { useNavigate } from "react-router-dom";

export default function StoryCard({ story }) {
  const navigate = useNavigate();

  // Filter out Google News generic thumbnails — they show as broken/placeholder icons
  const isRealImage = (url) => url && !url.includes("lh3.googleusercontent.com");
  const displayImage = isRealImage(story.imageUrl)
    ? story.imageUrl
    : story.articles?.find(a => isRealImage(a.imageUrl))?.imageUrl || null;

  return (
    <div
      onClick={() => navigate(`/story/${story._id}`)}
      style={{
        background: "#fff", border: "1px solid #ddd9ce",
        cursor: "pointer", padding: "24px",
        transition: "box-shadow .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {displayImage && (
        <img src={displayImage} alt={story.headline}
          style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", marginBottom: "16px" }} />
      )}
      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".12em",
        textTransform: "uppercase", color: "#b8281e" }}>
        {story.category}
      </span>
      <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: "20px",
        fontWeight: 700, lineHeight: 1.2, color: "#31332C", margin: "8px 0 12px" }}>
        {story.headline}
      </h2>
      <p style={{ fontSize: "12px", color: "#9a9b95" }}>
        {story.articleCount} sources · {story.tags?.[0]}
      </p>
    </div>
  );
}