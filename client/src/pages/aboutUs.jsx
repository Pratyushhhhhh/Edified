import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";

const DARK   = "#1c1e17";
const CREAM  = "#fbf9f4";
const RED    = "#b6271a";
const MUTED  = "rgba(251,249,244,0.65)";
const BORDER = "rgba(251,249,244,0.14)";
const CARD   = "rgba(251,249,244,0.05)";
const CARD_HOVER = "rgba(251,249,244,0.08)";

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

const FEATURES = [
  {
    tag: "Core Engine",
    icon: "hub",
    title: "Multi-Source Event Clustering",
    desc: "Instead of drowning readers in dozens of duplicate headlines from competing outlets, our semantic engine vectorizes incoming news in real time, clustering related reports into a single, comprehensive story dossier.",
    highlight: "Synthesizes 30+ regional & national feeds into clean story events",
  },
  {
    tag: "Editorial Contrast",
    icon: "compare_arrows",
    title: "Perspective Contrast & Spectrum",
    desc: "Break out of filter bubbles. The Edified algorithmically surfaces how different outlets frame the exact same event side-by-side, revealing rhetoric divergence, ideological slants, and areas of consensus.",
    highlight: "Side-by-side framing analysis to understand media narratives",
  },
  {
    tag: "Factual Synthesis",
    icon: "format_list_numbered",
    title: "Information-Dense 3-Point Summaries",
    desc: "No fluff, no clickbait. Every major cluster is synthesized into three source-cited points: the Mainstream Narrative, Diverging Perspectives, and Verified Hard Facts (dates, numbers, direct statements, and decisions).",
    highlight: "Source-cited paragraphs keeping readers informed in under 60 seconds",
  },
  {
    tag: "Unbiased Radar",
    icon: "visibility_off",
    title: "The Blindspots Section",
    desc: "What is the mainstream media ignoring? Our Blindspots radar actively surfaces high-impact events reported by only one or two regional or independent outlets before they vanish from public view.",
    highlight: "Empowering underreported independent and regional journalism",
  },
  {
    tag: "Conversational AI",
    icon: "psychology",
    title: "Grounded RAG Intelligence",
    desc: "Have questions about breaking developments? Our conversational assistant uses Retrieval-Augmented Generation (RAG) to query our verified news database, returning factual answers with direct source citations.",
    highlight: "Zero hallucinations: answers grounded exclusively on verified reporting",
  },
];

const CONTRIBUTORS = [
  {
    name: "Pratyush",
    role: "Founder & Lead Developer",
    bio: "Built The Edified from scratch — backend ingestion pipeline, clustering engine, RAG microservice, and full-stack architecture powering the broadsheet.",
  },
  {
    name: "Palak",
    role: "Editorial Lead",
    bio: "Shapes the editorial voice and perspective contrast framework. Ensures every cluster reflects journalistic balance and reader-first clarity.",
  },
  {
    name: "Raj",
    role: "Data & Infrastructure",
    bio: "Maintains database integrity, vector embedding pipelines, and server reliability. Keeps the news processing machinery operating smoothly.",
  },
  {
    name: "Diya",
    role: "Design & UX",
    bio: "Crafted the visual identity of The Edified — blending classic archival broadsheet aesthetics with seamless modern interactive typography.",
  },
];

const AI_SUGGESTIONS = [
  "What is the mainstream narrative on today's top story?",
  "Compare different media perspectives on the economy",
  "What are the verified facts on recent tech regulations?",
  "What important news is being underreported right now?",
];

