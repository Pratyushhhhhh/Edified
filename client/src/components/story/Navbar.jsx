import { Link, useLocation, useNavigate } from "react-router-dom";

const PRIMARY_LINKS = [
  { label: "Home", to: "/" },
  { label: "Location", to: "/location" },
  { label: "Blindspots", to: "/blindspots" },
];

const HOME_CATEGORIES = [
  { label: "General", val: "general", icon: "newspaper" },
  { label: "World", val: "world", icon: "public" },
  { label: "Politics", val: "politics", icon: "gavel" },
  { label: "Business", val: "business", icon: "payments" },
  { label: "Culture", val: "culture", icon: "theater_comedy" },
  { label: "Science", val: "science", icon: "science" },
  { label: "Health", val: "health", icon: "health_and_safety" },
  { label: "Technology", val: "technology", icon: "devices" },
];

const CITIES = [
  "Delhi", "Mumbai", "Bangalore", "Kolkata", "Chennai", "Hyderabad",
  "Pune", "Ahmedabad", "Jaipur", "Lucknow",
];

export default function Navbar({
  activeCategory,
  onCategoryChange,
  activeCity,
  onCityChange,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";
  const isLocation = location.pathname === "/location";
  const isBlindspots = location.pathname === "/blindspots";

  const activePath = location.pathname;

  return (
    <header>
      {/* ── Primary navigation bar ── */}
      <nav className="top-nav">
        <div className="top-nav-inner">
          {/* Row 1: icons + masthead */}
          <div className="top-nav-row1">
            <div style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--c-outline)",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </div>

            <span
              className="nav-masthead"
              onClick={() => navigate("/")}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate("/")}
            >
              The Edified
            </span>

            <button className="nav-icon-btn" aria-label="Account">
              <span className="material-symbols-outlined" style={{
                fontSize: 28,
              }}>account_circle</span>
            </button>
          </div>

          {/* Row 2: primary page links */}
          <div className="primary-nav">
            {PRIMARY_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`primary-nav-link${activePath === to ? " active" : ""}`}
              >
                {label}
              </Link>
            ))}
            <a
              href="#site-footer"
              className="primary-nav-link"
            >
              About Us
            </a>
          </div>
        </div>
      </nav>

      {/* Secondary nav: category tabs (Home & Blindspots) */}
      {(isHome || isBlindspots) && (
        <div className="secondary-nav">
          <div className="secondary-nav-inner">
            <button
              className={`secondary-nav-link${(!activeCategory || activeCategory === "all") ? " active" : ""}`}
              onClick={() => onCategoryChange?.("all")}
            >
              All
            </button>
            {HOME_CATEGORIES.map(({ label, val }) => (
              <button
                key={val}
                className={`secondary-nav-link${activeCategory === val ? " active" : ""}`}
                onClick={() => onCategoryChange?.(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Secondary nav: city tabs (Location) */}
      {isLocation && (
        <div className="secondary-nav">
          <div className="secondary-nav-inner">
            {CITIES.map((city) => (
              <button
                key={city}
                className={`secondary-nav-link${activeCity === city.toLowerCase() ? " active" : ""}`}
                onClick={() => onCityChange?.(city.toLowerCase())}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}