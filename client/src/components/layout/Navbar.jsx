import { useNavigate } from "react-router-dom";

const CATEGORIES = ["All", "General", "World", "Politics", "Business", "Technology", "Science", "Health"];

export default function Navbar({ activeCategory, onCategoryChange }) {
  const navigate = useNavigate();

  return (
    <nav style={{
      borderBottom: "1px solid #ddd9ce",
      background: "#F8F6F1",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 48px",
        borderBottom: "1px solid #ddd9ce",
      }}>
        <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "#9a9b95" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>

        <span
          onClick={() => navigate("/")}
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: "22px", fontWeight: 700,
            letterSpacing: ".12em", textTransform: "uppercase",
            color: "#31332C", cursor: "pointer",
          }}
        >
          THE EDIFIED
        </span>

        <span style={{ fontSize: "11px", color: "#9a9b95", letterSpacing: ".06em" }}>
          EDITION · 2026
        </span>
      </div>

      {/* Category tabs */}
      <div style={{
        display: "flex", justifyContent: "center",
        gap: "36px", padding: "12px 48px",
        overflowX: "auto",
      }}>
        {CATEGORIES.map((cat) => {
          const val = cat.toLowerCase();
          const isActive = activeCategory === val;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange?.(val)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Public Sans', sans-serif",
                fontSize: "11px", fontWeight: 600,
                letterSpacing: ".12em", textTransform: "uppercase",
                color: isActive ? "#b8281e" : "#5a5c54",
                borderBottom: isActive ? "2px solid #b8281e" : "2px solid transparent",
                paddingBottom: "2px",
                transition: "color .15s, border-color .15s",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </nav>
  );
}