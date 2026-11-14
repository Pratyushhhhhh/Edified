/**
 * StoryChat.jsx
 * Story-specific RAG chat button — only appears on /story/:id.
 * Uses the story's headline, category, and articles as context.
 * Opens a comfortable, wide slide-up drawer anchored to the bottom-right.
 */

import { useState } from "react";
import { ChatMessage, ChatInput, useChat } from "./ChatCore";

function getSuggestedQuestions(story) {
  const sources = (story?.articles || [])
    .map(a => a.source_name || a.source)
    .filter(Boolean);
  const uniqueSources = [...new Set(sources)];

  const compareQuestion = uniqueSources.length >= 2
    ? `How do ${uniqueSources[0]} and ${uniqueSources[1]} frame this differently?`
    : `How are different news outlets framing this story?`;

  return [
    `What is the main event and latest development?`,
    compareQuestion,
    `What are the key verified facts, numbers, and dates?`,
    `What is the overall bias and perspective across the reporting outlets?`,
  ];
}

export default function StoryChat({ story }) {
  const [open, setOpen] = useState(false);

  const headline = story?.headline || "this story";
  const greeting = `I've read all ${story?.articleCount || "the"} articles in this cluster.\n\nAsk me anything about "${headline.slice(0, 75)}${headline.length > 75 ? "…" : ""}" — key facts, how outlets differ, or underlying bias.`;

  const { messages, input, setInput, loading, bottomRef, sendMessage, clearChat } = useChat(
    greeting,
    { story }
  );

  const suggested = getSuggestedQuestions(story);

  if (!story) return null;

  return (
    <>
      <style>{`
        @keyframes ragDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes storyChat { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

      {/* ── Chat drawer (widened for easy reading) ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 24,
          width: 480, maxWidth: "calc(100vw - 36px)", maxHeight: "78vh",
          display: "flex", flexDirection: "column",
          background: "var(--c-surface)", border: "2px solid var(--c-on-surface)",
          borderRadius: 18, boxShadow: "0 12px 48px rgba(0,0,0,0.22)",
          zIndex: 9999, animation: "storyChat 0.22s ease-out", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "15px 18px", borderBottom: "1px solid var(--c-outline-variant)",
            display: "flex", alignItems: "center", gap: 12,
            background: "var(--c-on-surface)", color: "var(--c-bg)",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--c-bg)" }}>article</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.65, lineHeight: 1 }}>
                {story.category} · {story.articleCount} sources
              </div>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: 15, fontWeight: 700, lineHeight: 1.25, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {story.headline}
              </div>
            </div>
            <button onClick={() => clearChat(greeting)} title="Clear chat"
              style={{ background: "none", border: "none", color: "var(--c-bg)", opacity: 0.6, cursor: "pointer", fontSize: 11, fontFamily: "'Public Sans', sans-serif", padding: "4px 8px" }}>
              Clear
            </button>
            <button onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "var(--c-bg)", cursor: "pointer", padding: 4, lineHeight: 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--c-bg)" }}>close</span>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 8px", display: "flex", flexDirection: "column" }}>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}

            {/* Suggested questions — only on first message */}
            {messages.length === 1 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-on-surface-variant)", marginBottom: 10, fontFamily: "'Public Sans', sans-serif" }}>
                  Questions about this story:
                </div>
                {suggested.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      background: "var(--c-surface-container)", border: "1px solid var(--c-outline-variant)",
                      borderRadius: 10, padding: "10px 14px", marginBottom: 8,
                      fontSize: 13.5, fontFamily: "'Public Sans', sans-serif", lineHeight: 1.45,
                      color: "var(--c-on-surface)", cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--c-surface-high)"; e.currentTarget.style.borderColor = "var(--c-outline)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--c-surface-container)"; e.currentTarget.style.borderColor = "var(--c-outline-variant)"; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => sendMessage()}
            loading={loading}
            placeholder="Ask anything about this story…"
            autoFocus={true}
          />
        </div>
      )}

      {/* ── Wider, readable trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Ask AI about this story"
        style={{
          position: "fixed", bottom: 24, right: 24,
          display: "flex", alignItems: "center", gap: 10,
          background: open ? "var(--c-secondary)" : "var(--c-on-surface)",
          color: "var(--c-bg)", border: "none", borderRadius: 32,
          padding: "14px 22px 14px 18px", cursor: "pointer",
          minWidth: 160,
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)", zIndex: 10000,
          fontFamily: "'Public Sans', sans-serif", fontSize: 13.5, fontWeight: 700,
          letterSpacing: "0.05em", transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
        }}
        onMouseEnter={e => {
          if (!open) e.currentTarget.style.background = "var(--c-secondary)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={e => {
          if (!open) e.currentTarget.style.background = "var(--c-on-surface)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--c-bg)" }}>
          {open ? "close" : "forum"}
        </span>
        <span>{open ? "Close Chat" : "Ask AI About Story"}</span>
      </button>
    </>
  );
}
