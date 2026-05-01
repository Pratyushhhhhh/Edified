import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const DARK   = "#1c1e17";
const CREAM  = "#fbf9f4";
const RED    = "#b6271a";
const MUTED  = "rgba(251,249,244,0.62)";
const BORDER = "rgba(251,249,244,0.14)";
const CARD   = "rgba(251,249,244,0.05)";

const CONTRIBUTORS = [
  {
    name: "Pratyush",
    role: "Founder & Lead Developer",
    bio: "Built the Edified from scratch - backend pipeline, RSS aggregation, clustering engine, and the full-stack architecture powering the newsroom.",
  },
  {
    name: "Palak",
    role: "Editorial Lead",
    bio: "Shapes the editorial voice and content strategy. Ensures every story cluster reflects journalistic integrity and reader-first thinking.",
  },
  {
    name: "Raj",
    role: "Data & Infrastructure",
    bio: "Handles the data pipeline, database design, and scraper reliability. Keeps the machine running clean.",
  },
  {
    name: "Diya",
    role: "Design & UX",
    bio: "Crafted the visual identity of The Edified - the broadsheet aesthetic, color system, typography, and the overall user experience.",
  },
];

const VALUES = [
  {
    icon: "verified",
    title: "Accuracy First",
    desc: "Every claim verified through multiple independent sources. Corrections issued prominently, without delay.",
  },
  {
    icon: "balance",
    title: "Perspective Equity",
    desc: "We actively surface voices underrepresented in mainstream discourse - regional, linguistic, and socioeconomic.",
  },
  {
    icon: "lock",
    title: "Editorial Independence",
    desc: "No shareholder, advertiser, or political party influences what we publish. Funded by our readers.",
  },
  {
    icon: "public",
    title: "Global Lens",
    desc: "Local stories in a global context. Global events filtered through their local impact. Always both.",
  },
];

