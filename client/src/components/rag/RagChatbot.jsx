import { useState, useRef, useEffect } from "react";
import { fetchRagAnswer, fetchRagHealth } from "../../api/stories";

/*
  RagChatbot.jsx
  Floating chatbot widget for The Edified.
  - Fixed bottom-right chat bubble visible on every page.
  - POST /api/rag/ask (Express on :5000 → Python FastAPI on :8000).
  - Shows answer + source citations. Matches editorial design system.
*/
const SUGGESTED_QUESTIONS = [
  "What's the latest in Indian politics?",
  "Any tech news today?",
  "What is happening in the economy?",
  "Show me today's top story",
];

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7, height: 7,
            borderRadius: "50%",
            background: "var(--c-on-surface-variant)",
            display: "inline-block",
            animation: `ragDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function SourceCard({ source }) {
  return (
    <a
      href={source.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        background: "var(--c-surface-container)",
        border: "1px solid var(--c-outline-variant)",
        borderRadius: 6,
        padding: "7px 10px",
        marginTop: 6,
        fontSize: 12,
        color: "var(--c-on-surface)",
        textDecoration: "none",
        transition: "background 0.15s",
        lineHeight: 1.4,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--c-surface-high)")}
      onMouseLeave={e => (e.currentTarget.style.background = "var(--c-surface-container)")}
    >
      <span style={{ fontWeight: 600, color: "var(--c-secondary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {source.source}
      </span>
      {source.category && (
        <span style={{ marginLeft: 6, fontSize: 10, color: "var(--c-on-surface-variant)", fontFamily: "'Public Sans', sans-serif" }}>
          {source.category}
        </span>
      )}
      <div style={{ marginTop: 2, fontFamily: "'Newsreader', serif", fontSize: 13, lineHeight: 1.3 }}>
        {source.headline}
      </div>
    </a>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      marginBottom: 14,
    }}>
      {/* Bubble */}
      <div style={{
        maxWidth: "88%",
        background: isUser ? "var(--c-on-surface)" : "var(--c-surface-low)",
        color: isUser ? "var(--c-bg)" : "var(--c-on-surface)",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: "10px 14px",
        fontFamily: "'Public Sans', sans-serif",
        fontSize: 14,
        lineHeight: 1.55,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {msg.typing ? <TypingDots /> : msg.content}
      </div>

      {/* Source citations */}
      {msg.sources && msg.sources.length > 0 && (
        <div style={{ width: "88%", marginTop: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--c-on-surface-variant)", marginBottom: 2, fontFamily: "'Public Sans', sans-serif" }}>
            Sources
          </div>
          {msg.sources.map((s, i) => <SourceCard key={i} source={s} />)}
        </div>
      )}

      {/* Model badge */}
      {msg.model_used && msg.model_used !== "none" && msg.model_used !== "error" && (
        <div style={{ fontSize: 10, color: "var(--c-on-surface-variant)", marginTop: 4, fontFamily: "'Public Sans', sans-serif" }}>
          via {msg.model_used === "groq" ? "Groq Llama 70B" : "Gemini 2.0 Flash"}
        </div>
      )}
    </div>
  );
}

export default function RagChatbot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm The Edified's news assistant. Ask me anything about recent news — politics, technology, sports, world events, and more.",
    }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [ragOk, setRagOk]     = useState(null); // null=unchecked, true/false
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      // Health check on first open
      if (ragOk === null) {
        fetchRagHealth()
          .then(r => setRagOk(r.data.status === "ok" && r.data.chunks > 0))
          .catch(() => setRagOk(false));
      }
    }
  }, [open]);

  async function sendMessage(question) {
    const q = (question || input).trim();
    if (!q || loading) return;
    setInput("");

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: q }]);
    // Add typing indicator
    setMessages(prev => [...prev, { role: "assistant", typing: true, content: "" }]);
    setLoading(true);

    try {
      const { data } = await fetchRagAnswer(q, { top_k: 6 });
      setMessages(prev => {
        const updated = [...prev];
        // Replace typing bubble
        updated[updated.length - 1] = {
          role:       "assistant",
          content:    data.answer,
          sources:    data.sources || [],
          model_used: data.model_used,
        };
        return updated;
      });
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || "Something went wrong.";
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role:    "assistant",
          content: `Sorry, I couldn't process that. ${errMsg.includes("unavailable") ? "Make sure the RAG server is running: python -m rag.api" : "Please try again."}`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Keyframe injection ── */}
      <style>{`
        @keyframes ragDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes ragSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .rag-send-btn:hover { background: var(--c-secondary-dim) !important; }
        .rag-clear-btn:hover { color: var(--c-secondary) !important; }
      `}</style>

      {/* ── Chat panel ── */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 88,
          right: 24,
          width: 380,
          maxWidth: "calc(100vw - 48px)",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--c-surface)",
          border: "2px solid var(--c-on-surface)",
          borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          zIndex: 9999,
          animation: "ragSlideUp 0.22s ease-out",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--c-outline-variant)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--c-on-surface)",
            color: "var(--c-bg)",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--c-bg)" }}>
              assistant
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                News Assistant
              </div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, opacity: 0.65, lineHeight: 1 }}>
                {ragOk === false ? "⚠ RAG server offline" : ragOk === true ? "● Powered by The Edified" : "The Edified"}
              </div>
            </div>
            <button
              className="rag-clear-btn"
              onClick={() => setMessages([{ role: "assistant", content: "Chat cleared. Ask me anything!" }])}
              title="Clear chat"
              style={{ background: "none", border: "none", color: "var(--c-bg)", opacity: 0.6, cursor: "pointer", padding: 4, fontSize: 12, fontFamily: "'Public Sans', sans-serif" }}
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "var(--c-bg)", cursor: "pointer", padding: 4, lineHeight: 1 }}
              aria-label="Close chat"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--c-bg)" }}>close</span>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 8px", display: "flex", flexDirection: "column" }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}

            {/* Suggested questions (only on first message) */}
            {messages.length === 1 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--c-on-surface-variant)", marginBottom: 8, fontFamily: "'Public Sans', sans-serif" }}>
                  Try asking:
                </div>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: "var(--c-surface-container)",
                      border: "1px solid var(--c-outline-variant)",
                      borderRadius: 8,
                      padding: "7px 12px",
                      marginBottom: 6,
                      fontSize: 13,
                      fontFamily: "'Public Sans', sans-serif",
                      color: "var(--c-on-surface)",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--c-surface-high)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--c-surface-container)")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid var(--c-outline-variant)",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            background: "var(--c-surface-low)",
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about today's news…"
              disabled={loading}
              style={{
                flex: 1,
                resize: "none",
                border: "1px solid var(--c-outline-variant)",
                borderRadius: 10,
                padding: "9px 12px",
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                lineHeight: 1.4,
                background: "var(--c-surface)",
                color: "var(--c-on-surface)",
                outline: "none",
                maxHeight: 100,
                overflowY: "auto",
              }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
            />
            <button
              className="rag-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send"
              style={{
                background: loading || !input.trim() ? "var(--c-outline-variant)" : "var(--c-secondary)",
                border: "none",
                borderRadius: 10,
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: loading || !input.trim() ? "default" : "pointer",
                transition: "background 0.15s",
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fff" }}>
                send
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close news assistant" : "Open news assistant"}
        title="Ask The Edified"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--c-on-surface)",
          color: "var(--c-bg)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          zIndex: 10000,
          transition: "background 0.2s, transform 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--c-secondary)")}
        onMouseLeave={e => (e.currentTarget.style.background = "var(--c-on-surface)")}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 26, color: "var(--c-bg)" }}>
          {open ? "close" : "forum"}
        </span>
      </button>
    </>
  );
}
