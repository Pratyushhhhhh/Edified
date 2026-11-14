/**
 * Shared chat UI primitives used by both:
 *  - StoryChat (story-specific, inside /story/:id)
 *  - ChatPage  (full-page /chat route accessible from navbar)
 */

import { useState, useRef, useEffect } from "react";
import { fetchRagAnswer } from "../../api/stories";

// ── Shared sub-components ────────────────────────────────────────────────────

export function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--c-on-surface-variant)",
          display: "inline-block",
          animation: `ragDot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  );
}

export function SourceCard({ source }) {
  return (
    <a href={source.url || "#"} target="_blank" rel="noopener noreferrer"
      style={{
        display: "block", background: "var(--c-surface-container)",
        border: "1px solid var(--c-outline-variant)", borderRadius: 6,
        padding: "7px 10px", marginTop: 6, fontSize: 12,
        color: "var(--c-on-surface)", textDecoration: "none",
        transition: "background 0.15s", lineHeight: 1.4,
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

export function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", marginBottom: 14 }}>
      <div style={{
        maxWidth: "88%",
        background: isUser ? "var(--c-on-surface)" : "var(--c-surface-low)",
        color: isUser ? "var(--c-bg)" : "var(--c-on-surface)",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: "10px 14px", fontFamily: "'Public Sans', sans-serif",
        fontSize: 14, lineHeight: 1.55, boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {msg.typing ? <TypingDots /> : msg.content}
      </div>
      {msg.sources && msg.sources.length > 0 && (
        <div style={{ width: "88%", marginTop: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--c-on-surface-variant)", marginBottom: 2, fontFamily: "'Public Sans', sans-serif" }}>
            Sources
          </div>
          {msg.sources.map((s, i) => <SourceCard key={i} source={s} />)}
        </div>
      )}
      {msg.model_used && msg.model_used !== "none" && msg.model_used !== "error" && (
        <div style={{ fontSize: 10, color: "var(--c-on-surface-variant)", marginTop: 4, fontFamily: "'Public Sans', sans-serif" }}>
          via {msg.model_used === "openrouter" ? "OpenRouter" : "Gemini 3.8 Flash"}
        </div>
      )}
    </div>
  );
}

export function ChatInput({ input, setInput, onSend, loading, placeholder = "Ask about the news…", autoFocus = false }) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
    }
  }, [autoFocus]);

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: "10px 12px", borderTop: "1px solid var(--c-outline-variant)", background: "var(--c-surface-low)" }}>
      <textarea
        ref={inputRef}
        rows={1}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        disabled={loading}
        style={{
          flex: 1, resize: "none", border: "1px solid var(--c-outline-variant)",
          borderRadius: 10, padding: "9px 12px", fontFamily: "'Public Sans', sans-serif",
          fontSize: 14, lineHeight: 1.4, background: "var(--c-surface)",
          color: "var(--c-on-surface)", outline: "none", maxHeight: 100, overflowY: "auto",
        }}
        onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
      />
      <button
        onClick={onSend}
        disabled={loading || !input.trim()}
        style={{
          background: loading || !input.trim() ? "var(--c-outline-variant)" : "var(--c-secondary)",
          border: "none", borderRadius: 10, width: 40, height: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: loading || !input.trim() ? "default" : "pointer", transition: "background 0.15s", flexShrink: 0,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fff" }}>send</span>
      </button>
    </div>
  );
}

// ── Core chat logic hook ──────────────────────────────────────────────────────

export function useChat(initialGreeting, extraContext = null) {
  const [messages, setMessages] = useState([{ role: "assistant", content: initialGreeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const isInitialMount = useRef(true);

  // Only auto-scroll when user sends messages or receives replies, NOT on initial page load
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  async function sendMessage(question) {
    const q = (question || input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setMessages(prev => [...prev, { role: "assistant", typing: true, content: "" }]);
    setLoading(true);

    try {
      const requestOptions = { top_k: 6 };
      if (extraContext?.story) {
        requestOptions.cluster_id = extraContext.story._id;
        requestOptions.cluster_context = {
          headline: extraContext.story.headline,
          category: extraContext.story.category,
          summary: extraContext.story.summary,
          articles: extraContext.story.articles?.slice(0, 10).map((a) => ({
            title: a.title,
            source_name: a.source_name || a.source,
            snippet: a.summary_meta || a.snippet,
            real_url: a.real_url || a.url,
            biasLabel: a.biasLabel,
          })),
        };
      }

      const { data } = await fetchRagAnswer(q, requestOptions);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant", content: data.answer,
          sources: data.sources || [], model_used: data.model_used,
        };
        return updated;
      });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't reach the news assistant. Make sure the RAG server is running.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function clearChat(greeting) {
    setMessages([{ role: "assistant", content: greeting }]);
  }

  return { messages, input, setInput, loading, bottomRef, sendMessage, clearChat };
}