export default function AboutUs() {
  return (
    <div style={{ minHeight: "100vh", background: DARK }}>
      <Navbar />

      <main>

        {/* ── Hero ── */}
        <section style={{ padding: "88px 40px 72px", borderBottom: `1px solid ${BORDER}`, maxWidth: 1536, margin: "0 auto" }}>
          <span style={{
            display: "block",
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: RED,
            marginBottom: 24,
          }}>
            About Us &middot; Est. 2026
          </span>
          <h1 style={{
            fontFamily: "'Newsreader', serif",
            fontSize: "clamp(44px, 7vw, 88px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            color: CREAM,
            maxWidth: 900,
            marginBottom: 36,
          }}>
            Rigorous inquiry for a nuanced world.
          </h1>
          <p style={{
            fontFamily: "'Newsreader', serif",
            fontSize: "clamp(17px, 2vw, 22px)",
            fontStyle: "italic",
            color: MUTED,
            lineHeight: 1.55,
            maxWidth: 680,
          }}>
            The Edified was founded on a simple, radical premise: that readers deserve journalism
            which treats complexity as a feature, not a bug. A digital broadsheet for citizens who
            refuse to settle for headlines.
          </p>
        </section>

        {/* ── Mission quote ── */}
        <section style={{ background: RED, padding: "64px 40px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
            <p style={{
              fontFamily: "'Newsreader', serif",
              fontSize: "clamp(20px, 3vw, 32px)",
              fontStyle: "italic",
              color: CREAM,
              lineHeight: 1.5,
            }}>
              "To provide a panoramic view of global shifts, combining archival depth with immediate
              digital relevance. No fluff. No clickbait. Just the weight of the word."
            </p>
            <div style={{ height: 1, background: "rgba(251,249,244,0.25)", margin: "28px auto", maxWidth: 160 }} />
            <p style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(251,249,244,0.7)",
            }}>
              The Edified Editorial Charter, 2026
            </p>
          </div>
        </section>

        {/* ── Our Values ── */}
        <section style={{ maxWidth: 1536, margin: "0 auto", padding: "72px 40px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: RED,
            marginBottom: 40,
          }}>
            Our Values
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}>
            {VALUES.map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{
                  padding: 28,
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(251,249,244,0.09)"}
                onMouseLeave={e => e.currentTarget.style.background = CARD}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: RED, marginBottom: 16, display: "block" }}>
                  {icon}
                </span>
                <h3 style={{
                  fontFamily: "'Newsreader', serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: CREAM,
                  marginBottom: 10,
                }}>
                  {title}
                </h3>
                <p style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  color: MUTED,
                  lineHeight: 1.65,
                }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contributors  */}
        <section style={{ maxWidth: 1536, margin: "0 auto", padding: "72px 40px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: RED,
            marginBottom: 8,
          }}>
            Contributors
          </h2>
          <p style={{
            fontFamily: "'Newsreader', serif",
            fontSize: "clamp(26px, 3.5vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: CREAM,
            marginBottom: 40,
          }}>
            The team behind The Edified.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {CONTRIBUTORS.map(({ name, role, bio }) => (
              <div
                key={name}
                style={{
                  padding: 28,
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(251,249,244,0.09)"}
                onMouseLeave={e => e.currentTarget.style.background = CARD}
              >
                {/* Avatar */}
                <div style={{
                  width: 48,
                  height: 48,
                  background: RED,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{
                    fontFamily: "'Newsreader', serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: CREAM,
                  }}>
                    {name.charAt(0)}
                  </span>
                </div>
                <h3 style={{
                  fontFamily: "'Newsreader', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: CREAM,
                  marginBottom: 4,
                }}>
                  {name}
                </h3>
                <p style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: RED,
                  marginBottom: 14,
                }}>
                  {role}
                </p>
                <p style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  color: MUTED,
                  lineHeight: 1.65,
                }}>
                  {bio}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* History Timeline */}
        <section style={{ maxWidth: 1536, margin: "0 auto", padding: "72px 40px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: RED,
            marginBottom: 8,
          }}>
            Our Story
          </h2>
          <p style={{
            fontFamily: "'Newsreader', serif",
            fontSize: "clamp(22px, 3vw, 34px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: CREAM,
            marginBottom: 48,
          }}>
            Built in 2026. Built to last.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 720 }}>
            {[
              { year: "2024", text: "Idea conceived during a PBL project - frustrated with how hard it was to get unbiased, multi-perspective news in one place." },
              { year: "2025", text: "Built the RSS aggregation pipeline and the first version of the clustering engine using NLP-based similarity scoring." },
              { year: "2026", text: "The Edified launches publicly - with real-time story clustering, bias labeling, and the Blindspots section for underreported news." },
            ].map(({ year, text }) => (
              <div key={year} style={{
                display: "flex",
                gap: 32,
                padding: "24px 0",
                borderBottom: `1px solid ${BORDER}`,
              }}>
                <span style={{
                  fontFamily: "'Newsreader', serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: RED,
                  minWidth: 52,
                  flexShrink: 0,
                }}>
                  {year}
                </span>
                <p style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 14,
                  color: MUTED,
                  lineHeight: 1.7,
                }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section style={{ maxWidth: 1536, margin: "0 auto", padding: "72px 40px" }}>
          <h2 style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: RED,
            marginBottom: 8,
          }}>
            Get In Touch
          </h2>
          <p style={{
            fontFamily: "'Newsreader', serif",
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: CREAM,
            marginBottom: 32,
            letterSpacing: "-0.02em",
          }}>
            We'd love to hear from you.
          </p>
          <p style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 15,
            color: MUTED,
            lineHeight: 1.7,
            maxWidth: 520,
            marginBottom: 28,
          }}>
            For feedback, tips, editorial queries, or just to say hello - we read every message.
          </p>
          <a
            href="mailto:theedified@theedified.com"
            style={{
              display: "inline-block",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: CREAM,
              borderBottom: `2px solid ${RED}`,
              paddingBottom: 3,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.target.style.color = RED}
            onMouseLeave={e => e.target.style.color = CREAM}
          >
            theedified@theedified.com
          </a>
        </section>

      </main>

      {/* Dark-themed mini footer inside About */}
      <div style={{ background: "#12140f", padding: "28px 40px", borderTop: `1px solid ${BORDER}` }}>
        <p style={{
          textAlign: "center",
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(251,249,244,0.35)",
        }}>
          &reg; THE EDIFIED &middot; Est. 2026 &middot; Made with intent
        </p>
      </div>

    </div>
  );
}
