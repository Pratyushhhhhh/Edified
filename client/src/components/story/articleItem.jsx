import BiasLabel from "./biasLabel";

// Strip HTML tags from Google News RSS snippets which contain raw <a>, <font> etc.
function stripHtml(html) {
  if (!html) return "";
  // Remove all HTML tags, then decode common HTML entities
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function formatPublishedDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  return `Published on ${formattedDate} at ${formattedTime}`;
}

// One article row on the contrast page.
// Shows: headline (linked), source, author, snippet, bias pill.
export default function ArticleItem({ article, index }) {
  // Prefer summary_meta (clean) over snippet (may contain HTML from Google News RSS)
  const rawSnippet = article.summary_meta || article.snippet || "";
  const cleanSnippet = stripHtml(rawSnippet);

  return (
    <div style={{
      padding: "24px 20px",
      borderBottom: "1px solid #ddd9ce",
      animation: `fadeUp .4s ease ${index * 0.06}s both`,
      transition: "background .15s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "#f4f2ed"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Source + bias row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
        <span style={{
          fontSize: "10px", fontWeight: 700, letterSpacing: ".1em",
          textTransform: "uppercase", color: "#b8281e",
        }}>
          {article.source_name || article.source}
        </span>
        {article.author && (
          <>
            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#c4c0b6", display: "inline-block" }} />
            <span style={{ fontSize: "10px", color: "#9a9b95" }}>{article.author}</span>
          </>
        )}
        {article.publishedAt && (
          <>
            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#c4c0b6", display: "inline-block" }} />
            <span style={{ fontSize: "10px", color: "#9a9b95" }}>{formatPublishedDate(article.publishedAt)}</span>
          </>
        )}
        <span style={{ marginLeft: "auto" }}>
          <BiasLabel label={article.biasLabel} />
        </span>
      </div>

      {/* Headline + VISIT */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: "18px", fontWeight: 600,
            color: "#31332C", lineHeight: 1.35,
            textDecoration: "none", transition: "color .15s",
            flex: 1,
          }}
          onMouseEnter={e => e.target.style.color = "#b8281e"}
          onMouseLeave={e => e.target.style.color = "#31332C"}
        >
          {article.title}
        </a>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: "9px", fontWeight: 700, letterSpacing: ".14em",
            textTransform: "uppercase", color: "#b8281e",
            border: "1px solid #b8281e", padding: "4px 10px",
            borderRadius: "2px", whiteSpace: "nowrap",
            textDecoration: "none", transition: "all .15s",
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.target.style.background = "#b8281e"; e.target.style.color = "#fff"; }}
          onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#b8281e"; }}
        >
          VISIT
        </a>
      </div>

      {/* Snippet — cleaned of HTML */}
      {cleanSnippet && (
        <p style={{ fontSize: "13px", color: "#7a7c74", lineHeight: 1.65, margin: 0 }}>
          {cleanSnippet}
        </p>
      )}
    </div>
  );
}