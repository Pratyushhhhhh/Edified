import { Link } from "react-router-dom";

const DARK   = "#1c1e17";
const CREAM  = "#fbf9f4";
const MUTED  = "rgba(251,249,244,0.55)";
const BORDER = "rgba(251,249,244,0.14)";
const RED    = "#b6271a";

export default function Footer() {
  return (
    <footer
      id="site-footer"
      style={{
        background: DARK,
        borderTop: `3px solid ${RED}`,
        padding: "40px 40px 28px",
      }}
    >
      <div style={{ maxWidth: 1536, margin: "0 auto" }}>

        {/* Masthead */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <p style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            color: CREAM,
          }}>
            THE EDIFIED
          </p>
          <p style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: MUTED,
            marginTop: 6,
            fontFamily: "'Public Sans', sans-serif",
          }}>
            Est. 2026 &middot; Digital Broadsheet
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: BORDER, maxWidth: 480, margin: "20px auto 32px" }} />

        {/* 3-column grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 40,
          marginBottom: 32,
        }}>

          {/* Our Mission */}
          <div style={{ textAlign: "center" }}>
            <h4 style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 12,
              color: RED,
            }}>
              Our Mission
            </h4>
            <p style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: MUTED,
              fontFamily: "'Public Sans', sans-serif",
            }}>
              Edified is a centralized platform to access similar information from multiple news
              outlets, providing users to step out of their bubble and gain a divergent perspective
              and ascertain their topic or media biasness.
            </p>
          </div>

          {/* Contributors */}
          <div style={{ textAlign: "center" }}>
            <h4 style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 12,
              color: RED,
            }}>
              Contributors
            </h4>
            <p style={{ fontSize: 13, lineHeight: 2.0, color: MUTED, fontFamily: "'Public Sans', sans-serif" }}>
              Pratyush Bansal &middot; Palak Lohani<br />
              Raj Aryan Verma &middot; Diya Negi
            </p>
          </div>

          {/* Navigate */}
          <div style={{ textAlign: "center" }}>
            <h4 style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 12,
              color: RED,
            }}>
              Navigate
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              {[
                { label: "Home",       to: "/" },
                { label: "Location",   to: "/location" },
                { label: "Blindspots", to: "/blindspots" },
                { label: "About Us",   to: "/about" },
              ].map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: MUTED,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => e.target.style.color = CREAM}
                  onMouseLeave={e => e.target.style.color = MUTED}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom divider + copyright */}
        <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />
        <p style={{
          textAlign: "center",
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: MUTED,
        }}>
          &reg; THE EDIFIED. All Rights Reserved. Trademarks of The Edified Authority. &middot; &copy; {new Date().getFullYear()}
        </p>

      </div>
    </footer>
  );
}
