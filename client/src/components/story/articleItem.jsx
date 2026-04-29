import BiasLabel from "./biasLabel";

function stripHtml(html) {
  if (!html) return "";
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

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ArticleItem({ article, index }) {
  const rawSnippet = article.summary_meta || article.snippet || "";
  const cleanSnippet = stripHtml(rawSnippet);

  return (
    <div
      className="article-row"
      style={{ animation: `fadeUp 0.4s ease ${index * 0.05}s both` }}
    >
      {/* Source + meta + bias */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--c-secondary)",
        }}>
          {article.source_name || article.source}
        </span>

        {article.author && (
          <>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--c-outline-variant)", display: "inline-block" }} />
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, color: "var(--c-outline)" }}>
              {article.author}
            </span>
          </>
        )}

        {article.publishedAt && (
          <>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--c-outline-variant)", display: "inline-block" }} />
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, color: "var(--c-outline)" }}>
              {formatDate(article.publishedAt)}
            </span>
          </>
        )}

        <span style={{ marginLeft: "auto" }}>
          <BiasLabel label={article.biasLabel} />
        </span>
      </div>

      {/* Headline + Visit button */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 10 }}>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 20,
            fontWeight: 600,
            color: "var(--c-on-surface)",
            lineHeight: 1.3,
            textDecoration: "none",
            flex: 1,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.target.style.color = "var(--c-secondary)"}
          onMouseLeave={e => e.target.style.color = "var(--c-on-surface)"}
        >
          {article.title}
        </a>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="visit-btn"
        >
          VISIT
        </a>
      </div>

      {/* Snippet */}
      {cleanSnippet && (
        <p style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 13,
          color: "var(--c-on-surface-variant)",
          lineHeight: 1.65,
          margin: 0,
        }}>
          {cleanSnippet}
        </p>
      )}
    </div>
  );
}