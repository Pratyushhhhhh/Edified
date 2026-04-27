// Renders a small coloured pill showing the bias label of an article.
// Used on both the StoryCard and ArticleItem components.
const COLORS = {
  "left": { bg: "#dbeafe", color: "#1e3a8a" },
  "center-left": { bg: "#dcfce7", color: "#14532d" },
  "center": { bg: "#f3f4f6", color: "#374151" },
  "center-right": { bg: "#fef3c7", color: "#92400e" },
  "right": { bg: "#fee2e2", color: "#991b1b" },
};

export default function BiasLabel({ label }) {
  if (!label) return null;
  const style = COLORS[label] || COLORS["center"];

  return (
    <span style={{
      display: "inline-block",
      fontSize: "9px",
      fontWeight: 700,
      letterSpacing: ".1em",
      textTransform: "uppercase",
      padding: "2px 7px",
      borderRadius: "2px",
      background: style.bg,
      color: style.color,
    }}>
      {label}
    </span>
  );
}