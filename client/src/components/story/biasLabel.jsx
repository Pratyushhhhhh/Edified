// Bias pill matching Stitch design palette
const PALETTE = {
  "left":         { bg: "#dbeafe", color: "#1e3a8a" },
  "center-left":  { bg: "#dcfce7", color: "#14532d" },
  "center":       { bg: "var(--c-surface-highest)", color: "var(--c-on-surface-variant)" },
  "center-right": { bg: "#fef3c7", color: "#92400e" },
  "right":        { bg: "#fee2e2", color: "#991b1b" },
};

export default function BiasLabel({ label }) {
  if (!label) return null;
  const style = PALETTE[label] || PALETTE["center"];

  return (
    <span className="bias-pill" style={{ background: style.bg, color: style.color }}>
      {label}
    </span>
  );
}