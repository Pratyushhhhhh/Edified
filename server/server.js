require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const storiesRouter = require("./routes/stories");
const contrastRouter = require("./routes/contrast");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "The Edified API is running" });
});

// Cluster / home page feed
// GET /api/stories          → paginated story cards
// GET /api/stories/:id      → single story (raw)
app.use("/api/stories", storiesRouter);

// Contrast page detail view
// GET /api/contrast/:storyId → full story shaped for contrast page
app.use("/api/contrast", contrastRouter);

// ── Error handling (must be last) ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});