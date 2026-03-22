import BiasLabel from "./biasLabel";

// One article row on the contrast page.
// Shows: headline (linked), source, author, read time, snippet, bias pill.
export default function ArticleItem({ article, index }) {
  return (
    <div style={{
      padding: "20px 0",
      borderBottom: "1px solid #ddd9ce",
      animation: `fadeUp .4s ease ${index * 0.06}s both`,
    }}>
      {/* Top row: headline + VISIT tag */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: "17px", fontWeight: 600,
            color: "#31332C", lineHeight: 1.3,
            textDecoration: "none", transition: "color .15s",
          }}
          onMouseEnter={e => e.target.style.color = "#b8281e"}
          onMouseLeave={e => e.target.style.color = "#31332C"}
        >
          {article.title}
        </a>
        <span style={{
          fontSize: "9px", fontWeight: 700, letterSpacing: ".14em",
          textTransform: "uppercase", color: "#b8281e",
          border: "1px solid #b8281e", padding: "2px 6px",
          borderRadius: "2px", whiteSpace: "nowrap",
        }}>
          VISIT
        </span>
      </div>

      {/* Meta row: source · author · bias */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a9b95" }}>
          {article.source}
        </span>
        {article.author && (
          <>
            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#ddd9ce", display: "inline-block" }} />
            <span style={{ fontSize: "10px", color: "#9a9b95" }}>{article.author}</span>
          </>
        )}
        <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#ddd9ce", display: "inline-block" }} />
        <BiasLabel label={article.biasLabel} />
      </div>

      {/* Snippet */}
      {article.snippet && (
        <p style={{ fontSize: "13px", color: "#5a5c54", lineHeight: 1.65 }}>
          {article.snippet}
        </p>
      )}
    </div>
  );
}