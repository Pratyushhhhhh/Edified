/**
 * server/routes/rag.js
 * ─────────────────────
 * Proxy route: forwards all /api/rag/* requests from the Express server
 * (port 5000) to the Python FastAPI RAG server (port 8000).
 *
 * This keeps the React frontend talking to a single origin (port 5000)
 * and avoids any CORS complexity between the two backends.
 */

const express  = require("express");
const router   = express.Router();
const https    = require("https");
const http     = require("http");

const RAG_BASE = process.env.RAG_API_URL || "http://localhost:8000";

/**
 * Generic proxy helper: forward req → RAG server, pipe response back.
 */
async function proxyToRag(req, res) {
  const targetUrl = `${RAG_BASE}${req.originalUrl}`;

  try {
    // Use native node http/https so we don't need extra deps
    const url     = new URL(targetUrl);
    const isHttps = url.protocol === "https:";
    const lib     = isHttps ? https : http;

    const body = req.method === "POST" ? JSON.stringify(req.body) : undefined;

    const options = {
      hostname: url.hostname,
      port:     url.port || (isHttps ? 443 : 80),
      path:     url.pathname + url.search,
      method:   req.method,
      headers: {
        "Content-Type":  "application/json",
        "Accept":        "application/json",
        ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
      },
    };

    const proxyReq = lib.request(options, (proxyRes) => {
      res.status(proxyRes.statusCode || 500);
      res.set("Content-Type", "application/json");

      let data = "";
      proxyRes.on("data", (chunk) => (data += chunk));
      proxyRes.on("end", () => {
        try {
          res.json(JSON.parse(data));
        } catch {
          res.send(data);
        }
      });
    });

    proxyReq.on("error", (err) => {
      console.error("[RAG proxy] Connection error:", err.message);
      res.status(503).json({
        error: "RAG service unavailable",
        detail: "The Python RAG server is not running. Start it with: python -m rag.api",
      });
    });

    if (body) proxyReq.write(body);
    proxyReq.end();

  } catch (err) {
    console.error("[RAG proxy] Unexpected error:", err);
    res.status(500).json({ error: "Proxy error", detail: err.message });
  }
}

// Forward all RAG routes
router.get("/health",  proxyToRag);
router.post("/ask",    proxyToRag);
router.post("/ingest", proxyToRag);

module.exports = router;