export default function AboutUs() {
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState("");

  const handleAiSearch = (e) => {
    e?.preventDefault();
    const q = aiQuery.trim();
    if (!q) return;
    navigate(`/chat?q=${encodeURIComponent(q)}`);
  };

  const handleSuggestionClick = (query) => {
    navigate(`/chat?q=${encodeURIComponent(query)}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: CREAM }}>
      <Navbar />

      <main>
        {/* ── 1. Hero ── */}
        <section style={{
          padding: "88px 40px 72px",
          borderBottom: `1px solid ${BORDER}`,
          maxWidth: 1536,
          margin: "0 auto",
        }}>
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
            fontSize: "clamp(42px, 6.5vw, 84px)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.98,
            color: CREAM,
            maxWidth: 960,
            marginBottom: 32,
          }}>
            Rigorous inquiry for a nuanced world.
          </h1>
          <p style={{
            fontFamily: "'Newsreader', serif",
            fontSize: "clamp(18px, 2.2vw, 24px)",
            fontStyle: "italic",
            color: MUTED,
            lineHeight: 1.6,
            maxWidth: 760,
            marginBottom: 0,
          }}>
            The Edified was founded on a simple, radical premise: that readers deserve journalism
            which treats complexity as a feature, not a bug. A digital broadsheet for citizens who
            refuse to settle for headlines.
          </p>
        </section>

        {/* ── 2. Interactive "Ask AI About the News" Search Bar ── */}
        <section style={{
          background: "rgba(0, 0, 0, 0.25)",
          padding: "54px 40px",
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <span style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: RED,
                display: "block",
                marginBottom: 8,
              }}>
                Conversational News Intelligence
              </span>
              <h2 style={{
                fontFamily: "'Newsreader', serif",
                fontSize: "clamp(26px, 3.5vw, 38px)",
                fontWeight: 700,
                color: CREAM,
                letterSpacing: "-0.02em",
                margin: 0,
              }}>
                Ask AI About Today's News
              </h2>
              <p style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                color: MUTED,
                marginTop: 8,
              }}>
                Ask any question — get balanced, synthesized answers with verified article citations.
              </p>
            </div>

            {/* Search Input Box */}
            <form onSubmit={handleAiSearch} style={{
              display: "flex",
              alignItems: "center",
              background: "#262920",
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: "6px 8px 6px 20px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}>
              <span className="material-symbols-outlined" style={{
                color: RED,
                fontSize: 24,
                marginRight: 14,
                flexShrink: 0,
              }}>
                search_spark
              </span>
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask about breaking events, contrast perspectives, or verify facts..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: CREAM,
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 15,
                  padding: "10px 0",
                }}
              />
              <button
                type="submit"
                style={{
                  background: RED,
                  color: CREAM,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 24px",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "background 0.2s, transform 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#d32f2f"}
                onMouseLeave={e => e.currentTarget.style.background = RED}
              >
                <span>Ask AI</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </button>
            </form>

            {/* Clickable Suggestion Pills */}
            <div style={{
              marginTop: 20,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
            }}>
              <span style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(251,249,244,0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                alignSelf: "center",
              }}>
                Try Asking:
              </span>
              {AI_SUGGESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(q)}
                  style={{
                    background: "rgba(251,249,244,0.06)",
                    border: "1px solid rgba(251,249,244,0.12)",
                    borderRadius: 20,
                    padding: "6px 14px",
                    color: MUTED,
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(251,249,244,0.14)";
                    e.currentTarget.style.color = CREAM;
                    e.currentTarget.style.borderColor = RED;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(251,249,244,0.06)";
                    e.currentTarget.style.color = MUTED;
                    e.currentTarget.style.borderColor = "rgba(251,249,244,0.12)";
                  }}
                >
                  {q} &rarr;
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. Editorial Charter Quote ── */}
        <section style={{ background: RED, padding: "64px 40px" }}>
          <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
            <p style={{
              fontFamily: "'Newsreader', serif",
              fontSize: "clamp(20px, 3vw, 32px)",
              fontStyle: "italic",
              color: CREAM,
              lineHeight: 1.5,
              margin: 0,
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
              color: "rgba(251,249,244,0.75)",
              margin: 0,
            }}>
              The Edified Editorial Charter, 2026
            </p>
          </div>
        </section>

        {/* ── 4. Platform Features Showcase ("Sell the Site") ── */}
        <section style={{
          maxWidth: 1536,
          margin: "0 auto",
          padding: "84px 40px",
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ maxWidth: 800, marginBottom: 54 }}>
            <span style={{
              display: "block",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: RED,
              marginBottom: 12,
            }}>
              Why The Edified Matters
            </span>
            <h2 style={{
              fontFamily: "'Newsreader', serif",
              fontSize: "clamp(32px, 4.5vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: CREAM,
              marginBottom: 18,
            }}>
              Architecture of Nuance in an Era of Sensationalism.
            </h2>
            <p style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 15,
              color: MUTED,
              lineHeight: 1.7,
            }}>
              Modern news feeds are built to provoke reactions. The Edified is engineered for comprehension.
              Explore how our automated clustering, perspective analysis, and source-grounded intelligence reconstruct the digital newsroom.
            </p>
          </div>

          {/* Features Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
          }}>
            {FEATURES.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  padding: 32,
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "background 0.2s, transform 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = CARD_HOVER;
                  e.currentTarget.style.borderColor = "rgba(251,249,244,0.28)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = CARD;
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: 32,
                      color: RED,
                    }}>
                      {feat.icon}
                    </span>
                    <span style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: RED,
                      background: "rgba(182, 39, 26, 0.15)",
                      padding: "4px 8px",
                      borderRadius: 4,
                    }}>
                      {feat.tag}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: "'Newsreader', serif",
                    fontSize: 24,
                    fontWeight: 700,
                    color: CREAM,
                    marginBottom: 12,
                    letterSpacing: "-0.015em",
                  }}>
                    {feat.title}
                  </h3>

                  <p style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 13.5,
                    color: MUTED,
                    lineHeight: 1.68,
                    marginBottom: 20,
                  }}>
                    {feat.desc}
                  </p>
                </div>

                <div style={{
                  paddingTop: 16,
                  borderTop: `1px solid rgba(251,249,244,0.08)`,
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(251,249,244,0.85)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: RED }}>check_circle</span>
                  <span>{feat.highlight}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Our Values ── */}
        <section style={{
          maxWidth: 1536,
          margin: "0 auto",
          padding: "80px 40px",
          borderBottom: `1px solid ${BORDER}`,
        }}>
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
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
                onMouseEnter={e => e.currentTarget.style.background = CARD_HOVER}
                onMouseLeave={e => e.currentTarget.style.background = CARD}
              >
                <span className="material-symbols-outlined" style={{
                  fontSize: 28,
                  color: RED,
                  marginBottom: 16,
                  display: "block",
                }}>
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

        {/* ── 6. The Team Behind The Edified (At the Very Last) ── */}
        <section style={{
          maxWidth: 1536,
          margin: "0 auto",
          padding: "80px 40px 96px",
        }}>
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
            marginBottom: 44,
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
                onMouseEnter={e => e.currentTarget.style.background = CARD_HOVER}
                onMouseLeave={e => e.currentTarget.style.background = CARD}
              >
                {/* Avatar Initial */}
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
      </main>

      {/* BroadSheet Dark Footer */}
      <div style={{
        background: "#12140f",
        padding: "32px 40px",
        borderTop: `1px solid ${BORDER}`,
      }}>
        <p style={{
          textAlign: "center",
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(251,249,244,0.35)",
          margin: 0,
        }}>
          &reg; THE EDIFIED &middot; Est. 2026 &middot; Rigorous inquiry for a nuanced world
        </p>
      </div>
    </div>
  );
}
